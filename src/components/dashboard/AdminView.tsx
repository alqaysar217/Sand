
"use client"

import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { 
  Users, 
  Download, 
  AlertTriangle, 
  Clock, 
  FileSpreadsheet,
  Plus,
  Loader2,
  Settings,
  ShieldCheck,
  Trash2,
  Save,
  UserPlus
} from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase, setDocumentNonBlocking, useDoc } from '@/firebase';
import { collection, query, orderBy, doc, getDocs } from 'firebase/firestore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const COLORS = ['#002D62', '#005EB8', '#ECAC17', '#2ECC71', '#E74C3C', '#9B59B6'];

export function AdminView() {
  const db = useFirestore();
  const [activeAdminTab, setActiveAdminTab] = useState('stats');
  const [newItem, setNewItem] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // جلب إعدادات النظام
  const configRef = useMemoFirebase(() => db ? doc(db, 'settings', 'system-config') : null, [db]);
  const { data: config } = useDoc(configRef);

  // جلب كافة التذاكر للإحصائيات
  const allTicketsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'tickets'), orderBy('createdAt', 'desc'));
  }, [db]);
  const { data: tickets } = useCollection(allTicketsQuery);

  // جلب كافة الموظفين
  const usersQuery = useMemoFirebase(() => db ? collection(db, 'users') : null, [db]);
  const { data: appUsers } = useCollection(usersQuery);

  const stats = useMemo(() => {
    if (!tickets) return { total: 0, resolved: 0, pending: 0, new: 0, deptData: [], statusData: [] };
    const deptMap: Record<string, number> = {};
    const statusMap: Record<string, number> = { 'New': 0, 'Pending': 0, 'Resolved': 0, 'Escalated': 0, 'Rejected': 0 };

    tickets.forEach(t => {
      deptMap[t.serviceType] = (deptMap[t.serviceType] || 0) + 1;
      statusMap[t.status] = (statusMap[t.status] || 0) + 1;
    });

    return {
      total: tickets.length,
      resolved: statusMap['Resolved'],
      pending: statusMap['Pending'],
      new: statusMap['New'],
      deptData: Object.entries(deptMap).map(([name, tickets]) => ({ name, tickets })),
      statusData: Object.entries(statusMap).map(([name, value]) => ({ name, value }))
    };
  }, [tickets]);

  const handleUpdateConfig = async (type: 'serviceTypes' | 'intakeMethods' | 'issueTypes', action: 'add' | 'delete', value: string) => {
    if (!config || !db) return;
    setIsSaving(true);
    const updatedList = action === 'add' 
      ? [...(config[type] || []), value]
      : (config[type] || []).filter((i: string) => i !== value);
    
    setDocumentNonBlocking(doc(db, 'settings', 'system-config'), {
      ...config,
      [type]: updatedList
    }, { merge: true });
    
    setNewItem('');
    setIsSaving(false);
  };

  return (
    <div className="space-y-8 text-right" dir="rtl">
      <div className="flex justify-between items-center flex-row-reverse">
        <div className="text-right">
          <h1 className="text-3xl font-black text-primary flex items-center gap-3 justify-end">
             <ShieldCheck className="w-8 h-8" /> لوحة قيادة المدير العام
          </h1>
          <p className="text-slate-500 font-bold mt-1">الإشراف الفني وإدارة إعدادات النظام والموظفين</p>
        </div>
        <Tabs value={activeAdminTab} onValueChange={setActiveAdminTab} dir="rtl">
          <TabsList className="bg-slate-100 p-1 rounded-full h-auto">
            <TabsTrigger value="stats" className="rounded-full px-6 py-2 font-black data-[state=active]:bg-primary data-[state=active]:text-white">الإحصائيات</TabsTrigger>
            <TabsTrigger value="users" className="rounded-full px-6 py-2 font-black data-[state=active]:bg-primary data-[state=active]:text-white">الموظفين</TabsTrigger>
            <TabsTrigger value="settings" className="rounded-full px-6 py-2 font-black data-[state=active]:bg-primary data-[state=active]:text-white">إعدادات النظام</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <TabsContent value="stats" className="space-y-6 animate-in fade-in duration-500">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-primary text-white banking-card border-none shadow-lg">
            <CardContent className="pt-6">
               <div className="flex justify-between items-start flex-row-reverse">
                  <FileSpreadsheet className="w-8 h-8 opacity-40" />
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/70">إجمالي البلاغات</p>
                    <h3 className="text-3xl font-black">{stats.total}</h3>
                  </div>
               </div>
            </CardContent>
          </Card>
          <Card className="banking-card border-none shadow-lg">
            <CardContent className="pt-6">
               <div className="flex justify-between items-start flex-row-reverse">
                  <Clock className="w-8 h-8 text-amber-500 opacity-40" />
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">قيد العمل</p>
                    <h3 className="text-3xl font-black text-amber-500">{stats.pending}</h3>
                  </div>
               </div>
            </CardContent>
          </Card>
          <Card className="banking-card border-none shadow-lg">
            <CardContent className="pt-6">
               <div className="flex justify-between items-start flex-row-reverse">
                  <CheckCircle2 className="w-8 h-8 text-green-600 opacity-40" />
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">تم الحل</p>
                    <h3 className="text-3xl font-black text-green-600">{stats.resolved}</h3>
                  </div>
               </div>
            </CardContent>
          </Card>
          <Card className="banking-card border-none shadow-lg">
            <CardContent className="pt-6">
               <div className="flex justify-between items-start flex-row-reverse">
                  <AlertTriangle className="w-8 h-8 text-red-600 opacity-40" />
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">بلاغات جديدة</p>
                    <h3 className="text-3xl font-black text-red-600">{stats.new}</h3>
                  </div>
               </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           <Card className="banking-card border-none shadow-xl">
              <CardHeader className="text-right border-b bg-slate-50/50 p-6">
                 <CardTitle className="text-xl font-black">حجم العمل لكل قسم</CardTitle>
              </CardHeader>
              <CardContent className="p-6 h-[300px]">
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.deptData}>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} />
                       <XAxis dataKey="name" />
                       <YAxis orientation="right" />
                       <Tooltip />
                       <Bar dataKey="tickets" fill="#1414B8" radius={[8, 8, 0, 0]} />
                    </BarChart>
                 </ResponsiveContainer>
              </CardContent>
           </Card>
           <Card className="banking-card border-none shadow-xl">
              <CardHeader className="text-right border-b bg-slate-50/50 p-6">
                 <CardTitle className="text-xl font-black">توزيع الحالات</CardTitle>
              </CardHeader>
              <CardContent className="p-6 h-[300px]">
                 <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                       <Pie data={stats.statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                          {stats.statusData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                       </Pie>
                       <Tooltip />
                    </PieChart>
                 </ResponsiveContainer>
              </CardContent>
           </Card>
        </div>
      </TabsContent>

      <TabsContent value="users" className="animate-in fade-in duration-500">
         <Card className="banking-card border-none shadow-xl">
            <CardHeader className="p-8 border-b bg-white flex flex-row-reverse justify-between items-center">
               <CardTitle className="text-2xl font-black text-primary">إدارة الموظفين والصلاحيات</CardTitle>
               <Button className="rounded-full px-8 font-black bg-primary"><UserPlus className="ml-2 w-4 h-4" /> إضافة موظف</Button>
            </CardHeader>
            <CardContent className="p-0">
               <Table>
                  <TableHeader className="bg-slate-50">
                     <TableRow>
                        <TableHead className="text-right font-black">الاسم</TableHead>
                        <TableHead className="text-right font-black">البريد الإلكتروني</TableHead>
                        <TableHead className="text-right font-black">الدور</TableHead>
                        <TableHead className="text-right font-black">القسم</TableHead>
                        <TableHead className="text-center font-black">الإجراءات</TableHead>
                     </TableRow>
                  </TableHeader>
                  <TableBody>
                     {appUsers?.map((u, idx) => (
                        <TableRow key={u.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                           <TableCell className="font-bold text-right pr-8">{u.name}</TableCell>
                           <TableCell className="text-right">{u.email}</TableCell>
                           <TableCell className="text-right"><Badge variant="outline" className="font-black text-primary">{u.role}</Badge></TableCell>
                           <TableCell className="text-right">{u.department}</TableCell>
                           <TableCell className="text-center">
                              <Button variant="ghost" size="icon" className="text-red-500"><Trash2 className="w-4 h-4" /></Button>
                           </TableCell>
                        </TableRow>
                     ))}
                  </TableBody>
               </Table>
            </CardContent>
         </Card>
      </TabsContent>

      <TabsContent value="settings" className="space-y-6 animate-in fade-in duration-500">
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ConfigSection title="الجهات المعنية" type="serviceTypes" items={config?.serviceTypes || []} onAdd={v => handleUpdateConfig('serviceTypes', 'add', v)} onDelete={v => handleUpdateConfig('serviceTypes', 'delete', v)} />
            <ConfigSection title="وسائل الاستلام" type="intakeMethods" items={config?.intakeMethods || []} onAdd={v => handleUpdateConfig('intakeMethods', 'add', v)} onDelete={v => handleUpdateConfig('intakeMethods', 'delete', v)} />
            <ConfigSection title="أنواع المشاكل" type="issueTypes" items={config?.issueTypes || []} onAdd={v => handleUpdateConfig('issueTypes', 'add', v)} onDelete={v => handleUpdateConfig('issueTypes', 'delete', v)} />
         </div>
      </TabsContent>
    </div>
  );
}

function ConfigSection({ title, items, onAdd, onDelete }: { title: string, items: string[], onAdd: (v: string) => void, onDelete: (v: string) => void, type: string }) {
   const [val, setVal] = useState('');
   return (
      <Card className="banking-card border-none shadow-xl">
         <CardHeader className="bg-primary/5 p-6 border-b"><CardTitle className="text-lg font-black text-primary">{title}</CardTitle></CardHeader>
         <CardContent className="p-6 space-y-4">
            <div className="flex gap-2 flex-row-reverse">
               <Input value={val} onChange={e => setVal(e.target.value)} placeholder="إضافة جديد..." className="banking-input text-right" />
               <Button size="icon" onClick={() => { if(val) onAdd(val); setVal(''); }} className="bg-primary rounded-xl"><Plus className="w-4 h-4" /></Button>
            </div>
            <div className="space-y-2">
               {items.map(item => (
                  <div key={item} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl flex-row-reverse">
                     <span className="font-bold text-sm">{item}</span>
                     <Button variant="ghost" size="icon" onClick={() => onDelete(item)} className="text-red-400 h-8 w-8 hover:text-red-600"><Trash2 className="w-4 h-4" /></Button>
                  </div>
               ))}
            </div>
         </CardContent>
      </Card>
   );
}
