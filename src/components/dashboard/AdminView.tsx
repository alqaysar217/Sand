
"use client"

import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Users, AlertTriangle, Clock, FileSpreadsheet, ShieldCheck, Trash2, CheckCircle2, 
  Edit2, BarChart3, PieChart as PieChartIcon, MonitorSmartphone, CreditCard, Headset,
  Share2, X, Smartphone, UserPlus, Key, Loader2, Info, AlertCircle, Eye, EyeOff, Plus, ListTodo, Check, Save, TrendingUp, Download, ShieldAlert
} from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase, deleteDocumentNonBlocking, useDoc, updateDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, doc, arrayUnion, arrayRemove, updateDoc } from 'firebase/firestore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar, PieChart, Pie, Cell, Legend } from 'recharts';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useAuth } from '@/lib/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Department, UserProfile, UserRole } from '@/lib/types';

const COLORS = ['#1414B8', '#2A3BFF', '#6C63FF', '#10B981', '#F59E0B', '#EF4444'];

export function AdminView() {
  const db = useFirestore();
  const { toast } = useToast();
  const { user: currentAdmin, createEmployeeAccount, updateAdminPassword, updateEmployeeProfile } = useAuth();
  const [activeAdminTab, setActiveAdminTab] = useState('stats');
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [isUpdatingUser, setIsUpdatingUser] = useState(false);
  const [showAddUserDialog, setShowAddUserDialog] = useState(false);
  const [showEditUserDialog, setShowEditUserDialog] = useState(false);
  const [showChangePassDialog, setShowChangePassDialog] = useState(false);
  const [newPass, setNewPass] = useState('');
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [newItemValues, setNewItemValues] = useState<Record<string, string>>({});

  const [newUser, setNewUser] = useState({
    name: '',
    username: '',
    dept: 'Cards' as Department,
    role: 'Specialist' as UserRole,
    password: '',
    allowedDepts: [] as Department[]
  });

  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);

  const configRef = useMemoFirebase(() => db ? doc(db, 'settings', 'system-config') : null, [db]);
  const { data: config } = useDoc(configRef);

  const allTicketsQuery = useMemoFirebase(() => db ? query(collection(db, 'tickets'), orderBy('createdAt', 'desc')) : null, [db]);
  const { data: tickets } = useCollection(allTicketsQuery);

  const usersQuery = useMemoFirebase(() => db ? query(collection(db, 'users'), orderBy('createdAt', 'desc')) : null, [db]);
  const { data: appUsers } = useCollection<UserProfile>(usersQuery);

  const stats = useMemo(() => {
    if (!tickets || tickets.length === 0) return { 
      total: 0, resolved: 0, pending: 0, new: 0, 
      deptData: [], statusData: [], 
      agentPerf: [], 
      cardsSpec: [], digitalSpec: [], appSpec: [] 
    };
    
    const deptMap: Record<string, number> = {};
    const statusMap: Record<string, number> = { 'New': 0, 'Pending': 0, 'Resolved': 0, 'Escalated': 0, 'Rejected': 0 };
    const agentMap: Record<string, { name: string, count: number }> = {};
    const specMap: Record<string, { name: string, dept: string, resolved: number, rejected: number, escalated: number }> = {};

    tickets.forEach(t => {
      deptMap[t.serviceType] = (deptMap[t.serviceType] || 0) + 1;
      statusMap[t.status] = (statusMap[t.status] || 0) + 1;

      if (t.createdByAgentId) {
        if (!agentMap[t.createdByAgentId]) agentMap[t.createdByAgentId] = { name: t.createdByAgentName, count: 0 };
        agentMap[t.createdByAgentId].count++;
      }

      if (t.assignedToSpecialistId) {
        if (!specMap[t.assignedToSpecialistId]) {
          specMap[t.assignedToSpecialistId] = { 
            name: t.assignedToSpecialistName || 'غير معروف', 
            dept: t.serviceType, 
            resolved: 0, rejected: 0, escalated: 0 
          };
        }
        if (t.status === 'Resolved') specMap[t.assignedToSpecialistId].resolved++;
        if (t.status === 'Rejected') specMap[t.assignedToSpecialistId].rejected++;
        if (t.status === 'Escalated') specMap[t.assignedToSpecialistId].escalated++;
      }
    });

    const statusTranslation: Record<string, string> = {
      'New': 'جديد', 'Pending': 'قيد المعالجة', 'Resolved': 'تم الحل', 'Escalated': 'محالة', 'Rejected': 'مرفوضة'
    };

    const formatSpecData = (deptName: string) => {
      return Object.values(specMap)
        .filter(s => s.dept === deptName)
        .map(s => ({
          name: s.name,
          حل: s.resolved,
          رفض: s.rejected,
          إحالة: s.escalated
        }));
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
      })).filter(s => s.value > 0),
      agentPerf: Object.values(agentMap).sort((a, b) => b.count - a.count),
      cardsSpec: formatSpecData('إدارة البطائق'),
      digitalSpec: formatSpecData('خدمة العملاء'),
      appSpec: formatSpecData('مشاكل التطبيق')
    };
  }, [tickets]);

  const exportToCSV = () => {
    if (!tickets || tickets.length === 0) return;
    const headers = ["رقم البلاغ", "التاريخ", "اسم العميل", "CIF", "الهاتف", "نوع المشكلة", "الجهة", "الوسيلة", "الوصف", "موظف الرفع", "المستلم", "الحالة", "الرد النهائي"];
    const rows = tickets.map(t => [t.ticketID || '', new Date(t.createdAt).toLocaleString('ar-SA'), t.customerName, t.cif || '', t.phoneNumber || '', t.subIssue, t.serviceType, t.intakeMethod, (t.description || '').replace(/\n/g, ' '), t.createdByAgentName, t.assignedToSpecialistName || '', t.status, (t.specialistResponse || '').replace(/\n/g, ' ')]);
    const csvContent = "\ufeff" + [headers.join(','), ...rows.map(e => e.map(x => `"${x}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `سند_بلاغات_${new Date().toLocaleDateString()}.csv`;
    link.click();
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingUser(true);
    try {
      await createEmployeeAccount(newUser);
      toast({ title: "تم إنشاء الحساب بنجاح" });
      setShowAddUserDialog(false);
      setNewUser({ name: '', username: '', dept: 'Cards', role: 'Specialist', password: '', allowedDepts: [] });
    } catch (err: any) {
      toast({ variant: "destructive", title: "فشل الإنشاء", description: err.message });
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setIsUpdatingUser(true);
    try {
      await updateEmployeeProfile(editingUser.id, editingUser);
      toast({ title: "تم التحديث بنجاح" });
      setShowEditUserDialog(false);
      setEditingUser(null);
    } catch (err: any) {
      toast({ variant: "destructive", title: "فشل التحديث", description: err.message });
    } finally {
      setIsUpdatingUser(false);
    }
  };

  const handleDeleteUser = async (user: UserProfile) => {
    if (!db) return;
    if (user.username === 'BIM0100') {
      toast({ variant: "destructive", title: "إجراء محظور", description: "لا يمكن حذف حساب المدير العام الأساسي." });
      return;
    }
    if (confirm('هل أنت متأكد من رغبتك في حذف هذا الحساب؟')) {
      deleteDocumentNonBlocking(doc(db, 'users', user.id));
      toast({ title: "تم الحذف" });
    }
  };

  const toggleDept = (dept: Department, isEditing: boolean) => {
    if (isEditing && editingUser) {
      const depts = editingUser.allowedDepartments || [];
      const newDepts = depts.includes(dept) ? depts.filter(d => d !== dept) : [...depts, dept];
      setEditingUser({ ...editingUser, allowedDepartments: newDepts });
    } else {
      const depts = newUser.allowedDepts;
      const newDepts = depts.includes(dept) ? depts.filter(d => d !== dept) : [...depts, dept];
      setNewUser({ ...newUser, allowedDepts: newDepts });
    }
  };

  return (
    <div className="space-y-8 text-right" dir="rtl">
      <Tabs value={activeAdminTab} onValueChange={setActiveAdminTab} dir="rtl" className="w-full">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
          <div className="text-right">
            <h1 className="text-3xl font-black text-primary flex items-center gap-3 justify-end">
               <ShieldCheck className="w-8 h-8" /> لوحة الإدارة العامة
            </h1>
            <p className="text-slate-500 font-bold mt-1">إدارة الكوادر وتصنيفات النظام</p>
          </div>
          <div className="flex items-center gap-3">
             <Button onClick={exportToCSV} variant="outline" className="rounded-full font-black border-green-600 text-green-600 hover:bg-green-50">
                <Download className="w-4 h-4 ml-2" /> تصدير البلاغات
             </Button>
             <TabsList className="bg-slate-100 p-1 rounded-full h-auto">
               <TabsTrigger value="stats" className="rounded-full px-6 py-2 font-black">الإحصائيات</TabsTrigger>
               <TabsTrigger value="users" className="rounded-full px-6 py-2 font-black">إدارة الحسابات</TabsTrigger>
               <TabsTrigger value="options" className="rounded-full px-6 py-2 font-black">خيارات النظام</TabsTrigger>
             </TabsList>
          </div>
        </div>

        <TabsContent value="stats" className="space-y-8 animate-in fade-in duration-500">
           <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard icon={FileSpreadsheet} title="إجمالي البلاغات" value={stats.total} color="bg-primary" />
            <StatCard icon={Clock} title="قيد المعالجة" value={stats.pending} valueColor="text-amber-500" />
            <StatCard icon={CheckCircle2} title="تم حلها" value={stats.resolved} valueColor="text-green-600" />
            <StatCard icon={AlertTriangle} title="بلاغات جديدة" value={stats.new} valueColor="text-red-600" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             <ChartWrapper title="توزيع حالات البلاغات" icon={PieChartIcon}>
                <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                      <Pie data={stats.statusData} cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={5} dataKey="value">
                         {stats.statusData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                      <Legend />
                   </PieChart>
                </ResponsiveContainer>
             </ChartWrapper>
             <ChartWrapper title="حجم العمل لكل قسم" icon={BarChart3}>
                <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={stats.deptData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" fontSize={12} fontWeight="bold" />
                      <YAxis orientation="right" fontSize={12} fontWeight="bold" />
                      <Tooltip />
                      <Bar dataKey="tickets" name="بلاغات موجهة" fill="#2A3BFF" radius={[8, 8, 0, 0]} />
                   </BarChart>
                </ResponsiveContainer>
             </ChartWrapper>
          </div>

          <div className="pt-8">
             <h2 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-3 justify-end">
                <TrendingUp className="w-6 h-6 text-green-600" /> تقييم أداء الكوادر المصرفية
             </h2>
             <div className="space-y-8">
                <PerformanceSection title="موظفي الكول سنتر (الرفع)" icon={Headset} data={stats.agentPerf} color="#6C63FF" isVertical />
                <div className="grid grid-cols-1 gap-8">
                   <PerformanceSection title="أداء أخصائيي البطائق" icon={CreditCard} data={stats.cardsSpec} color="#1414B8" />
                   <PerformanceSection title="أداء أخصائيي خدمة العملاء" icon={MonitorSmartphone} data={stats.digitalSpec} color="#10B981" />
                   <PerformanceSection title="أداء أخصائيي مشاكل التطبيق" icon={Smartphone} data={stats.appSpec} color="#EF4444" />
                </div>
             </div>
          </div>
        </TabsContent>

        <TabsContent value="users" className="animate-in fade-in duration-500">
           <Card className="banking-card overflow-hidden">
              <CardHeader className="p-8 border-b flex flex-row-reverse items-center justify-between">
                 <CardTitle className="text-2xl font-black text-primary">إدارة حسابات الهوية المصرفية</CardTitle>
                 <Button onClick={() => setShowAddUserDialog(true)} className="banking-button premium-gradient text-white h-12 px-6">
                    <UserPlus className="w-5 h-5 ml-2" /> إضافة حساب جديد
                 </Button>
              </CardHeader>
              <CardContent className="p-0">
                 <Table>
                    <TableHeader className="bg-primary">
                       <TableRow className="hover:bg-primary border-none">
                          <TableHead className="text-right font-black text-white h-14 pr-8">الموظف</TableHead>
                          <TableHead className="text-right font-black text-white h-14">BIM ID</TableHead>
                          <TableHead className="text-right font-black text-white h-14">كلمة المرور</TableHead>
                          <TableHead className="text-right font-black text-white h-14">الرتبة</TableHead>
                          <TableHead className="text-right font-black text-white h-14">القسم</TableHead>
                          <TableHead className="text-center font-black text-white h-14 pl-8">الإجراءات</TableHead>
                       </TableRow>
                    </TableHeader>
                    <TableBody>
                       {appUsers?.map((u, idx) => (
                          <TableRow key={u.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}>
                             <TableCell className="font-bold text-right pr-8">{u.name}</TableCell>
                             <TableCell className="text-right font-mono font-bold text-primary">{u.username}</TableCell>
                             <TableCell className="text-right">
                                <div className="flex items-center gap-2 justify-end">
                                   <span className="font-mono text-sm font-bold">
                                      {visiblePasswords[u.id] ? u.password : '••••••••'}
                                   </span>
                                   <Button variant="ghost" size="icon" onClick={() => setVisiblePasswords(p => ({...p, [u.id]: !p[u.id]}))}>
                                      {visiblePasswords[u.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                   </Button>
                                </div>
                             </TableCell>
                             <TableCell className="text-right">
                                <Badge className={u.role === 'Admin' ? 'bg-red-500' : 'bg-slate-200 text-slate-700'}>
                                   {u.role === 'Admin' ? 'مدير' : u.role === 'Agent' ? 'موظف رفع' : 'أخصائي'}
                                </Badge>
                             </TableCell>
                             <TableCell className="text-right font-bold text-slate-500">{u.department}</TableCell>
                             <TableCell className="text-center pl-8">
                                <div className="flex items-center justify-center gap-2">
                                   <Button variant="ghost" size="icon" onClick={() => { setEditingUser(u); setShowEditUserDialog(true); }} className="text-blue-500"><Edit2 className="w-5 h-5" /></Button>
                                   <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      disabled={u.username === 'BIM0100'} 
                                      onClick={() => handleDeleteUser(u)} 
                                      className={u.username === 'BIM0100' ? "text-slate-200" : "text-red-400"}
                                   >
                                      <Trash2 className="w-5 h-5" />
                                   </Button>
                                </div>
                             </TableCell>
                          </TableRow>
                       ))}
                    </TableBody>
                 </Table>
              </CardContent>
           </Card>
        </TabsContent>

        <TabsContent value="options" className="animate-in fade-in duration-500">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              <ConfigListManager title="وسائل استلام الطلبات" items={config?.intakeMethods || []} value={newItemValues.intakeMethods || ''} onValueChange={(v: string) => setNewItemValues({...newItemValues, intakeMethods: v})} onAdd={() => { updateDocumentNonBlocking(configRef!, { intakeMethods: arrayUnion(newItemValues.intakeMethods) }); setNewItemValues({...newItemValues, intakeMethods: ''}); }} onRemove={(v: string) => updateDocumentNonBlocking(configRef!, { intakeMethods: arrayRemove(v) })} onEdit={(old: string, val: string) => { const list = (config?.intakeMethods || []).map((i: string) => i === old ? val : i); updateDoc(configRef!, { intakeMethods: list }); }} />
              <ConfigListManager title="أنواع المشكلات الفنية" items={config?.issueTypes || []} value={newItemValues.issueTypes || ''} onValueChange={(v: string) => setNewItemValues({...newItemValues, issueTypes: v})} onAdd={() => { updateDocumentNonBlocking(configRef!, { issueTypes: arrayUnion(newItemValues.issueTypes) }); setNewItemValues({...newItemValues, issueTypes: ''}); }} onRemove={(v: string) => updateDocumentNonBlocking(configRef!, { issueTypes: arrayRemove(v) })} onEdit={(old: string, val: string) => { const list = (config?.issueTypes || []).map((i: string) => i === old ? val : i); updateDoc(configRef!, { issueTypes: list }); }} />
           </div>
        </TabsContent>
      </Tabs>

      {/* نافذة إضافة حساب */}
      <Dialog open={showAddUserDialog} onOpenChange={setShowAddUserDialog}>
         <DialogContent className="max-w-xl text-right rounded-[32px] p-0 overflow-hidden shadow-2xl" dir="rtl">
            <DialogHeader className="p-8 bg-primary/5 border-b">
               <DialogTitle className="text-2xl font-black text-primary flex items-center gap-2 justify-end">
                  <UserPlus className="w-6 h-6" /> إضافة كادر جديد للنظام
               </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateUser} className="p-8 space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="col-span-2 space-y-2">
                     <Label className="font-black text-xs mr-1">اسم الموظف</Label>
                     <Input required value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} className="banking-input h-12 text-right" />
                  </div>
                  <div className="space-y-2">
                     <Label className="font-black text-xs mr-1">BIM ID</Label>
                     <Input required value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} className="banking-input h-12 font-mono text-right" />
                  </div>
                  <div className="space-y-2">
                     <Label className="font-black text-xs mr-1">كلمة المرور</Label>
                     <Input required type="password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} className="banking-input h-12 text-right" />
                  </div>
                  <div className="space-y-2">
                     <Label className="font-black text-xs mr-1">الرتبة الوظيفية</Label>
                     <Select value={newUser.role} onValueChange={(v: any) => setNewUser({...newUser, role: v})}>
                        <SelectTrigger className="h-12 text-right"><SelectValue /></SelectTrigger>
                        <SelectContent dir="rtl">
                           <SelectItem value="Admin">مدير (Admin)</SelectItem>
                           <SelectItem value="Specialist">أخصائي (Specialist)</SelectItem>
                           <SelectItem value="Agent">كول سنتر (Agent)</SelectItem>
                        </SelectContent>
                     </Select>
                  </div>
                  <div className="space-y-2">
                     <Label className="font-black text-xs mr-1">القسم الرئيسي</Label>
                     <Select value={newUser.dept} onValueChange={(v: any) => setNewUser({...newUser, dept: v})}>
                        <SelectTrigger className="h-12 text-right"><SelectValue /></SelectTrigger>
                        <SelectContent dir="rtl">
                           <SelectItem value="Cards">البطائق</SelectItem>
                           <SelectItem value="Digital">خدمة العملاء</SelectItem>
                           <SelectItem value="App">التطبيق</SelectItem>
                           <SelectItem value="Support">الكول سنتر</SelectItem>
                           <SelectItem value="Operations">العمليات</SelectItem>
                        </SelectContent>
                     </Select>
                  </div>
                  
                  {newUser.role === 'Admin' && (
                    <div className="col-span-2 space-y-3 bg-slate-50 p-4 rounded-2xl border">
                       <Label className="font-black text-sm text-primary">تحديد صلاحيات الوصول للأقسام</Label>
                       <div className="grid grid-cols-2 gap-3">
                          {['Cards', 'Digital', 'App', 'Support', 'Operations'].map((d) => (
                             <div key={d} className="flex items-center gap-2 justify-end">
                                <Label className="text-xs font-bold">{d}</Label>
                                <Checkbox 
                                  checked={newUser.allowedDepts.includes(d as any)} 
                                  onCheckedChange={() => toggleDept(d as any, false)} 
                                />
                             </div>
                          ))}
                       </div>
                    </div>
                  )}
               </div>
               <DialogFooter className="flex-row-reverse gap-3 pt-6">
                  <Button type="button" variant="ghost" onClick={() => setShowAddUserDialog(false)} className="rounded-full font-black">إلغاء</Button>
                  <Button type="submit" disabled={isCreatingUser} className="banking-button premium-gradient text-white h-12 px-10 rounded-full font-black shadow-lg">
                     {isCreatingUser ? <Loader2 className="animate-spin" /> : "إنشاء الحساب وتفعيله"}
                  </Button>
               </DialogFooter>
            </form>
         </DialogContent>
      </Dialog>

      {/* نافذة تعديل حساب */}
      <Dialog open={showEditUserDialog} onOpenChange={setShowEditUserDialog}>
         <DialogContent className="max-w-xl text-right rounded-[32px] p-0 overflow-hidden shadow-2xl" dir="rtl">
            <DialogHeader className="p-8 bg-blue-50 border-b">
               <DialogTitle className="text-2xl font-black text-blue-700 flex items-center gap-2 justify-end">
                  {editingUser?.username === 'BIM0100' ? <ShieldCheck className="w-6 h-6" /> : <Edit2 className="w-6 h-6" />}
                  تعديل بيانات {editingUser?.username === 'BIM0100' ? "المدير الأساسي" : "الموظف"}
               </DialogTitle>
            </DialogHeader>
            {editingUser && (
              <form onSubmit={handleUpdateUser} className="p-8 space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="col-span-2 space-y-2">
                       <Label className="font-black text-xs">الاسم</Label>
                       <Input required value={editingUser.name} onChange={e => setEditingUser({...editingUser, name: e.target.value})} className="banking-input h-12 text-right" />
                    </div>
                    <div className="space-y-2">
                       <Label className="font-black text-xs">كلمة المرور</Label>
                       <Input required value={editingUser.password || ''} onChange={e => setEditingUser({...editingUser, password: e.target.value})} className="banking-input h-12 text-right font-mono" />
                    </div>
                    
                    {editingUser.username !== 'BIM0100' && (
                      <>
                        <div className="space-y-2">
                          <Label className="font-black text-xs">الرتبة</Label>
                          <Select value={editingUser.role} onValueChange={(v: any) => setEditingUser({...editingUser, role: v})}>
                              <SelectTrigger className="h-12 text-right"><SelectValue /></SelectTrigger>
                              <SelectContent dir="rtl">
                                <SelectItem value="Admin">مدير</SelectItem>
                                <SelectItem value="Specialist">أخصائي</SelectItem>
                                <SelectItem value="Agent">كول سنتر</SelectItem>
                              </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="font-black text-xs">القسم الرئيسي</Label>
                          <Select value={editingUser.department} onValueChange={(v: any) => setEditingUser({...editingUser, department: v})}>
                              <SelectTrigger className="h-12 text-right"><SelectValue /></SelectTrigger>
                              <SelectContent dir="rtl">
                                <SelectItem value="Cards">البطائق</SelectItem>
                                <SelectItem value="Digital">خدمة العملاء</SelectItem>
                                <SelectItem value="App">التطبيق</SelectItem>
                                <SelectItem value="Support">الكول سنتر</SelectItem>
                                <SelectItem value="Operations">العمليات</SelectItem>
                              </SelectContent>
                          </Select>
                        </div>

                        {editingUser.role === 'Admin' && (
                          <div className="col-span-2 space-y-3 bg-blue-50/50 p-4 rounded-2xl border">
                            <Label className="font-black text-sm text-blue-700">الأقسام المسموحة للمدير</Label>
                            <div className="grid grid-cols-2 gap-3">
                                {['Cards', 'Digital', 'App', 'Support', 'Operations'].map((d) => (
                                  <div key={d} className="flex items-center gap-2 justify-end">
                                      <Label className="text-xs font-bold">{d}</Label>
                                      <Checkbox 
                                        checked={editingUser.allowedDepartments?.includes(d as any)} 
                                        onCheckedChange={() => toggleDept(d as any, true)} 
                                      />
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                 </div>
                 <DialogFooter className="flex-row-reverse gap-3 pt-6">
                    <Button type="button" variant="ghost" onClick={() => setShowEditUserDialog(false)} className="rounded-full font-black">إلغاء</Button>
                    <Button type="submit" disabled={isUpdatingUser} className="banking-button bg-blue-600 text-white h-12 px-10 rounded-full font-black">
                       {isUpdatingUser ? <Loader2 className="animate-spin" /> : "حفظ التغييرات"}
                    </Button>
                 </DialogFooter>
              </form>
            )}
         </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({ icon: Icon, title, value, color, valueColor }: any) {
  const isBgColor = color?.startsWith('bg-');
  return (
    <div className={cn("relative rounded-[24px] p-6 shadow-xl", isBgColor ? `${color} text-white` : "bg-white text-slate-900 border")}>
      <div className="flex justify-between items-center relative z-20">
        <div className="text-right">
          <p className={cn("text-xs font-black mb-1", isBgColor ? "text-white/80" : "text-slate-500")}>{title}</p>
          <h3 className={cn("text-3xl font-black tabular-nums", valueColor)}>{value}</h3>
        </div>
        <div className={cn("p-4 rounded-2xl", isBgColor ? "bg-white/20" : "bg-slate-50")}>
          <Icon className={cn("w-6 h-6", isBgColor ? "text-white" : "text-primary")} />
        </div>
      </div>
    </div>
  );
}

function ChartWrapper({ title, icon: Icon, children }: any) {
  return (
    <Card className="banking-card overflow-hidden">
       <CardHeader className="text-right border-b bg-slate-50/50 p-6">
          <CardTitle className="text-xl font-black flex items-center gap-2 justify-end">
             {title} <Icon className="w-5 h-5 text-primary" />
          </CardTitle>
       </CardHeader>
       <CardContent className="p-6 h-[350px]">
          {children}
       </CardContent>
    </Card>
  );
}

function PerformanceSection({ title, icon: Icon, data, color, isVertical }: any) {
  return (
    <Card className="banking-card overflow-hidden">
       <CardHeader className="text-right border-b bg-slate-50/50 p-6">
          <CardTitle className="text-xl font-black flex items-center gap-2 justify-end">
             {title} <Icon className="w-5 h-5" style={{ color }} />
          </CardTitle>
       </CardHeader>
       <CardContent className="p-6 h-[300px]">
          {data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
               {isVertical ? (
                 <BarChart data={data} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" fontSize={12} fontWeight="bold" width={100} orientation="right" />
                    <Tooltip />
                    <Bar dataKey="count" name="بلاغات مرفوعة" fill={color} radius={[0, 8, 8, 0]} />
                 </BarChart>
               ) : (
                 <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" fontSize={11} fontWeight="bold" />
                    <YAxis orientation="right" fontSize={11} fontWeight="bold" />
                    <Tooltip />
                    <Legend verticalAlign="top" align="right" />
                    <Bar dataKey="حل" fill="#10B981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="رفض" fill="#64748b" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="إحالة" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                 </BarChart>
               )}
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2">
               <AlertCircle className="w-8 h-8 opacity-20" />
               <p className="font-black text-xs">لا توجد عمليات مسجلة</p>
            </div>
          )}
       </CardContent>
    </Card>
  );
}

function ConfigListManager({ title, items, value, onValueChange, onAdd, onRemove, onEdit }: any) {
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  return (
    <div className="space-y-4 bg-white p-6 rounded-[24px] border shadow-sm">
      <div className="flex justify-between items-center flex-row-reverse mb-2">
        <h5 className="font-black text-slate-700 text-base">{title}</h5>
        <Badge variant="secondary" className="text-[10px] font-black px-3">{items.length}</Badge>
      </div>
      <div className="flex gap-3">
        <Button onClick={onAdd} size="icon" className="shrink-0 h-12 w-12 rounded-full bg-primary text-white"><Plus className="w-6 h-6" /></Button>
        <Input value={value} onChange={(e) => onValueChange(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && onAdd()} placeholder="أضف خياراً..." className="h-12 text-right" />
      </div>
      <div className="flex flex-wrap gap-2 justify-end">
        {items.map((item: string) => (
          <div key={item}>
            {editingItem === item ? (
              <div className="flex items-center gap-1 bg-slate-100 rounded-full p-1 pr-3">
                <Button variant="ghost" size="icon" onClick={() => { onEdit(item, editValue); setEditingItem(null); }} className="h-7 w-7 text-green-600"><Check className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => setEditingItem(null)} className="h-7 w-7 text-red-500"><X className="w-4 h-4" /></Button>
                <Input value={editValue} onChange={(e) => setEditValue(e.target.value)} className="h-7 w-24 border-none bg-transparent text-right text-xs" />
              </div>
            ) : (
              <Badge variant="outline" className="h-9 px-3 rounded-full flex items-center gap-2 font-bold">
                <button onClick={() => onRemove(item)}><X className="w-3 h-3 text-red-500" /></button>
                <button onClick={() => { setEditingItem(item); setEditValue(item); }}><Edit2 className="w-3 h-3 text-blue-500" /></button>
                <span>{item}</span>
              </Badge>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
