
"use client"

import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users, AlertTriangle, Clock, FileSpreadsheet, ShieldCheck, Trash2, CheckCircle2, 
  Edit2, BarChart3, PieChart as PieChartIcon, MonitorSmartphone, CreditCard, Headset,
  Share2, X, Smartphone, UserPlus, Key, Loader2, Info, AlertCircle, Eye, EyeOff, Plus, ListTodo, Check, Save, TrendingUp, Download
} from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase, deleteDocumentNonBlocking, useDoc, updateDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, doc, arrayUnion, arrayRemove, updateDoc } from 'firebase/firestore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar, PieChart, Pie, Cell, Legend } from 'recharts';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useAuth } from '@/lib/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Department, UserProfile } from '@/lib/types';

const COLORS = ['#1414B8', '#2A3BFF', '#6C63FF', '#10B981', '#F59E0B', '#EF4444'];

export function AdminView() {
  const db = useFirestore();
  const { toast } = useToast();
  const { createEmployeeAccount, updateAdminPassword, updateEmployeeProfile } = useAuth();
  const [activeAdminTab, setActiveAdminTab] = useState('stats');
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [isUpdatingUser, setIsUpdatingUser] = useState(false);
  const [usernameError, setUsernameError] = useState('');
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
    password: ''
  });

  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);

  const configRef = useMemoFirebase(() => db ? doc(db, 'settings', 'system-config') : null, [db]);
  const { data: config } = useDoc(configRef);

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
    if (!tickets || tickets.length === 0) {
      toast({ variant: "destructive", title: "لا توجد بيانات", description: "لا توجد بلاغات لتصديرها حالياً." });
      return;
    }

    const headers = ["رقم البلاغ", "تاريخ وتوقيت البلاغ", "اسم العميل", "رقم CIF / الحساب", "رقم هاتف العميل", "نوع المشكلة الفنية", "الجهة الموجه إليها", "وسيلة استلام الطلب", "وصف المشكلة التفصيلي", "موظف الرفع (Agent)", "الأخصائي المستلم (Specialist)", "حالة البلاغ الحالية", "الرد الفني النهائي / الملاحظات"];

    const rows = tickets.map(t => {
      const clean = (text: string) => text ? text.replace(/\n/g, ' ').replace(/\r/g, ' ').replace(/"/g, '""').trim() : "";
      const statusMap: Record<string, string> = { 'New': 'جديد', 'Pending': 'قيد المعالجة', 'Resolved': 'تم الحل بنجاح', 'Escalated': 'محال للقسم المختص', 'Rejected': 'مرفوض' };
      return [t.ticketID || '', new Date(t.createdAt).toLocaleString('ar-SA'), clean(t.customerName), t.cif || '', t.phoneNumber || '', clean(t.subIssue), clean(t.serviceType), clean(t.intakeMethod), clean(t.description), clean(t.createdByAgentName), clean(t.assignedToSpecialistName || 'لم يتم الاستلام بعد'), statusMap[t.status] || t.status, clean(t.specialistResponse || t.rejectionReason || 'لا يوجد رد بعد')];
    });

    const csvContent = [headers.map(h => `"${h}"`).join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
    const BOM = "\ufeff";
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `تقرير_بلاغات_سند_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "تم التصدير بنجاح" });
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingUser(true);
    try {
      await createEmployeeAccount(newUser);
      toast({ title: "تم إنشاء الحساب بنجاح" });
      setShowAddUserDialog(false);
      setNewUser({ name: '', username: '', dept: 'Cards', password: '' });
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
      await updateEmployeeProfile(editingUser.id, {
        name: editingUser.name,
        department: editingUser.department,
        password: editingUser.password // تحديث كلمة المرور في قاعدة البيانات
      });
      toast({ title: "تم التحديث بنجاح" });
      setShowEditUserDialog(false);
      setEditingUser(null);
    } catch (err: any) {
      toast({ variant: "destructive", title: "فشل التحديث", description: err.message });
    } finally {
      setIsUpdatingUser(false);
    }
  };

  const handleDeleteUser = async (uid: string) => {
    if (!db) return;
    if (confirm('هل أنت متأكد من رغبتك في حذف هذا الحساب؟')) {
      deleteDocumentNonBlocking(doc(db, 'users', uid));
      toast({ title: "تم الحذف" });
    }
  };

  const handleChangeAdminPass = async () => {
    if (newPass.length < 6) return;
    try {
      await updateAdminPassword(newPass);
      toast({ title: "تم تحديث كلمة السر" });
      setShowChangePassDialog(false);
      setNewPass('');
    } catch (err) {
      toast({ variant: "destructive", title: "خطأ" });
    }
  };

  const togglePasswordVisibility = (userId: string) => {
    setVisiblePasswords(prev => ({ ...prev, [userId]: !prev[userId] }));
  };

  const handleAddConfigItem = (field: string) => {
    const val = newItemValues[field];
    if (!val || !db || !configRef) return;
    updateDocumentNonBlocking(configRef, { [field]: arrayUnion(val) });
    setNewItemValues({ ...newItemValues, [field]: '' });
  };

  const handleRemoveConfigItem = (field: string, val: string) => {
    if (!db || !configRef) return;
    updateDocumentNonBlocking(configRef, { [field]: arrayRemove(val) });
  };

  const handleEditConfigItem = async (field: string, oldVal: string, newVal: string) => {
    if (!db || !configRef || !newVal.trim() || oldVal === newVal) return;
    const currentList = config?.[field] || [];
    const newList = currentList.map((item: string) => item === oldVal ? newVal : item);
    await updateDoc(configRef, { [field]: newList });
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
                <Download className="w-4 h-4 ml-2" /> تصدير البلاغات (Excel)
             </Button>
             <Button onClick={() => setShowChangePassDialog(true)} variant="outline" className="rounded-full font-black border-primary text-primary">
                <Key className="w-4 h-4 ml-2" /> كلمة سر الإدارة
             </Button>
             <TabsList className="bg-slate-100 p-1 rounded-full h-auto no-scrollbar overflow-x-auto">
               <TabsTrigger value="stats" className="rounded-full px-6 py-2 font-black data-[state=active]:bg-primary data-[state=active]:text-white transition-all">الإحصائيات</TabsTrigger>
               <TabsTrigger value="staff" className="rounded-full px-6 py-2 font-black data-[state=active]:bg-primary data-[state=active]:text-white transition-all">إدارة الكادر</TabsTrigger>
               <TabsTrigger value="users" className="rounded-full px-6 py-2 font-black data-[state=active]:bg-primary data-[state=active]:text-white transition-all">حسابات النظام</TabsTrigger>
               <TabsTrigger value="options" className="rounded-full px-6 py-2 font-black data-[state=active]:bg-primary data-[state=active]:text-white transition-all">خيارات النظام</TabsTrigger>
             </TabsList>
          </div>
        </div>

        <TabsContent value="stats" className="space-y-8 animate-in fade-in duration-500 mt-0">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard icon={FileSpreadsheet} title="إجمالي البلاغات" value={stats.total} color="bg-primary" />
            <StatCard icon={Clock} title="قيد المعالجة" value={stats.pending} valueColor="text-amber-500" />
            <StatCard icon={CheckCircle2} title="تم حلها" value={stats.resolved} valueColor="text-green-600" />
            <StatCard icon={AlertTriangle} title="بلاغات جديدة" value={stats.new} valueColor="text-red-600" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             <Card className="banking-card border-none shadow-xl overflow-hidden">
                <CardHeader className="text-right border-b bg-slate-50/50 p-6">
                   <CardTitle className="text-xl font-black flex items-center gap-2 justify-end">
                      توزيع حالات البلاغات <PieChartIcon className="w-5 h-5 text-primary" />
                   </CardTitle>
                </CardHeader>
                <CardContent className="p-6 h-[350px]">
                   <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                         <Pie data={stats.statusData} cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={5} dataKey="value">
                            {stats.statusData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                         </Pie>
                         <Tooltip contentStyle={{ borderRadius: '16px', textAlign: 'right' }} />
                         <Legend verticalAlign="bottom" height={36} />
                      </PieChart>
                   </ResponsiveContainer>
                </CardContent>
             </Card>

             <Card className="banking-card border-none shadow-xl overflow-hidden">
                <CardHeader className="text-right border-b bg-slate-50/50 p-6">
                   <CardTitle className="text-xl font-black flex items-center gap-2 justify-end">
                      حجم العمل لكل قسم فني <BarChart3 className="w-5 h-5 text-primary" />
                   </CardTitle>
                </CardHeader>
                <CardContent className="p-6 h-[350px]">
                   <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.deptData}>
                         <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                         <XAxis dataKey="name" fontSize={12} fontWeight="bold" />
                         <YAxis orientation="right" fontSize={12} fontWeight="bold" />
                         <Tooltip contentStyle={{ borderRadius: '16px', textAlign: 'right' }} />
                         <Bar dataKey="tickets" name="عدد البلاغات الموجهة" fill="#2A3BFF" radius={[8, 8, 0, 0]} />
                      </BarChart>
                   </ResponsiveContainer>
                </CardContent>
             </Card>
          </div>

          <div className="pt-4">
             <h2 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-3 justify-end">
                <TrendingUp className="w-6 h-6 text-green-600" /> تقييم أداء الكوادر المصرفية
             </h2>
             <div className="space-y-8">
                <Card className="banking-card border-none shadow-xl overflow-hidden">
                   <CardHeader className="text-right border-b bg-primary/5 p-6">
                      <CardTitle className="text-xl font-black flex items-center gap-2 justify-end">
                         موظفي الكول سنتر (إنتاجية الرفع) <Headset className="w-5 h-5 text-primary" />
                      </CardTitle>
                   </CardHeader>
                   <CardContent className="p-6 h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                         <BarChart data={stats.agentPerf} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" fontSize={12} fontWeight="bold" width={120} orientation="right" />
                            <Tooltip contentStyle={{ borderRadius: '16px', textAlign: 'right' }} />
                            <Bar dataKey="count" name="بلاغات مرفوعة" fill="#6C63FF" radius={[0, 8, 8, 0]} />
                         </BarChart>
                      </ResponsiveContainer>
                   </CardContent>
                </Card>
                <div className="grid grid-cols-1 gap-8">
                   <PerformanceSection title="أداء أخصائيي قسم البطائق (Cards)" icon={CreditCard} data={stats.cardsSpec} color="#1414B8" />
                   <PerformanceSection title="أداء أخصائيي خدمة العملاء (Digital)" icon={MonitorSmartphone} data={stats.digitalSpec} color="#10B981" />
                   <PerformanceSection title="أداء أخصائيي مشاكل التطبيق (App)" icon={Smartphone} data={stats.appSpec} color="#EF4444" />
                </div>
             </div>
          </div>
        </TabsContent>

        <TabsContent value="staff" className="space-y-6 animate-in fade-in duration-500 mt-0">
           <div className="flex justify-between items-center flex-row-reverse">
              <Button onClick={() => setShowAddUserDialog(true)} className="banking-button premium-gradient text-white h-14 px-8 shadow-xl">
                 <UserPlus className="w-5 h-5 ml-2" /> إضافة موظف جديد
              </Button>
              <div className="flex items-center gap-2 text-slate-400 font-bold bg-white px-6 py-3 rounded-full border">
                 <Info className="w-4 h-4 text-primary" />
                 <span>يتم التعرف على هوية الموظف تلقائياً عند الدخول</span>
              </div>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StaffCategoryCard icon={CreditCard} title="قسم البطائق" desc="أخصائيي معالجة البطائق" count={appUsers?.filter(u => u.department === 'Cards').length || 0} />
              <StaffCategoryCard icon={MonitorSmartphone} title="خدمة العملاء" desc="أخصائيي القنوات الرقمية" count={appUsers?.filter(u => u.department === 'Digital').length || 0} />
              <StaffCategoryCard icon={Smartphone} title="مشاكل التطبيق" desc="الدعم الفني المباشر للتطبيق" count={appUsers?.filter(u => u.department === 'App').length || 0} />
              <StaffCategoryCard icon={Headset} title="الكول سنتر" desc="موظفي استلام ورفع البلاغات" count={appUsers?.filter(u => u.department === 'Support').length || 0} />
           </div>
        </TabsContent>

        <TabsContent value="users" className="animate-in fade-in duration-500 mt-0">
           <Card className="banking-card border-none shadow-xl overflow-hidden">
              <CardHeader className="p-8 border-b flex flex-row-reverse items-center justify-between bg-white">
                 <CardTitle className="text-2xl font-black text-primary">حسابات الهوية المصرفية المسجلة</CardTitle>
                 <Badge variant="outline" className="font-black h-8 px-4 border-primary text-primary">{appUsers?.length} مستخدم نشط</Badge>
              </CardHeader>
              <CardContent className="p-0">
                 <Table>
                    <TableHeader className="bg-primary">
                       <TableRow className="hover:bg-primary border-none">
                          <TableHead className="text-right font-black text-white h-14 pr-8">الاسم الكامل</TableHead>
                          <TableHead className="text-right font-black text-white h-14">BIM ID</TableHead>
                          <TableHead className="text-right font-black text-white h-14">كلمة المرور</TableHead>
                          <TableHead className="text-right font-black text-white h-14">القسم</TableHead>
                          <TableHead className="text-center font-black text-white h-14 pl-8">الإجراءات</TableHead>
                       </TableRow>
                    </TableHeader>
                    <TableBody>
                       {appUsers?.map((u, idx) => (
                          <TableRow key={u.id} className={`border-b transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                             <TableCell className="font-bold text-right pr-8">{u.name}</TableCell>
                             <TableCell className="text-right font-mono font-bold text-primary">{u.username || 'N/A'}</TableCell>
                             <TableCell className="text-right">
                                <div className="flex items-center gap-2 justify-end min-w-[120px]">
                                   <span className="font-mono text-sm font-bold min-w-[80px] text-right">
                                      {visiblePasswords[u.id] ? (u.password || 'غير متوفر') : '••••••••'}
                                   </span>
                                   <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-200 rounded-full shrink-0" onClick={() => togglePasswordVisibility(u.id)}>
                                      {visiblePasswords[u.id] ? <EyeOff className="w-4 h-4 text-slate-500" /> : <Eye className="w-4 h-4 text-primary" />}
                                   </Button>
                                </div>
                             </TableCell>
                             <TableCell className="text-right">
                                <Badge className={`rounded-full px-4 font-black ${u.role === 'Admin' ? 'bg-red-500' : 'bg-slate-100 text-slate-600'}`}>
                                   {u.department}
                                </Badge>
                             </TableCell>
                             <TableCell className="text-center pl-8">
                                <div className="flex items-center justify-center gap-2">
                                   <Button variant="ghost" size="icon" onClick={() => { setEditingUser(u); setShowEditUserDialog(true); }} className="text-blue-500 hover:text-blue-700 rounded-full h-10 w-10">
                                      <Edit2 className="w-5 h-5" />
                                   </Button>
                                   <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(u.id)} className="text-red-400 hover:text-red-600 rounded-full h-10 w-10">
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

        <TabsContent value="options" className="animate-in fade-in duration-500 mt-0 space-y-8">
          <div className="grid grid-cols-1 gap-8 max-w-4xl mx-auto">
            <Card className="banking-card border-none shadow-xl">
              <CardHeader className="bg-accent/5 p-6 border-b text-right">
                <CardTitle className="text-xl font-black flex items-center gap-2 justify-end">
                  إدارة تصنيفات النظام <ListTodo className="w-5 h-5 text-accent" />
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-8">
                <ConfigListManager title="وسائل استلام الطلبات" field="intakeMethods" items={config?.intakeMethods || []} value={newItemValues.intakeMethods || ''} onValueChange={(v) => setNewItemValues({...newItemValues, intakeMethods: v})} onAdd={() => handleAddConfigItem('intakeMethods')} onRemove={(val) => handleRemoveConfigItem('intakeMethods', val)} onEdit={(oldVal, newVal) => handleEditConfigItem('intakeMethods', oldVal, newVal)} />
                <ConfigListManager title="أنواع المشكلات الفنية" field="issueTypes" items={config?.issueTypes || []} value={newItemValues.issueTypes || ''} onValueChange={(v) => setNewItemValues({...newItemValues, issueTypes: v})} onAdd={() => handleAddConfigItem('issueTypes')} onRemove={(val) => handleRemoveConfigItem('issueTypes', val)} onEdit={(oldVal, newVal) => handleEditConfigItem('issueTypes', oldVal, newVal)} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={showAddUserDialog} onOpenChange={setShowAddUserDialog}>
         <DialogContent className="max-w-xl text-right rounded-[32px] p-0 overflow-hidden shadow-2xl" dir="rtl">
            <DialogHeader className="p-8 bg-primary/5 border-b">
               <DialogTitle className="text-2xl font-black text-primary flex items-center gap-2 justify-end">
                  <UserPlus className="w-6 h-6" /> إضافة موظف جديد
               </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateUser} className="p-8 space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 col-span-2">
                     <Label className="font-black text-xs mr-1">الاسم الكامل للموظف</Label>
                     <Input required value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} className="banking-input h-12 text-right" placeholder="الاسم الثلاثي المعتمد" />
                  </div>
                  <div className="space-y-2">
                     <Label className="font-black text-xs mr-1">اسم المستخدم (BIM ID)</Label>
                     <Input required value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} className="banking-input h-12 font-mono text-right" placeholder="BIM0101" />
                  </div>
                  <div className="space-y-2">
                     <Label className="font-black text-xs mr-1">تعيين القسم</Label>
                     <Select value={newUser.dept} onValueChange={(v: any) => setNewUser({...newUser, dept: v})}>
                        <SelectTrigger className="banking-input h-12 text-right"><SelectValue /></SelectTrigger>
                        <SelectContent dir="rtl">
                           <SelectItem value="Support">الكول سنتر (Support)</SelectItem>
                           <SelectItem value="Cards">إدارة البطائق (Cards)</SelectItem>
                           <SelectItem value="Digital">خدمة العملاء (Digital)</SelectItem>
                           <SelectItem value="App">مشاكل التطبيق (App)</SelectItem>
                        </SelectContent>
                     </Select>
                  </div>
                  <div className="col-span-2 space-y-2">
                     <Label className="font-black text-xs mr-1">كلمة المرور الافتتاحية</Label>
                     <Input required type="password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} className="banking-input h-12 text-right" placeholder="••••••••" />
                  </div>
               </div>
               <DialogFooter className="flex-row-reverse gap-3 pt-6">
                  <Button type="button" variant="ghost" onClick={() => setShowAddUserDialog(false)} className="rounded-full font-black px-8 h-12">إلغاء</Button>
                  <Button type="submit" disabled={isCreatingUser} className="banking-button premium-gradient text-white h-12 px-10 rounded-full font-black shadow-lg">
                     {isCreatingUser ? <Loader2 className="animate-spin" /> : "إنشاء الحساب وتفعيله"}
                  </Button>
               </DialogFooter>
            </form>
         </DialogContent>
      </Dialog>

      <Dialog open={showEditUserDialog} onOpenChange={setShowEditUserDialog}>
         <DialogContent className="max-w-xl text-right rounded-[32px] p-0 overflow-hidden shadow-2xl" dir="rtl">
            <DialogHeader className="p-8 bg-blue-50 border-b">
               <DialogTitle className="text-2xl font-black text-blue-700 flex items-center gap-2 justify-end">
                  <Edit2 className="w-6 h-6" /> تعديل بيانات الموظف والتحكم بالحساب
               </DialogTitle>
            </DialogHeader>
            {editingUser && (
              <form onSubmit={handleUpdateUser} className="p-8 space-y-6">
                 <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-2">
                       <Label className="font-black text-xs mr-1">الاسم الكامل</Label>
                       <Input required value={editingUser.name} onChange={e => setEditingUser({...editingUser, name: e.target.value})} className="banking-input h-12 text-right" />
                    </div>
                    <div className="space-y-2">
                       <Label className="font-black text-xs mr-1">تعديل القسم</Label>
                       <Select value={editingUser.department} onValueChange={(v: any) => setEditingUser({...editingUser, department: v})}>
                          <SelectTrigger className="banking-input h-12 text-right"><SelectValue /></SelectTrigger>
                          <SelectContent dir="rtl">
                             <SelectItem value="Support">الكول سنتر (Support)</SelectItem>
                             <SelectItem value="Cards">إدارة البطائق (Cards)</SelectItem>
                             <SelectItem value="Digital">خدمة العملاء (Digital)</SelectItem>
                             <SelectItem value="App">مشاكل التطبيق (App)</SelectItem>
                          </SelectContent>
                       </Select>
                    </div>
                    <div className="space-y-2">
                       <Label className="font-black text-xs mr-1">تعيين كلمة مرور جديدة (اختياري)</Label>
                       <Input 
                        type="text" 
                        value={editingUser.password || ''} 
                        onChange={e => setEditingUser({...editingUser, password: e.target.value})} 
                        className="banking-input h-12 text-right font-mono" 
                        placeholder="اتركه كما هو لعدم التغيير" 
                       />
                       <p className="text-[10px] text-slate-400 font-bold mr-1">سيتم تحديث كلمة المرور في قاعدة البيانات ليتمكن الموظف من الدخول بها</p>
                    </div>
                 </div>
                 <DialogFooter className="flex-row-reverse gap-3 pt-6">
                    <Button type="button" variant="ghost" onClick={() => setShowEditUserDialog(false)} className="rounded-full font-black px-8 h-12">إلغاء</Button>
                    <Button type="submit" disabled={isUpdatingUser} className="banking-button bg-blue-600 hover:bg-blue-700 text-white h-12 px-10 rounded-full font-black shadow-lg">
                       {isUpdatingUser ? <Loader2 className="animate-spin" /> : "حفظ كافة التغييرات"}
                    </Button>
                 </DialogFooter>
              </form>
            )}
         </DialogContent>
      </Dialog>

      <Dialog open={showChangePassDialog} onOpenChange={setShowChangePassDialog}>
         <DialogContent className="max-md text-right rounded-[32px] p-0 overflow-hidden shadow-2xl" dir="rtl">
            <DialogHeader className="p-8 bg-primary/5 border-b">
               <DialogTitle className="text-2xl font-black text-primary flex items-center gap-2 justify-end">
                  <Key className="w-6 h-6" /> تحديث كلمة سر الإدارة
               </DialogTitle>
            </DialogHeader>
            <div className="p-8 space-y-6">
               <div className="space-y-3">
                  <Label className="font-black text-sm mr-1">كلمة السر الجديدة</Label>
                  <Input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} className="banking-input h-14 text-right" placeholder="••••••••" />
               </div>
               <div className="pt-4 flex flex-col gap-3">
                  <Button onClick={handleChangeAdminPass} className="banking-button premium-gradient text-white h-14 rounded-full font-black shadow-xl">
                     تحديث كلمة السر الآن
                  </Button>
               </div>
            </div>
         </DialogContent>
      </Dialog>
    </div>
  );
}

