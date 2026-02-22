"use client"

import React from 'react';
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
  CheckCircle,
  FileSpreadsheet,
  Plus
} from 'lucide-react';
import { MOCK_TICKETS, MOCK_USERS } from '@/lib/mock-data';

const COLORS = ['#002D62', '#005EB8', '#ECAC17', '#2ECC71'];

export function AdminView() {
  const statsData = [
    { name: 'البطاقات', tickets: 12 },
    { name: 'الرقمية', tickets: 19 },
    { name: 'العمليات', tickets: 8 },
  ];

  const statusData = [
    { name: 'جديد', value: 4 },
    { name: 'قيد الانتظار', value: 12 },
    { name: 'تم الحل', value: 34 },
    { name: 'مصعد', value: 2 },
  ];

  const overdueTickets = MOCK_TICKETS.filter(t => t.status !== 'Resolved' && (Date.now() - t.createdAt > 86400000));

  const exportToCSV = () => {
    const headers = "TicketID,Customer,CIF,Status,Department,CreatedAt\n";
    const rows = MOCK_TICKETS.map(t => 
      `${t.ticketID},${t.customerName},${t.CIF},${t.status},${t.department},${new Date(t.createdAt).toISOString()}`
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
          <Button variant="outline" onClick={exportToCSV}>
            <Download className="w-4 h-4 ml-2" /> تصدير CSV
          </Button>
          <Button className="bg-primary text-white">
            <Plus className="w-4 h-4 ml-2" /> مستخدم جديد
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-primary text-white">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs opacity-80 uppercase font-bold tracking-wider text-right">إجمالي التذاكر</p>
                <h3 className="text-3xl font-bold mt-1 text-right">1,284</h3>
              </div>
              <FileSpreadsheet className="w-8 h-8 opacity-20" />
            </div>
            <p className="text-xs mt-4 font-medium text-right">+12% من الشهر الماضي</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider text-right">متوسط الحل</p>
                <h3 className="text-3xl font-bold mt-1 text-right">4.2 ساعة</h3>
              </div>
              <Clock className="w-8 h-8 text-secondary opacity-20" />
            </div>
            <p className="text-xs mt-4 text-green-600 font-medium text-right">↓ تحسن بنسبة 15%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider text-right">غير المحلولة</p>
                <h3 className="text-3xl font-bold mt-1 text-right">42</h3>
              </div>
              <AlertTriangle className="w-8 h-8 text-accent opacity-20" />
            </div>
            <p className="text-xs mt-4 text-accent font-medium text-right">8 تذاكر متأخرة</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider text-right">موظفين متصلين</p>
                <h3 className="text-3xl font-bold mt-1 text-right">28</h3>
              </div>
              <Users className="w-8 h-8 text-primary opacity-20" />
            </div>
            <p className="text-xs mt-4 text-muted-foreground font-medium text-right">9 أخصائيين نشطين</p>
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
                <BarChart data={statsData}>
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
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-48 space-y-2 text-right">
              {statusData.map((s, i) => (
                <div key={s.name} className="flex items-center gap-2 text-xs flex-row-reverse">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }}></div>
                  <span className="font-bold">{s.name}:</span>
                  <span>{s.value}%</span>
                </div>
              ))}
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
                <TableHead className="text-right">الوقت المنقضي</TableHead>
                <TableHead className="text-left">إجراء</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {overdueTickets.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-bold text-red-700">{t.ticketID}</TableCell>
                  <TableCell><Badge variant="outline">{t.department === 'Cards' ? 'بطاقات' : 'تطبيق'}</Badge></TableCell>
                  <TableCell>{t.customerName}</TableCell>
                  <TableCell className="text-xs">{new Date(t.createdAt).toLocaleString('ar-SA')}</TableCell>
                  <TableCell className="text-xs text-red-600 font-bold">24 ساعة+</TableCell>
                  <TableCell className="text-left">
                    <Button size="sm" variant="destructive">تصعيد</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
