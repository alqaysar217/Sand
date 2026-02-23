
"use client"

import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { 
  Users, AlertTriangle, Clock, FileSpreadsheet, Plus, ShieldCheck, Trash2, CheckCircle2, 
  Edit2, Save, BarChart3, PieChart as PieChartIcon, ShieldAlert, MonitorSmartphone, CreditCard, Headset,
  Share2, MessageSquare
} from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase, setDocumentNonBlocking, useDoc, deleteDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar, PieChart, Pie, Cell, Legend } from 'recharts';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const COLORS = ['#1414B8', '#2A3BFF', '#6C63FF', '#10B981', '#F59E0B', '#EF4444'];

export function AdminView() {
  const db = useFirestore();
  const { toast } = useToast();
  const [activeAdminTab, setActiveAdminTab] = useState('stats');

  const configRef = useMemoFirebase(() => db ? doc(db, 'settings', 'system-config') : null, [db]);
  const { data: config } = useDoc(configRef);

  const allTicketsQuery = useMemoFirebase(() => db ? query(collection(db, 'tickets'), orderBy('createdAt', 'desc')) : null, [db]);
  const { data: tickets } = useCollection(allTicketsQuery);

  const usersQuery = useMemoFirebase(() => db ? collection(db, 'users') : null, [db]);
  const { data: appUsers } = useCollection(usersQuery);

  const stats = useMemo(() => {
    if (!tickets || tickets.length === 0) return { total: 0, resolved: 0, pending: 0, new: 0, deptData: [], statusData: [] };
    const deptMap: Record<string, number> = {};
    const statusMap: Record<string, number> = { 'New': 0, 'Pending': 0, 'Resolved': 0, 'Escalated': 0, 'Rejected': 0 };

    tickets.forEach(t => {
      deptMap[t.serviceType] = (deptMap[t.serviceType] || 0) + 1;
      statusMap[t.status] = (statusMap[t.status] || 0) + 1;
    });

    const statusTranslation: Record<string, string> = {
      'New': 'جديد', 'Pending': 'قيد المعالجة', 'Resolved': 'تم الحل', 'Escalated': 'محالة', 'Rejected': 'مرفوضة'
    };

    return {
      total: tickets.length,
      resolved: statusMap['Resolved'],
      pending: statusMap['Pending'],
      new: statusMap['New'],
      deptData: Object.entries(deptMap).map(([name, tickets]) => ({ name, tickets })),
      statusData: Object.entries(statusMap).map(([name, value]) => ({ 
        name: statusTranslation[name] || name, 
        value 
      })).filter(s => s.value > 0)
    };
  }, [tickets]);

  const handleUpdateConfigList = async (type: string, newList: string[]) => {
    if (!db) return;
    setDocumentNonBlocking(doc(db, 'settings', 'system-config'), {
      ...config,
      [type]: newList
    }, { merge: true });
    toast({ title: "تم التحديث", description: "تم حفظ التغييرات بنجاح في إعدادات النظام." });
  };

  const handleClearAllTickets = async () => {
    if (!tickets || !db) return;
    tickets.forEach(t => deleteDocumentNonBlocking(doc(db, 'tickets', t.id)));
    toast({ title: "تم المسح بنجاح", description: "تم تفريغ كافة البلاغات بنجاح." });
  };

  return (
    <div className="space-y-8 text-right" dir="rtl">
      <Tabs value={activeAdminTab} onValueChange={setActiveAdminTab} dir="rtl" className="w-full">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
          <div className="text-right">
            <h1 className="text-3xl font-black text-primary flex items-center gap-3 justify-end">
               <ShieldCheck className="w-8 h-8" /> لوحة إدارة النظام المصرفي
            </h1>
            <p className="text-slate-500 font-bold mt-1">الرقابة المركزية وإدارة خيارات ومعايير النظام</p>
          </div>
          <TabsList className="bg-slate-100 p-1 rounded-full h-auto no-scrollbar overflow-x-auto">
            <TabsTrigger value="stats" className="rounded-full px-6 py-2 font-black data-[state=active]:bg-primary data-[state=active]:text-white">الإحصائيات</TabsTrigger>
            <TabsTrigger value="settings" className="rounded-full px-6 py-2 font-black data-[state=active]:bg-primary data-[state=active]:text-white">إدارة الموظفين</TabsTrigger>
            <TabsTrigger value="options" className="rounded-full px-6 py-2 font-black data-[state=active]:bg-primary data-[state=active]:text-white">خيارات النظام</TabsTrigger>
            <TabsTrigger value="users" className="rounded-full px-6 py-2 font-black data-[state=active]:bg-primary data-[state=active]:text-white">الحسابات</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="stats" className="space-y-6 animate-in fade-in duration-500 mt-0">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard icon={FileSpreadsheet} title="إجمالي البلاغات" value={stats.total} color="bg-primary" />
            <StatCard icon={Clock} title="قيد العمل" value={stats.pending} color="text-amber-500" />
            <StatCard icon={CheckCircle2} title="تم الحل" value={stats.resolved} color="text-green-600" />
            <StatCard icon={AlertTriangle} title="بلاغات جديدة" value={stats.new} color="text-red-600" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             <Card className="banking-card border-none shadow-xl">
                <CardHeader className="text-right border-b bg-slate-50/50 p-6">
                   <CardTitle className="text-xl font-black flex items-center gap-2 justify-end">
                      حجم العمل لكل قسم <BarChart3 className="w-5 h-5 text-primary" />
                   </CardTitle>
                </CardHeader>
                <CardContent className="p-6 h-[350px]">
                   <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.deptData}>
                         <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                         <XAxis dataKey="name" fontSize={12} fontWeight="bold" />
                         <YAxis orientation="right" fontSize={12} fontWeight="bold" />
                         <Tooltip contentStyle={{ borderRadius: '16px', textAlign: 'right' }} />
                         <Bar dataKey="tickets" name="عدد البلاغات" fill="#1414B8" radius={[8, 8, 0, 0]} />
                      </BarChart>
                   </ResponsiveContainer>
                </CardContent>
             </Card>
             <Card className="banking-card border-none shadow-xl">
                <CardHeader className="text-right border-b bg-slate-50/50 p-6">
                   <CardTitle className="text-xl font-black flex items-center gap-2 justify-end">
                      توزيع الحالات <PieChartIcon className="w-5 h-5 text-primary" />
                   </CardTitle>
                </CardHeader>
                <CardContent className="p-6 h-[350px]">
                   <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                         <Pie data={stats.statusData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={8} dataKey="value">
                            {stats.statusData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                         </Pie>
                         <Tooltip contentStyle={{ borderRadius: '16px', textAlign: 'right' }} />
                         <Legend verticalAlign="bottom" height={36} />
                      </PieChart>
                   </ResponsiveContainer>
                </CardContent>
             </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6 animate-in fade-in duration-500 mt-0">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <ConfigSection 
                title="أخصائيي البطائق" 
                items={config?.specialistNames || ['علاء', 'محمود', 'عبدالله']} 
                onSave={newList => handleUpdateConfigList('specialistNames', newList)} 
                icon={<CreditCard className="w-4 h-4" />}
              />
              <ConfigSection 
                title="أخصائيي خدمة العملاء" 
                items={config?.csNames || ['سالم', 'علي', 'فهد']} 
                onSave={newList => handleUpdateConfigList('csNames', newList)} 
                icon={<MonitorSmartphone className="w-4 h-4" />}
              />
              <ConfigSection 
                title="موظفي الكول سنتر" 
                items={config?.agentNames || ['محمد بلخرم', 'إبراهيم العمودي', 'وليد بن قبوس']} 
                onSave={newList => handleUpdateConfigList('agentNames', newList)} 
                icon={<Headset className="w-4 h-4" />}
              />
           </div>
        </TabsContent>

        <TabsContent value="options" className="space-y-6 animate-in fade-in duration-500 mt-0">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ConfigSection 
                title="وسائل استلام البلاغات" 
                items={config?.intakeMethods || ['واتساب', 'اتصال', 'من خلال الفروع']} 
                onSave={newList => handleUpdateConfigList('intakeMethods', newList)} 
                icon={<Share2 className="w-4 h-4" />}
              />
              <ConfigSection 
                title="أنواع المشاكل الفنية" 
                items={config?.issueTypes || ['مشكلة في التطبيق', 'تغيير رمز PIN', 'كلمة السر', 'استفسار عام']} 
                onSave={newList => handleUpdateConfigList('issueTypes', newList)} 
                icon={<MessageSquare className="w-4 h-4" />}
              />
           </div>
           <div className="mt-8 border-t pt-8">
              <AlertDialog>
                 <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="rounded-full px-8 h-12 font-black">
                       <Trash2 className="w-5 h-5 ml-2" /> مسح كافة البلاغات من النظام
                    </Button>
                 </AlertDialogTrigger>
                 <AlertDialogContent dir="rtl" className="text-right rounded-[32px]">
                    <AlertDialogHeader>
                       <AlertDialogTitle className="font-black text-right">تأكيد المسح الشامل</AlertDialogTitle>
                       <AlertDialogDescription className="text-right font-bold">
                          سيتم حذف جميع البلاغات المسجلة في كافة الأقسام نهائياً. لا يمكن التراجع عن هذه الخطوة.
                       </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-row-reverse gap-3">
                       <AlertDialogCancel className="rounded-full font-black">إلغاء</AlertDialogCancel>
                       <AlertDialogAction onClick={handleClearAllTickets} className="bg-red-600 hover:bg-red-700 text-white rounded-full font-black">
                          تأكيد المسح
                       </AlertDialogAction>
                    </AlertDialogFooter>
                 </AlertDialogContent>
              </AlertDialog>
           </div>
        </TabsContent>

        <TabsContent value="users" className="animate-in fade-in duration-500 mt-0">
           <Card className="banking-card border-none shadow-xl overflow-hidden">
              <CardHeader className="p-8 border-b">
                 <CardTitle className="text-2xl font-black text-primary">حسابات النظام المسجلة</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                 <Table>
                    <TableHeader className="bg-primary">
                       <TableRow className="hover:bg-primary border-none">
                          <TableHead className="text-right font-black text-white h-14 pr-8">الاسم</TableHead>
                          <TableHead className="text-right font-black text-white h-14">البريد الإلكتروني</TableHead>
                          <TableHead className="text-right font-black text-white h-14">الدور</TableHead>
                          <TableHead className="text-right font-black text-white h-14 pl-8">القسم</TableHead>
                       </TableRow>
                    </TableHeader>
                    <TableBody>
                       {appUsers?.map((u, idx) => (
                          <TableRow key={u.id} className={`border-b ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                             <TableCell className="font-bold text-right pr-8">{u.name}</TableCell>
                             <TableCell className="text-right">{u.email}</TableCell>
                             <TableCell className="text-right">
                                <Badge className={`rounded-full px-4 font-black ${
                                   u.role === 'Admin' ? 'bg-red-500' : u.role === 'Specialist' ? 'bg-primary' : 'bg-secondary'
                                }`}>
                                   {u.role}
                                </Badge>
                             </TableCell>
                             <TableCell className="text-right font-bold text-slate-500 pl-8">{u.department}</TableCell>
                          </TableRow>
                       ))}
                    </TableBody>
                 </Table>
              </CardContent>
           </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({ icon: Icon, title, value, color }: any) {
  return (
    <Card className={`banking-card border-none shadow-lg overflow-hidden ${color.startsWith('bg') ? color + ' text-white' : 'bg-white'}`}>
      <CardContent className="pt-6">
         <div className="flex justify-between items-start flex-row-reverse">
            <div className={`p-3 rounded-2xl ${color.startsWith('bg') ? 'bg-white/20' : 'bg-slate-50'}`}>
               <Icon className={`w-6 h-6 ${!color.startsWith('bg') ? color : 'text-white'}`} />
            </div>
            <div className="text-right">
              <p className={`text-[10px] font-black uppercase ${color.startsWith('bg') ? 'text-white/70' : 'text-slate-400'}`}>{title}</p>
              <h3 className={`text-3xl font-black mt-1 ${!color.startsWith('bg') ? 'text-slate-900' : 'text-white'}`}>{value}</h3>
            </div>
         </div>
      </CardContent>
    </Card>
  );
}

function ConfigSection({ title, items, onSave, icon }: any) {
   const [newItem, setNewItem] = useState('');

   const handleAdd = () => {
      if (newItem.trim()) {
         onSave([...items, newItem.trim()]);
         setNewItem('');
      }
   };

   const handleDelete = (index: number) => {
      onSave(items.filter((_: any, i: number) => i !== index));
   };

   return (
      <Card className="banking-card border-none shadow-xl overflow-hidden">
         <CardHeader className="bg-primary/5 p-6 border-b flex flex-row-reverse items-center justify-between">
            <CardTitle className="text-lg font-black text-primary flex items-center gap-2">
               {title} {icon}
            </CardTitle>
            <Badge variant="outline" className="font-black text-[10px]">{items.length}</Badge>
         </CardHeader>
         <CardContent className="p-6 space-y-4">
            <div className="flex gap-2 flex-row-reverse">
               <Input value={newItem} onChange={e => setNewItem(e.target.value)} placeholder="إضافة..." className="banking-input h-11 text-right" />
               <Button onClick={handleAdd} className="bg-primary h-11 w-11 rounded-xl shrink-0"><Plus className="w-5 h-5" /></Button>
            </div>
            <div className="space-y-2 max-h-[300px] overflow-y-auto no-scrollbar">
               {items.map((item: string, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-2xl flex-row-reverse bg-slate-50">
                     <span className="font-bold text-sm">{item}</span>
                     <Button variant="ghost" size="icon" onClick={() => handleDelete(idx)} className="text-red-500 hover:bg-red-50"><Trash2 className="w-4 h-4" /></Button>
                  </div>
               ))}
            </div>
         </CardContent>
      </Card>
   );
}