function PerformanceSection({ title, icon: Icon, data, color }: any) {
  return (
    <Card className="banking-card border-none shadow-xl overflow-hidden">
       <CardHeader className="text-right border-b bg-slate-50/50 p-6">
          <CardTitle className="text-xl font-black flex items-center gap-2 justify-end">
             {title} <Icon className="w-5 h-5" style={{ color }} />
          </CardTitle>
       </CardHeader>
       <CardContent className="p-6 h-[300px]">
          {data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
               <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" fontSize={11} fontWeight="bold" />
                  <YAxis orientation="right" fontSize={11} fontWeight="bold" />
                  <Tooltip contentStyle={{ borderRadius: '16px', textAlign: 'right' }} />
                  <Legend verticalAlign="top" align="right" height={36} />
                  <Bar dataKey="حل" fill="#10B981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="رفض" fill="#64748b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="إحالة" fill="#f59e0b" radius={[4, 4, 0, 0]} />
               </BarChart>
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

function StatCard({ icon: Icon, title, value, color, valueColor }: any) {
  const isBgColor = color?.startsWith('bg-');
  return (
    <div className={cn("relative rounded-[24px] p-6 shadow-xl overflow-hidden", isBgColor ? `${color} text-white` : "bg-white text-slate-900 border border-slate-100")}>
      <div className="flex justify-between items-center relative z-20">
        <div className="text-right">
          <p className={cn("text-xs font-black mb-1", isBgColor ? "text-white/80" : "text-slate-500")}>{title}</p>
          <h3 className={cn("text-3xl font-black tabular-nums", valueColor)}>{value}</h3>
        </div>
        <div className={cn("p-4 rounded-2xl flex items-center justify-center", isBgColor ? "bg-white/20" : "bg-slate-50")}>
          <Icon className={cn("w-6 h-6", isBgColor ? "text-white" : "text-primary")} />
        </div>
      </div>
    </div>
  );
}

function StaffCategoryCard({ icon: Icon, title, desc, count }: any) {
  return (
    <Card className="banking-card p-6 border-none shadow-md text-center space-y-4 hover:scale-105 transition-all">
       <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
          <Icon className="w-8 h-8 text-primary" />
       </div>
       <div>
          <h3 className="font-black text-slate-800">{title}</h3>
          <p className="text-[10px] text-slate-400 font-bold mt-1">{desc}</p>
       </div>
       <div className="pt-2">
          <Badge variant="secondary" className="font-black px-4 py-1">{count} موظفين</Badge>
       </div>
    </Card>
  );
}

function ConfigListManager({ title, items, value, onValueChange, onAdd, onRemove, onEdit }: any) {
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const startEdit = (item: string) => { setEditingItem(item); setEditValue(item); };
  const cancelEdit = () => { setEditingItem(null); setEditValue(""); };
  const confirmEdit = () => {
    if (editingItem && editValue.trim()) {
      onEdit(editingItem, editValue.trim());
      setEditingItem(null);
      setEditValue("");
    }
  };

  return (
    <div className="space-y-4 bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm">
      <div className="flex justify-between items-center flex-row-reverse mb-2">
        <h5 className="font-black text-slate-700 text-base">{title}</h5>
        <Badge variant="secondary" className="text-[10px] font-black px-3">{items.length} خيارات</Badge>
      </div>
      <div className="flex gap-3">
        <Button onClick={onAdd} size="icon" className="shrink-0 h-12 w-12 rounded-full bg-primary hover:bg-primary/90 text-white shadow-md">
          <Plus className="w-6 h-6" />
        </Button>
        <Input value={value} onChange={(e) => onValueChange(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && onAdd()} placeholder={`أضف خياراً جديداً...`} className="banking-input h-12 text-right text-sm border-slate-200" />
      </div>
      <div className="flex flex-wrap gap-3 justify-end max-h-[250px] overflow-y-auto p-2 no-scrollbar">
        {items.map((item: string) => (
          <div key={item} className="flex items-center gap-2">
            {editingItem === item ? (
              <div className="flex items-center gap-2 bg-slate-50 border rounded-full p-1 pl-3 transition-all animate-in zoom-in-95">
                <Button variant="ghost" size="icon" onClick={confirmEdit} className="h-8 w-8 rounded-full text-green-600 hover:bg-green-50"><Check className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" onClick={cancelEdit} className="h-8 w-8 rounded-full text-red-500 hover:bg-red-50"><X className="w-4 h-4" /></Button>
                <Input autoFocus value={editValue} onChange={(e) => setEditValue(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && confirmEdit()} className="h-8 w-32 border-none bg-transparent text-right font-bold text-sm focus-visible:ring-0 p-0" />
              </div>
            ) : (
              <Badge variant="outline" className="h-10 pl-2 pr-4 rounded-full flex items-center gap-2 bg-slate-50 border-slate-200 text-slate-700 font-bold hover:shadow-sm group transition-all">
                <div className="flex items-center gap-1">
                  <button onClick={() => onRemove(item)} className="p-1 rounded-full opacity-40 group-hover:opacity-100 hover:bg-red-100 hover:text-red-500 transition-all"><X className="w-3 h-3" /></button>
                  <button onClick={() => startEdit(item)} className="p-1 rounded-full opacity-40 group-hover:opacity-100 hover:bg-blue-100 hover:text-blue-500 transition-all"><Edit2 className="w-3 h-3" /></button>
                </div>
                <span>{item}</span>
              </Badge>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
