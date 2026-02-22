
"use client"

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { 
  Users, 
  Download, 
  AlertTriangle, 
  Clock, 
  FileSpreadsheet,
  Plus,
  Loader2
} from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';

const COLORS = ['#002D62', '#005EB8', '#ECAC17', '#2ECC71'];

export function AdminView() {
  const db = useFirestore();

  // Query all tickets
  const allTicketsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'tickets'), orderBy('createdAt', 'desc'));
  }, [db]);

  const { data: tickets, isLoading: isTicketsLoading } = useCollection(allTicketsQuery);

  // Stats calculation
  const stats = useMemo(() => {
    if (!tickets) return { total: 0, resolved: 0, pending: 0, new: 0, deptData: [], statusData: [] };
    
    const total = tickets.length;
    const resolved = tickets.filter(t => t.status === 'Resolved').length;
    const pending = tickets.filter(t => t.status === 'Pending').length;
    const isNew = tickets.filter(t => t.status === 'New').length;

    const deptMap: Record<string, number> = {};
    const statusMap: Record<string, number> = { 'New': 0, 'Pending': 0, 'Resolved': 0 };

    tickets.forEach(t => {
      deptMap[t.serviceType] = (deptMap[t.serviceType] || 0) + 1;
      statusMap[t.status] = (statusMap[t.status] || 0) + 1;
    });

    const deptData = Object.entries(deptMap).map(([name, tickets]) => ({ name, tickets }));
    const statusData = Object.entries(statusMap).map(([name, value]) => ({ 
      name: name === 'New' ? 'جديد' : name === 'Pending' ? 'قيد الانتظار' : 'تم الحل', 
      value 
    }));

    return { total, resolved, pending, new: isNew, deptData, statusData };
  }, [tickets]);

  const overdueTickets = tickets?.filter(t => t.status !== 'Resolved' && (Date.now() - new Date(t.createdAt).getTime() > 86400000)) || [];

  const exportToCSV = () => {
    if (!tickets) return;
    const headers = "TicketID,Customer,CIF,Status,Department,CreatedAt\n";
    const rows = tickets.map(t => 
      `${t.ticketID},${t.customerName},${t.cif},${t.status},${t.serviceType},${t.createdAt}`
    ).join("\n");
    
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `تقارير_التذاكر_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-primary">غرفة تحكم المدير</h1>
          <p className="text-muted-foreground">مراقبة وإشراف على مستوى النظام</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToCSV} disabled={isTicketsLoading}>
            <Download className="w-4 h-4 ml-2" /> تصدير CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-primary text-white">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs opacity-80 uppercase font-bold tracking-wider text-right">إجمالي التذاكر</p>
                <h3 className="text-3xl font-bold mt-1 text-right">{stats.total}</h3>
              </div>
              <FileSpreadsheet className="w-8 h-8 opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider text-right">تم الحل</p>
                <h3 className="text-3xl font-bold mt-1 text-right text-green-600">{stats.resolved}</h3>
              </div>
              <Clock className="w-8 h-8 text-secondary opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider text-right">قيد المعالجة</p>
                <h3 className="text-3xl font-bold mt-1 text-right text-accent">{stats.pending}</h3>
              </div>
              <AlertTriangle className="w-8 h-8 text-accent opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider text-right">تذاكر جديدة</p>
                <h3 className="text-3xl font-bold mt-1 text-right">{stats.new}</h3>
              </div>
              <Users className="w-8 h-8 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="text-right">
            <CardTitle>توزيع الأقسام</CardTitle>
            <CardDescription>حجم التذاكر حسب القسم</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.deptData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis orientation="right" />
                  <Tooltip />
                  <Bar dataKey="tickets" fill="#005EB8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="text-right">
            <CardTitle>حالة الحل</CardTitle>
            <CardDescription>توزيع شامل لحالات التذاكر</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center flex-row-reverse">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {stats.statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-red-100 bg-red-50/10">
        <CardHeader className="flex flex-row items-center justify-between flex-row-reverse">
          <div className="text-right">
            <CardTitle className="text-red-700 flex items-center gap-2 justify-end">
              أولوية عالية: تذاكر متأخرة <AlertTriangle className="w-5 h-5" />
            </CardTitle>
            <CardDescription>تذاكر نشطة لأكثر من 24 ساعة دون حل</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">رقم التذكرة</TableHead>
                <TableHead className="text-right">القسم</TableHead>
                <TableHead className="text-right">العميل</TableHead>
                <TableHead className="text-right">تاريخ الإنشاء</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {overdueTickets.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-bold text-red-700">{t.ticketID}</TableCell>
                  <TableCell><Badge variant="outline">{t.serviceType}</Badge></TableCell>
                  <TableCell>{t.customerName}</TableCell>
                  <TableCell className="text-xs">{new Date(t.createdAt).toLocaleString('ar-SA')}</TableCell>
                  <TableCell className="text-xs text-red-600 font-bold">{t.status === 'New' ? 'جديد' : 'قيد الانتظار'}</TableCell>
                </TableRow>
              ))}
              {overdueTickets.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4 text-green-600">لا توجد تذاكر متأخرة حالياً</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
