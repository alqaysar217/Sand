
"use client"

import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { 
  Users, AlertTriangle, Clock, FileSpreadsheet, Plus, ShieldCheck, Trash2, CheckCircle2, 
  Edit2, Save, BarChart3, PieChart as PieChartIcon, MonitorSmartphone, CreditCard, Headset,
  Share2, MessageSquare, X, Smartphone
} from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase, setDocumentNonBlocking, useDoc, deleteDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar, PieChart, Pie, Cell, Legend } from 'recharts';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { cn } from '@/lib/utils';

const COLORS = ['#1414B8', '#2A3BFF', '#6C63FF', '#10B981', '#F59E0B', '#EF4444'];

export function AdminView() {
  const db = useFirestore();
  const { toast } = useToast();
  const [activeAdminTab, setActiveAdminTab] = useState('stats');

  // الاستماع لأحداث القائمة الجانبية
  useEffect(() => {
    const handleSidebarNav = (e: any) => {
      const action = e.detail;
      if (['stats', 'staff', 'options', 'users'].includes(action)) {
        setActiveAdminTab(action);
      }
    };
    window.addEventListener('sidebar-nav', handleSidebarNav);
    return () => window.removeEventListener('sidebar-nav', handleSidebarNav);
  }, []);

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
    const currentData = config || {
      specialistNames: [],
      csNames: [],
      agentNames: [],
      appSpecialistNames: [],
      intakeMethods: [],
      issueTypes: []
    };
    
    setDocumentNonBlocking(doc(db, 'settings', 'system-config'), {
      ...currentData,
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
               <ShieldCheck className="w-8 h-8" /> لوحة الإدارة العامة
            </h1>
            <p className="text-slate-500 font-bold mt-1">إدارة الكوادر، الوسائل، ومعايير البلاغات المصرفية</p>
          </div>
          <TabsList className="bg-slate-100 p-1 rounded-full h-auto no-scrollbar overflow-x-auto">
            <TabsTrigger value="stats" className="rounded-full px-6 py-2 font-black data-[state=active]:bg-primary data-[state=active]:text-white">الإحصائيات</TabsTrigger>
            <TabsTrigger value="staff" className="rounded-full px-6 py-2 font-black data-[state=active]:bg-primary data-[state=active]:text-white">إدارة الكادر</TabsTrigger>
            <TabsTrigger value="options" className="rounded-full px-6 py-2 font-black data-[state=active]:bg-primary data-[state=active]:text-white">خيارات النظام</TabsTrigger>
            <TabsTrigger value="users" className="rounded-full px-6 py-2 font-black data-[state=active]:bg-primary data-[state=active]:text-white">حسابات النظام</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="stats" className="space-y-6 animate-in fade-in duration-500 mt-0">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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

        <TabsContent value="staff" className="space-y-6 animate-in fade-in duration-500 mt-0">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <ConfigSection 
                title="أخصائيي البطائق" 
                items={config?.specialistNames || []} 
                onSave={(newList: string[]) => handleUpdateConfigList('specialistNames', newList)} 
                icon={<CreditCard className="w-4 h-4" />}
                placeholder="أضف أخصائي بطائق..."
              />
              <ConfigSection 
                title="أخصائيي خدمة العملاء" 
                items={config?.csNames || []} 
                onSave={(newList: string[]) => handleUpdateConfigList('csNames', newList)} 
                icon={<MonitorSmartphone className="w-4 h-4" />}
                placeholder="أضف موظف خدمة عملاء..."
              />
              <ConfigSection 
                title="أخصائيي التطبيق" 
                items={config?.appSpecialistNames || []} 
                onSave={(newList: string[]) => handleUpdateConfigList('appSpecialistNames', newList)} 
                icon={<Smartphone className="w-4 h-4" />}
                placeholder="أخصائي مشاكل التطبيق..."
              />
              <ConfigSection 
                title="موظفي الكول سنتر" 
                items={config?.agentNames || []} 
                onSave={(newList: string[]) => handleUpdateConfigList('agentNames', newList)} 
                icon={<Headset className="w-4 h-4" />}
                placeholder="أضف موظف كول سنتر..."
              />
           </div>
        </TabsContent>

        <TabsContent value="options" className="space-y-6 animate-in fade-in duration-500 mt-0">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ConfigSection 
                title="وسائل استلام البلاغات" 
                items={config?.intakeMethods || []} 
                onSave={(newList: string[]) => handleUpdateConfigList('intakeMethods', newList)} 
                icon={<Share2 className="w-4 h-4" />}
                placeholder="أضف وسيلة (واتساب، اتصال...)"
              />
              <ConfigSection 
                title="أنواع المشاكل الفنية" 
                items={config?.issueTypes || []} 
                onSave={(newList: string[]) => handleUpdateConfigList('issueTypes', newList)} 
                icon={<MessageSquare className="w-4 h-4" />}
                placeholder="أضف نوع (PIN، كلمة سر...)"
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
  const isBgColor = color.startsWith('bg-');
  
  return (
    <div className={cn(
      "relative rounded-[24px] p-6 shadow-xl overflow-hidden transition-all duration-300",
      isBgColor ? `${color} text-white` : "bg-white border border-slate-100"
    )}>
       <div className="relative z-10 flex justify-between items-start flex-row-reverse">
          <div className={cn(
            "p-3 rounded-2xl flex items-center justify-center",
            isBgColor ? "bg-white/20" : "bg-slate-50"
          )}>
             <Icon className={cn(
               "w-6 h-6",
               isBgColor ? "text-white" : color
             )} />
          </div>
          <div className="text-right">
            <p className={cn(
              "text-[10px] font-black uppercase tracking-wider mb-1",
              isBgColor ? "text-white/80" : "text-slate-400"
            )}>{title}</p>
            <h3 className={cn(
              "text-3xl font-black",
              isBgColor ? "text-white" : "text-slate-900"
            )}>{value}</h3>
          </div>
       </div>
       {isBgColor && (
         <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none overflow-hidden">
            <Icon className="absolute -bottom-4 -left-4 w-24 h-24 rotate-12" />
         </div>
       )}
    </div>
  );
}

function ConfigSection({ title, items, onSave, icon, placeholder }: any) {
   const [newItem, setNewItem] = useState('');
   const [editIndex, setEditIndex] = useState<number | null>(null);
   const [editValue, setEditValue] = useState('');

   const handleAdd = () => {
      if (newItem.trim()) {
         onSave([...items, newItem.trim()]);
         setNewItem('');
      }
   };

   const handleDelete = (index: number) => {
      onSave(items.filter((_: any, i: number) => i !== index));
   };

   const handleEdit = (index: number) => {
      setEditIndex(index);
      setEditValue(items[index]);
   };

   const handleSaveEdit = () => {
      if (editValue.trim() && editIndex !== null) {
         const newList = [...items];
         newList[editIndex] = editValue.trim();
         onSave(newList);
         setEditIndex(null);
      }
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
               <Input 
                 value={newItem} 
                 onChange={e => setNewItem(e.target.value)} 
                 placeholder={placeholder || "إضافة..."} 
                 className="banking-input h-11 text-right" 
               />
               <Button onClick={handleAdd} className="bg-primary h-11 w-11 rounded-xl shrink-0">
                  <Plus className="w-5 h-5" />
               </Button>
            </div>
            <div className="space-y-2 max-h-[300px] overflow-y-auto no-scrollbar">
               {items.map((item: string, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-2xl flex-row-reverse bg-slate-50 border border-slate-100 hover:border-primary/20 transition-all">
                     {editIndex === idx ? (
                       <div className="flex gap-2 w-full flex-row-reverse">
                          <Input 
                            value={editValue} 
                            onChange={e => setEditValue(e.target.value)} 
                            className="h-9 banking-input" 
                          />
                          <Button size="icon" variant="ghost" onClick={handleSaveEdit} className="text-green-600">
                             <Save className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => setEditIndex(null)} className="text-slate-400">
                             <X className="w-4 h-4" />
                          </Button>
                       </div>
                     ) : (
                       <>
                         <span className="font-bold text-sm text-slate-700">{item}</span>
                         <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(idx)} className="text-primary hover:bg-primary/5 h-8 w-8">
                               <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(idx)} className="text-red-500 hover:bg-red-50 h-8 w-8">
                               <Trash2 className="w-4 h-4" />
                            </Button>
                         </div>
                       </>
                     )}
                  </div>
               ))}
               {items.length === 0 && (
                  <div className="text-center py-8 text-slate-400 text-xs font-bold">
                     لا يوجد بيانات مضافة حالياً
                  </div>
               )}
            </div>
         </CardContent>
      </Card>
   );
}
