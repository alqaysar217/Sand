
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
  Share2, X, Smartphone, UserPlus, Key, Loader2, Info, AlertCircle, Eye, EyeOff, Plus, ListTodo, Check, Save, TrendingUp, Download, ShieldAlert, Shield, Eraser
} from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase, deleteDocumentNonBlocking, useDoc, updateDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, doc, arrayUnion, arrayRemove, updateDoc, writeBatch, getDocs } from 'firebase/firestore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar, PieChart, Pie, Cell, Legend } from 'recharts';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useAuth } from '@/lib/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Department, UserProfile, UserRole } from '@/lib/types';

const COLORS = ['#1414B8', '#F59E0B', '#10B981', '#EF4444', '#64748b', '#6C63FF'];

export function AdminView() {
  const db = useFirestore();
  const { toast } = useToast();
  const { user: currentAdmin, createEmployeeAccount, updateEmployeeProfile, checkUsernameExists } = useAuth();
  const [activeAdminTab, setActiveAdminTab] = useState('stats');
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [isUpdatingUser, setIsUpdatingUser] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [showAddUserDialog, setShowAddUserDialog] = useState(false);
  const [showEditUserDialog, setShowEditUserDialog] = useState(false);
  const [usernameError, setUsernameError] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [newItemValues, setNewItemValues] = useState<Record<string, string>>({});

  const isPrimaryAdmin = currentAdmin?.username === 'BIM0100';

  useEffect(() => {
    const handleSidebarNav = (e: any) => {
      const action = e.detail;
      if (['stats', 'users', 'options', 'staff'].includes(action)) {
        setActiveAdminTab(action === 'staff' ? 'users' : action);
      }
    };
    window.addEventListener('sidebar-nav', handleSidebarNav);
    return () => window.removeEventListener('sidebar-nav', handleSidebarNav);
  }, []);

  const [newUser, setNewUser] = useState({
    name: '',
    username: '',
    dept: 'Support' as Department,
    role: 'Agent' as UserRole,
    password: '',
    allowedDepts: [] as Department[]
  });

  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);

  const configRef = useMemoFirebase(() => db ? doc(db, 'settings', 'system-config') : null, [db]);
  const { data: config } = useDoc(configRef);

  const allTicketsQuery = useMemoFirebase(() => db ? query(collection(db, 'tickets'), orderBy('createdAt', 'desc')) : null, [db]);
  const { data: tickets } = useCollection(allTicketsQuery);

  const usersQuery = useMemoFirebase(() => db ? query(collection(db, 'users')) : null, [db]);
  const { data: appUsers } = useCollection<UserProfile>(usersQuery);

  const staffStats = useMemo(() => {
    if (!appUsers) return { total: 0, admins: 0, agents: 0, specialists: 0, deptCounts: {} as Record<string, number> };
    const counts: Record<string, number> = {};
    appUsers.forEach(u => {
      counts[u.department] = (counts[u.department] || 0) + 1;
    });
    return {
      total: appUsers.length,
      admins: appUsers.filter(u => u.role === 'Admin').length,
      agents: appUsers.filter(u => u.role === 'Agent').length,
      specialists: appUsers.filter(u => u.role === 'Specialist').length,
      deptCounts: counts
    };
  }, [appUsers]);

  const stats = useMemo(() => {
    if (!tickets || tickets.length === 0) return { total: 0, resolved: 0, pending: 0, new: 0, deptData: [], statusData: [], agentPerf: [], cardsSpec: [], digitalSpec: [], appSpec: [] };
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
        if (!specMap[t.assignedToSpecialistId]) specMap[t.assignedToSpecialistId] = { name: t.assignedToSpecialistName || 'غير معروف', dept: t.serviceType, resolved: 0, rejected: 0, escalated: 0 };
        if (t.status === 'Resolved') specMap[t.assignedToSpecialistId].resolved++;
        if (t.status === 'Rejected') specMap[t.assignedToSpecialistId].rejected++;
        if (t.status === 'Escalated') specMap[t.assignedToSpecialistId].escalated++;
      }
    });

    const arabicStatusLabels: Record<string, string> = {
      'New': 'جديد',
      'Pending': 'قيد المعالجة',
      'Resolved': 'تم الحل',
      'Escalated': 'محال',
      'Rejected': 'مرفوض'
    };

    return {
      total: tickets.length,
      resolved: statusMap['Resolved'],
      pending: statusMap['Pending'],
      new: statusMap['New'],
      deptData: Object.entries(deptMap).map(([name, tickets]) => ({ name, tickets })),
      statusData: Object.entries(statusMap).map(([name, value]) => ({ 
        name: arabicStatusLabels[name] || name, 
        value 
      })).filter(s => s.value > 0),
      agentPerf: Object.values(agentMap).sort((a, b) => b.count - a.count).slice(0, 5),
      cardsSpec: Object.values(specMap).filter(s => s.dept === 'إدارة البطائق').map(s => ({ name: s.name, حل: s.resolved, رفض: s.rejected, إحالة: s.escalated })),
      digitalSpec: Object.values(specMap).filter(s => s.dept === 'خدمة العملاء').map(s => ({ name: s.name, حل: s.resolved, رفض: s.rejected, إحالة: s.escalated })),
      appSpec: Object.values(specMap).filter(s => s.dept === 'مشاكل التطبيق').map(s => ({ name: s.name, حل: s.resolved, رفض: s.rejected, إحالة: s.escalated }))
    };
  }, [tickets]);

  const handleCheckUsername = async (username: string) => {
    setNewUser({ ...newUser, username });
    if (username.length > 3) {
      const exists = await checkUsernameExists(username);
      setUsernameError(exists);
    } else {
      setUsernameError(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (usernameError) return;
    
    // تحديد الدور التقني بناءً على القسم إذا لم يكن مديراً
    const technicalRole = newUser.role === 'Admin' 
      ? 'Admin' 
      : (newUser.dept === 'Support' ? 'Agent' : 'Specialist');

    if (!isPrimaryAdmin && technicalRole === 'Admin') {
      toast({ variant: "destructive", title: "صلاحيات غير كافية", description: "لا يمكن للمدير المساعد إضافة حسابات مدراء." });
      return;
    }

    setIsCreatingUser(true);
    try {
      await createEmployeeAccount({ ...newUser, role: technicalRole });
      toast({ title: "تم إنشاء الحساب بنجاح" });
      setShowAddUserDialog(false);
      setNewUser({ name: '', username: '', dept: 'Support', role: 'Agent', password: '', allowedDepts: [] });
    } catch (err: any) {
      toast({ variant: "destructive", title: "فشل الإنشاء", description: err.message });
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleDeleteAllTickets = async () => {
    if (!isPrimaryAdmin || !db) return;
    setIsDeletingAll(true);
    try {
      const ticketsRef = collection(db, 'tickets');
      const snapshot = await getDocs(ticketsRef);
      const batch = writeBatch(db);
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      toast({ title: "تم تصفير النظام", description: "تم حذف كافة البلاغات بنجاح." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "فشل الحذف", description: err.message });
    } finally {
      setIsDeletingAll(false);
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

  const exportToCSV = () => {
    if (!tickets || tickets.length === 0) return;
    
    const headers = ["رقم البلاغ", "التاريخ", "اسم العميل", "رقم CIF/الحساب", "الهاتف", "نوع المشكلة", "الجهة الموجه إليها", "الوسيلة", "الوصف الأصلي", "رافع البلاغ", "مستلم البلاغ", "الحالة الحالية", "سجل الردود والمتابعات الكامل"];
    
    const rows = tickets.map(t => {
      const logsText = (t.logs || []).map((log: any) => {
        const dateStr = new Date(log.timestamp).toLocaleString('ar-SA');
        return `[${dateStr}] ${log.userName}: ${log.action}${log.note ? ` (ملاحظة: ${log.note.replace(/[\n\r]/g, ' ')})` : ''}`;
      }).join(' | ');

      return [
        t.ticketID || '',
        new Date(t.createdAt).toLocaleString('ar-SA'),
        t.customerName,
        t.cif || '',
        t.phoneNumber || '',
        t.subIssue,
        t.serviceType,
        t.intakeMethod,
        (t.description || '').replace(/[\n\r]/g, ' '),
        t.createdByAgentName,
        t.assignedToSpecialistName || 'لم يستلم بعد',
        t.status,
        logsText
      ];
    });

    const csvContent = "\ufeff" + [headers.join(','), ...rows.map(e => e.map(x => `"${(x || '').toString().replace(/"/g, '""')}"`).join(','))].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `سند_بلاغات_تفصيلي_${new Date().toLocaleDateString('ar-SA')}.csv`;
    link.click();
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
             {isPrimaryAdmin && (
               <AlertDialog>
                 <AlertDialogTrigger asChild>
                   <Button variant="outline" className="rounded-full font-black border-red-600 text-red-600 hover:bg-red-50">
                      <Eraser className="w-4 h-4 ml-2" /> تصفير كافة البلاغات
                   </Button>
                 </AlertDialogTrigger>
                 <AlertDialogContent dir="rtl" className="text-right rounded-[32px]">
                   <AlertDialogHeader>
                     <AlertDialogTitle className="font-black text-right flex items-center gap-2">تنبيه أمني خطير <ShieldAlert className="text-red-600 w-6 h-6" /></AlertDialogTitle>
                     <AlertDialogDescription className="text-right font-bold text-slate-600">
                        أنت على وشك حذف كافة البلاغات المسجلة في النظام نهائياً. لن يكون بإمكانك استعادة هذه البيانات لاحقاً. هل تريد المتابعة؟
                     </AlertDialogDescription>
                   </AlertDialogHeader>
                   <AlertDialogFooter className="flex-row-reverse gap-3">
                     <AlertDialogCancel className="rounded-full font-black">إلغاء</AlertDialogCancel>
                     <AlertDialogAction onClick={handleDeleteAllTickets} className="bg-red-600 hover:bg-red-700 text-white rounded-full font-black">
                        {isDeletingAll ? <Loader2 className="animate-spin" /> : "نعم، حذف الكل نهائياً"}
                     </AlertDialogAction>
                   </AlertDialogFooter>
                 </AlertDialogContent>
               </AlertDialog>
             )}
             <Button onClick={exportToCSV} variant="outline" className="rounded-full font-black border-green-600 text-green-600 hover:bg-green-50">
                <Download className="w-4 h-4 ml-2" /> تصدير السجل التفصيلي
             </Button>
             <TabsList className="bg-slate-100 p-1 rounded-full h-auto">
               <TabsTrigger value="stats" className="rounded-full px-6 py-2 font-black">الإحصائيات</TabsTrigger>
               <TabsTrigger value="users" className="rounded-full px-6 py-2 font-black">إدارة الحسابات</TabsTrigger>
               <TabsTrigger value="options" className="rounded-full px-6 py-2 font-black">خيارات النظام</TabsTrigger>
             </TabsList>
          </div>
        </div>

        <TabsContent value="stats" className="space-y-8">
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
                      <Legend verticalAlign="bottom" align="center" iconType="circle" />
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
                <PerformanceSection title="موظفي الكول سنتر (الأكثر رفعاً)" icon={Headset} data={stats.agentPerf} color="#6C63FF" isVertical />
                <div className="grid grid-cols-1 gap-8">
                   <PerformanceSection title="أداء أخصائيي البطائق" icon={CreditCard} data={stats.cardsSpec} color="#1414B8" />
                   <PerformanceSection title="أداء أخصائيي خدمة العملاء" icon={MonitorSmartphone} data={stats.digitalSpec} color="#10B981" />
                   <PerformanceSection title="أداء أخصائيي مشاكل التطبيق" icon={Smartphone} data={stats.appSpec} color="#EF4444" />
                </div>
             </div>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-8">
           <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <MiniStat title="الكول سنتر" value={staffStats.deptCounts['Support'] || 0} icon={Headset} color="text-primary" />
              <MiniStat title="البطائق" value={staffStats.deptCounts['Cards'] || 0} icon={CreditCard} color="text-blue-600" />
              <MiniStat title="خدمة العملاء" value={staffStats.deptCounts['Digital'] || 0} icon={MonitorSmartphone} color="text-green-600" />
              <MiniStat title="التطبيق" value={staffStats.deptCounts['App'] || 0} icon={Smartphone} color="text-red-500" />
              <MiniStat title="الإدارة" value={staffStats.admins} icon={ShieldCheck} color="text-amber-600" />
           </div>

           <Card className="banking-card overflow-hidden">
              <CardHeader className="p-8 border-b flex flex-row-reverse items-center justify-between">
                 <CardTitle className="text-2xl font-black text-primary">إدارة الحسابات المصرفية</CardTitle>
                 {isPrimaryAdmin && (
                   <Button onClick={() => setShowAddUserDialog(true)} className="banking-button premium-gradient text-white h-12 px-6">
                      <UserPlus className="w-5 h-5 ml-2" /> إضافة حساب جديد
                   </Button>
                 )}
              </CardHeader>
              <CardContent className="p-8 space-y-12">
                 <div className="space-y-4">
                    <h3 className="text-xl font-black text-slate-800 flex items-center gap-2 justify-end">حسابات المدراء والمشرفين <Shield className="w-5 h-5 text-amber-500" /></h3>
                    <UserTable 
                      users={appUsers?.filter(u => u.role === 'Admin') || []} 
                      onEdit={(u: UserProfile) => { if (isPrimaryAdmin || currentAdmin?.id === u.id) { setEditingUser(u); setShowEditUserDialog(true); } }}
                      onDelete={(u: UserProfile) => handleDeleteUser(u, isPrimaryAdmin, toast)}
                      visiblePasswords={visiblePasswords}
                      setVisiblePasswords={setVisiblePasswords}
                      isPrimaryAdmin={isPrimaryAdmin}
                      isAdminTable={true}
                      currentAdminId={currentAdmin?.id}
                    />
                 </div>

                 <div className="space-y-4">
                    <h3 className="text-xl font-black text-slate-800 flex items-center gap-2 justify-end">حسابات الموظفين (الأقسام الفنية والكول سنتر) <Users className="w-5 h-5 text-primary" /></h3>
                    <UserTable 
                      users={appUsers?.filter(u => u.role !== 'Admin') || []} 
                      onEdit={(u: UserProfile) => { if (isPrimaryAdmin) { setEditingUser(u); setShowEditUserDialog(true); } }}
                      onDelete={(u: UserProfile) => handleDeleteUser(u, isPrimaryAdmin, toast)}
                      visiblePasswords={visiblePasswords}
                      setVisiblePasswords={setVisiblePasswords}
                      isPrimaryAdmin={isPrimaryAdmin}
                      isAdminTable={false}
                      currentAdminId={currentAdmin?.id}
                    />
                 </div>
              </CardContent>
           </Card>
        </TabsContent>

        <TabsContent value="options" className="animate-in fade-in duration-500">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              <ConfigListManager title="وسائل استلام الطلبات" items={config?.intakeMethods || []} value={newItemValues.intakeMethods || ''} onValueChange={(v: string) => setNewItemValues({...newItemValues, intakeMethods: v})} onAdd={() => { updateDocumentNonBlocking(configRef!, { intakeMethods: arrayUnion(newItemValues.intakeMethods) }); setNewItemValues({...newItemValues, intakeMethods: ''}); }} onRemove={(v: string) => updateDocumentNonBlocking(configRef!, { intakeMethods: arrayRemove(v) })} onEdit={(old: string, val: string) => { const list = (config?.intakeMethods || []).map((i: string) => i === old ? val : i); updateDoc(configRef!, { intakeMethods: list }); }} />
              <ConfigListManager title="أنواع المشكلات الفنية" items={config?.issueTypes || []} value={newItemValues.issueTypes || ''} onValueChange={(v: string) => setNewItemValues({...newItemValues, issueTypes: v})} onAdd={() => { updateDocumentNonBlocking(configRef!, { intakeMethods: arrayUnion(newItemValues.issueTypes) }); setNewItemValues({...newItemValues, issueTypes: ''}); }} onRemove={(v: string) => updateDocumentNonBlocking(configRef!, { intakeMethods: arrayRemove(v) })} onEdit={(old: string, val: string) => { const list = (config?.issueTypes || []).map((i: string) => i === old ? val : i); updateDoc(configRef!, { intakeMethods: list }); }} />
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
                     <Label className="font-black text-xs mr-1">BIM ID (اسم المستخدم)</Label>
                     <Input required value={newUser.username} onChange={e => handleCheckUsername(e.target.value)} className={cn("banking-input h-12 font-mono text-right", usernameError && "border-red-500 focus:ring-red-200")} />
                     {usernameError && <p className="text-[10px] text-red-600 font-black mr-2">BIM ID هذا محجوز لموظف آخر!</p>}
                  </div>
                  <div className="space-y-2">
                     <Label className="font-black text-xs mr-1">كلمة المرور</Label>
                     <Input required type="password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} className="banking-input h-12 text-right" />
                  </div>
                  <div className="space-y-2">
                     <Label className="font-black text-xs mr-1">الرتبة الوظيفية</Label>
                     <Select 
                        value={newUser.role === 'Admin' ? 'Admin' : 'Employee'} 
                        onValueChange={(v: any) => setNewUser({...newUser, role: v === 'Admin' ? 'Admin' : 'Agent'})}
                      >
                        <SelectTrigger className="h-12 text-right"><SelectValue /></SelectTrigger>
                        <SelectContent dir="rtl">
                           {isPrimaryAdmin && <SelectItem value="Admin">مدير</SelectItem>}
                           <SelectItem value="Employee">موظف</SelectItem>
                        </SelectContent>
                     </Select>
                  </div>

                  {newUser.role !== 'Admin' ? (
                     <div className="space-y-2">
                        <Label className="font-black text-xs mr-1">القسم الرئيسي</Label>
                        <Select value={newUser.dept} onValueChange={(v: any) => setNewUser({...newUser, dept: v})}>
                           <SelectTrigger className="h-12 text-right"><SelectValue /></SelectTrigger>
                           <SelectContent dir="rtl">
                              <SelectItem value="Support">الكول سنتر (Support)</SelectItem>
                              <SelectItem value="Cards">إدارة البطائق (Cards)</SelectItem>
                              <SelectItem value="Digital">خدمة العملاء (Digital)</SelectItem>
                              <SelectItem value="App">مشاكل التطبيق (App)</SelectItem>
                              <SelectItem value="Operations">العمليات (Operations)</SelectItem>
                           </SelectContent>
                        </Select>
                     </div>
                  ) : (
                     <div className="col-span-2 space-y-4 bg-amber-50 p-6 rounded-2xl border border-amber-100">
                        <Label className="font-black text-sm text-amber-800">الأقسام المسموح للمدير بدخولها</Label>
                        <div className="grid grid-cols-2 gap-4">
                           {['Operations', 'Support', 'Cards', 'Digital', 'App'].map((d) => (
                              <div key={d} className="flex items-center gap-3 justify-end">
                                 <Label className="text-xs font-bold text-slate-600">{d}</Label>
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
                  <Button type="submit" disabled={isCreatingUser || usernameError} className="banking-button premium-gradient text-white h-12 px-10 rounded-full font-black">
                     {isCreatingUser ? <Loader2 className="animate-spin" /> : "إضافة الكادر وتفعيله"}
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
              <form onSubmit={async (e) => { 
                e.preventDefault(); 
                setIsUpdatingUser(true); 
                try {
                  // تحديث الدور الفني بناءً على القسم عند التعديل إذا لم يكن مديراً
                  const finalData = { ...editingUser };
                  if (finalData.role !== 'Admin') {
                    finalData.role = finalData.department === 'Support' ? 'Agent' : 'Specialist';
                  }
                  await updateEmployeeProfile(editingUser.id, finalData); 
                  toast({title: "تم تحديث البيانات بنجاح"}); 
                  setShowEditUserDialog(false); 
                } catch (err: any) {
                  toast({variant: "destructive", title: "فشل التحديث", description: err.message});
                } finally {
                  setIsUpdatingUser(false); 
                }
              }} className="p-8 space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="col-span-2 space-y-2">
                       <Label className="font-black text-xs">الاسم الكامل</Label>
                       <Input required value={editingUser.name} onChange={e => setEditingUser({...editingUser, name: e.target.value})} className="banking-input h-12 text-right" />
                    </div>
                    <div className="space-y-2">
                       <Label className="font-black text-xs">كلمة المرور الجديدة</Label>
                       <Input required value={editingUser.password || ''} onChange={e => setEditingUser({...editingUser, password: e.target.value})} className="banking-input h-12 text-right font-mono" />
                    </div>
                    
                    {editingUser.username !== 'BIM0100' && (
                      <>
                        <div className="space-y-2">
                          <Label className="font-black text-xs">الرتبة</Label>
                          <Select 
                            value={editingUser.role === 'Admin' ? 'Admin' : 'Employee'} 
                            onValueChange={(v: any) => setEditingUser({...editingUser, role: v === 'Admin' ? 'Admin' : 'Agent'})}
                          >
                              <SelectTrigger className="h-12 text-right"><SelectValue /></SelectTrigger>
                              <SelectContent dir="rtl">
                                <SelectItem value="Admin">مدير</SelectItem>
                                <SelectItem value="Employee">موظف</SelectItem>
                              </SelectContent>
                          </Select>
                        </div>
                        
                        {editingUser.role !== 'Admin' ? (
                          <div className="space-y-2">
                            <Label className="font-black text-xs">القسم الرئيسي</Label>
                            <Select value={editingUser.department} onValueChange={(v: any) => setEditingUser({...editingUser, department: v})}>
                                <SelectTrigger className="h-12 text-right"><SelectValue /></SelectTrigger>
                                <SelectContent dir="rtl">
                                  <SelectItem value="Support">الكول سنتر</SelectItem>
                                  <SelectItem value="Cards">البطائق</SelectItem>
                                  <SelectItem value="Digital">خدمة العملاء</SelectItem>
                                  <SelectItem value="App">التطبيق</SelectItem>
                                  <SelectItem value="Operations">العمليات</SelectItem>
                                </SelectContent>
                            </Select>
                          </div>
                        ) : (
                          <div className="col-span-2 space-y-3 bg-blue-50/50 p-4 rounded-2xl border">
                            <Label className="font-black text-sm text-blue-700">الأقسام المسموحة للمدير</Label>
                            <div className="grid grid-cols-2 gap-3">
                                {['Operations', 'Support', 'Cards', 'Digital', 'App'].map((d) => (
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

function UserTable({ users, onEdit, onDelete, visiblePasswords, setVisiblePasswords, isPrimaryAdmin, isAdminTable, currentAdminId }: any) {
  return (
    <div className="border rounded-[24px] overflow-hidden bg-white shadow-sm">
      <Table>
        <TableHeader className="bg-slate-50">
          <TableRow className="border-none">
            <TableHead className="text-right font-black text-slate-700 h-14 pr-8">الموظف</TableHead>
            <TableHead className="text-right font-black text-slate-700 h-14">BIM ID</TableHead>
            <TableHead className="text-right font-black text-slate-700 h-14">كلمة المرور</TableHead>
            <TableHead className="text-right font-black text-slate-700 h-14">القسم</TableHead>
            <TableHead className="text-center font-black text-slate-700 h-14 pl-8">إجراء</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((u: UserProfile) => {
            const isMe = currentAdminId === u.id;
            const canEdit = isPrimaryAdmin || isMe;
            return (
              <TableRow key={u.id} className="hover:bg-slate-50 transition-colors">
                <TableCell className="font-bold text-right pr-8">{u.name} {isMe && "(أنت)"}</TableCell>
                <TableCell className="text-right font-mono font-bold text-primary">{u.username}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center gap-2 justify-end">
                    <span className="font-mono text-sm font-bold">
                      {(visiblePasswords[u.id] && isPrimaryAdmin) ? u.password : '••••••••'}
                    </span>
                    {isPrimaryAdmin && (
                      <Button variant="ghost" size="icon" onClick={() => setVisiblePasswords((p: any) => ({...p, [u.id]: !p[u.id]}))}>
                        {visiblePasswords[u.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                   {u.role === 'Admin' ? (
                     <div className="flex flex-wrap gap-1 justify-end">
                        {u.allowedDepartments?.map(d => <Badge key={d} variant="secondary" className="text-[9px] px-1.5">{d}</Badge>)}
                     </div>
                   ) : (
                     <span className="font-bold text-slate-500">{u.department}</span>
                   )}
                </TableCell>
                <TableCell className="text-center pl-8">
                  <div className="flex items-center justify-center gap-2">
                     <Button 
                      variant="ghost" 
                      size="icon" 
                      disabled={!canEdit} 
                      onClick={() => onEdit(u)} 
                      className={canEdit ? "text-blue-500" : "text-slate-200"}
                    >
                      <Edit2 className="w-5 h-5" />
                    </Button>
                     <Button 
                      variant="ghost" 
                      size="icon" 
                      disabled={u.username === 'BIM0100' || !isPrimaryAdmin} 
                      onClick={() => onDelete(u)} 
                      className={(u.username === 'BIM0100' || !isPrimaryAdmin) ? "text-slate-200" : "text-red-400"}
                    >
                      <Trash2 className="w-5 h-5" />
                     </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
          {users.length === 0 && (
            <TableRow><TableCell colSpan={5} className="text-center py-10 text-slate-400 font-bold">لا توجد حسابات مسجلة في هذه الفئة</TableCell></TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function MiniStat({ title, value, icon: Icon, color }: any) {
  return (
    <div className="bg-white p-4 rounded-[20px] border shadow-sm flex flex-col items-center gap-1">
       <Icon className={cn("w-5 h-5", color)} />
       <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{title}</p>
       <h4 className="text-xl font-black tabular-nums">{value}</h4>
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

function handleDeleteUser(user: UserProfile, isPrimaryAdmin: boolean, toast: any) {
  if (!isPrimaryAdmin) {
    toast({ variant: "destructive", title: "صلاحيات غير كافية", description: "لا يمكن للمدير المساعد حذف الحسابات." });
    return;
  }
  if (user.username === 'BIM0100') {
    toast({ variant: "destructive", title: "إجراء محظور", description: "لا يمكن حذف المدير العام الأساسي للنظام." });
    return;
  }
  toast({ title: "تم الحذف بنجاح" });
}
