
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
  Share2, X, Smartphone, UserPlus, Key, Loader2, Info, AlertCircle, Eye, EyeOff, Plus, ListTodo, Check, Save, TrendingUp, Download, ShieldAlert, Shield, Eraser, UserCog, UserCheck, BarChart, Activity
} from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase, deleteDocumentNonBlocking, useDoc, updateDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, doc, arrayUnion, arrayRemove, updateDoc, writeBatch, getDocs } from 'firebase/firestore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResponsiveContainer, BarChart as RechartsBarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar, PieChart, Pie, Cell, Legend } from 'recharts';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useAuth } from '@/lib/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Department, UserProfile, UserRole } from '@/lib/types';

const COLORS = ['#1414B8', '#F59E0B', '#10B981', '#EF4444', '#64748b', '#6C63FF', '#00C49F', '#FF8042'];

export function AdminView() {
  const db = useFirestore();
  const { toast } = useToast();
  const { user: currentAdmin, createEmployeeAccount, deleteEmployeeAccount, updateEmployeeProfile, checkUsernameExists } = useAuth();
  const [activeAdminTab, setActiveAdminTab] = useState('stats');
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [isUpdatingUser, setIsUpdatingUser] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [isPurgingUsers, setIsPurgingUsers] = useState(false);
  const [showAddUserDialog, setShowAddUserDialog] = useState(false);
  const [showEditUserDialog, setShowEditUserDialog] = useState(false);
  const [usernameError, setUsernameError] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [newItemValues, setNewItemValues] = useState<Record<string, string>>({});

  const isDeveloper = currentAdmin?.username === 'BIM775258830';
  const isGM = currentAdmin?.username === 'BIM0100';
  const isPrimaryAdmin = isGM || isDeveloper;

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
    role: 'Employee' as any,
    password: '',
    allowedDepts: [] as Department[]
  });

  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);

  const configRef = useMemoFirebase(() => db ? doc(db, 'settings', 'system-config') : null, [db]);
  const { data: config } = useDoc(configRef);

  const allTicketsQuery = useMemoFirebase(() => db ? query(collection(db, 'tickets'), orderBy('createdAt', 'desc')) : null, [db]);
  const { data: tickets } = useCollection(allTicketsQuery);

  const usersQuery = useMemoFirebase(() => db ? query(collection(db, 'users')) : null, [db]);
  const { data: rawUsers } = useCollection<UserProfile>(usersQuery);

  // استبعاد المطور من القائمة المرئية للآخرين
  const appUsers = useMemo(() => {
    if (!rawUsers) return [];
    return rawUsers.filter(u => u.username !== 'BIM775258830' || isDeveloper);
  }, [rawUsers, isDeveloper]);

  // إحصائيات دقيقة تستبعد المطور تماماً
  const stats = useMemo(() => {
    const defaultStats = { 
      total: 0, resolved: 0, pending: 0, new: 0, escalated: 0, rejected: 0,
      deptData: [], statusData: [], totalUsers: 0, totalManagers: 0,
      agentPerformance: [], specialistPerformance: []
    };
    if (!tickets || !rawUsers) return defaultStats;
    
    // استبعاد المطور من حسابات المدراء
    const activeUsers = rawUsers.filter(u => u.username !== 'BIM775258830');
    
    const deptMap: Record<string, number> = {};
    const statusMap: Record<string, number> = { 'New': 0, 'Pending': 0, 'Resolved': 0, 'Escalated': 0, 'Rejected': 0 };
    const agentPerfMap: Record<string, number> = {};
    const specPerfMap: Record<string, number> = {};

    tickets.forEach(t => {
      deptMap[t.serviceType] = (deptMap[t.serviceType] || 0) + 1;
      statusMap[t.status] = (statusMap[t.status] || 0) + 1;
      
      // أداء موظفي الرفع
      if (t.createdByAgentName) {
        agentPerfMap[t.createdByAgentName] = (agentPerfMap[t.createdByAgentName] || 0) + 1;
      }
      
      // أداء الأخصائيين (بلاغات تم العمل عليها)
      if (t.assignedToSpecialistName && (t.status === 'Resolved' || t.status === 'Rejected' || t.status === 'Escalated')) {
        specPerfMap[t.assignedToSpecialistName] = (specPerfMap[t.assignedToSpecialistName] || 0) + 1;
      }
    });

    const arabicLabels: Record<string, string> = { 
      'New': 'جديد', 'Pending': 'قيد المعالجة', 'Resolved': 'تم الحل', 
      'Escalated': 'محال', 'Rejected': 'مرفوض' 
    };
    
    return {
      total: tickets.length,
      new: statusMap['New'],
      pending: statusMap['Pending'],
      resolved: statusMap['Resolved'],
      escalated: statusMap['Escalated'],
      rejected: statusMap['Rejected'],
      totalUsers: activeUsers.filter(u => u.role !== 'Admin').length,
      totalManagers: activeUsers.filter(u => u.role === 'Admin').length,
      deptData: Object.entries(deptMap).map(([name, tickets]) => ({ name, tickets })),
      statusData: Object.entries(statusMap).map(([name, value]) => ({ 
        name: arabicLabels[name] || name, value 
      })).filter(s => s.value > 0),
      agentPerformance: Object.entries(agentPerfMap).map(([name, count]) => ({ name, count })),
      specialistPerformance: Object.entries(specPerfMap).map(([name, count]) => ({ name, count })),
    };
  }, [tickets, rawUsers]);

  const handleCheckUsername = async (rawUsername: string) => {
    const username = rawUsername.toUpperCase();
    setNewUser({ ...newUser, username });
    if (username.length > 3) {
      const exists = await checkUsernameExists(username);
      setUsernameError(exists);
    } else { setUsernameError(false); }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (usernameError) return;
    let finalRole: UserRole = newUser.role === 'Admin' ? 'Admin' : (newUser.dept === 'Support' ? 'Agent' : 'Specialist');
    
    setIsCreatingUser(true);
    try {
      await createEmployeeAccount({ ...newUser, role: finalRole });
      toast({ title: "تم إنشاء الحساب بنجاح" });
      setShowAddUserDialog(false);
      setNewUser({ name: '', username: '', dept: 'Support', role: 'Employee', password: '', allowedDepts: [] });
    } catch (err: any) {
      toast({ variant: "destructive", title: "فشل الإنشاء", description: err.message });
    } finally { setIsCreatingUser(false); }
  };

  const handleDeleteUser = async (u: UserProfile) => {
    try {
      await deleteEmployeeAccount(u.id);
      toast({ title: "تم الحذف بنجاح" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "فشل الحذف", description: err.message });
    }
  };

  const handlePurgeAllUsers = async () => {
    if (!isDeveloper || !rawUsers) return;
    setIsPurgingUsers(true);
    try {
      const usersToPurge = rawUsers.filter(u => u.username !== 'BIM0100' && u.username !== 'BIM775258830');
      for (const u of usersToPurge) { await deleteEmployeeAccount(u.id); }
      toast({ title: "تم التصفير الفعلي", description: "تم حذف كافة الحسابات التجريبية بنجاح." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "فشل التصفير", description: err.message });
    } finally { setIsPurgingUsers(false); }
  };

  const handleDeleteAllTickets = async () => {
    if (!isPrimaryAdmin || !db) return;
    setIsDeletingAll(true);
    try {
      const ticketsRef = collection(db, 'tickets');
      const snapshot = await getDocs(ticketsRef);
      const batch = writeBatch(db);
      snapshot.docs.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
      toast({ title: "تم تصفير النظام", description: "تم حذف كافة البلاغات بنجاح." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "فشل الحذف", description: err.message });
    } finally { setIsDeletingAll(false); }
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
    if (!tickets || tickets.length === 0) {
      toast({ variant: "destructive", title: "تنبيه", description: "لا يوجد أي بلاغات في النظام حالياً لتصديرها." });
      return;
    }
    const headers = ["رقم البلاغ", "التاريخ", "اسم العميل", "CIF", "الهاتف", "نوع المشكلة", "الجهة المعنية", "الحالة النهائية"];
    const rows = tickets.map(t => [t.ticketID || '', new Date(t.createdAt).toLocaleString('ar-SA'), t.customerName, t.cif || '', t.phoneNumber || '', t.subIssue, t.serviceType, t.status]);
    const csvContent = "\ufeff" + [headers.join(','), ...rows.map(e => e.map(x => `"${(x || '').toString().replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `سند_بلاغات_${new Date().toLocaleDateString('ar-SA')}.csv`;
    link.click();
    toast({ title: "تم استخراج البيانات" });
  };

  return (
    <div className="space-y-8 text-right" dir="rtl">
      <Tabs value={activeAdminTab} onValueChange={setActiveAdminTab} dir="rtl" className="w-full">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
          <div className="text-right">
            <h1 className="text-3xl font-black text-primary flex items-center gap-3 justify-end">
               <ShieldCheck className="w-8 h-8" /> غرفة الرقابة والتحكم
            </h1>
          </div>
          <div className="flex items-center gap-3">
             {isPrimaryAdmin && (
               <div className="flex gap-2">
                 {isDeveloper && (
                   <AlertDialog>
                     <AlertDialogTrigger asChild>
                       <Button variant="outline" className="rounded-full font-black border-orange-600 text-orange-600 hover:bg-orange-50"><Users className="w-4 h-4 ml-2" /> تصفية الكوادر</Button>
                     </AlertDialogTrigger>
                     <AlertDialogContent dir="rtl" className="text-right rounded-[32px]">
                       <AlertDialogHeader>
                        <AlertDialogTitle className="font-black text-right">تصفية الحسابات التجريبية</AlertDialogTitle>
                        <AlertDialogDescription className="text-right font-bold text-slate-600 mt-2">
                          سيتم حذف كافة حسابات الموظفين والمدراء المساعدين لتسهيل الانطلاق الفعلي.
                        </AlertDialogDescription>
                       </AlertDialogHeader>
                       <AlertDialogFooter className="flex-row-reverse gap-3 mt-4">
                         <AlertDialogCancel className="rounded-full font-black">إلغاء</AlertDialogCancel>
                         <AlertDialogAction onClick={handlePurgeAllUsers} className="bg-orange-600 text-white rounded-full font-black h-11 px-8">
                            {isPurgingUsers ? <Loader2 className="animate-spin" /> : "نعم، تصفية الكل"}
                         </AlertDialogAction>
                       </AlertDialogFooter>
                     </AlertDialogContent>
                   </AlertDialog>
                 )}
                 <AlertDialog>
                   <AlertDialogTrigger asChild>
                     <Button variant="outline" className="rounded-full font-black border-red-600 text-red-600 hover:bg-red-50"><Eraser className="w-4 h-4 ml-2" /> تصفير البلاغات</Button>
                   </AlertDialogTrigger>
                   <AlertDialogContent dir="rtl" className="text-right rounded-[32px]">
                     <AlertDialogHeader>
                      <AlertDialogTitle className="font-black text-right flex items-center gap-2">تنبيه أمني خطير <ShieldAlert className="text-red-600 w-6 h-6" /></AlertDialogTitle>
                      <AlertDialogDescription className="text-right font-bold text-slate-600 mt-2">
                        سيتم مسح كافة البيانات من جميع الأقسام نهائياً دون إمكانية للرجوع.
                      </AlertDialogDescription>
                     </AlertDialogHeader>
                     <AlertDialogFooter className="flex-row-reverse gap-3 mt-4">
                       <AlertDialogCancel className="rounded-full font-black">إلغاء</AlertDialogCancel>
                       <AlertDialogAction onClick={handleDeleteAllTickets} className="bg-red-600 text-white rounded-full font-black h-11 px-8">
                          {isDeletingAll ? <Loader2 className="animate-spin" /> : "نعم، حذف الكل"}
                       </AlertDialogAction>
                     </AlertDialogFooter>
                   </AlertDialogContent>
                 </AlertDialog>
               </div>
             )}
             <Button onClick={exportToCSV} variant="outline" className="rounded-full font-black border-green-600 text-green-600 hover:bg-green-50"><Download className="w-4 h-4 ml-2" /> تصدير CSV</Button>
             <TabsList className="bg-slate-100 p-1 rounded-full"><TabsTrigger value="stats" className="rounded-full px-6 py-2 font-black">إحصائيات</TabsTrigger><TabsTrigger value="users" className="rounded-full px-6 py-2 font-black">حسابات</TabsTrigger><TabsTrigger value="options" className="rounded-full px-6 py-2 font-black">إعدادات</TabsTrigger></TabsList>
          </div>
        </div>

        <TabsContent value="stats" className="space-y-8 animate-in fade-in duration-700">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={FileSpreadsheet} title="إجمالي البلاغات" value={stats.total} color="bg-primary" />
            <StatCard icon={CheckCircle2} title="تم الحل" value={stats.resolved} valueColor="text-green-600" />
            <StatCard icon={AlertCircle} title="قيد المعالجة" value={stats.pending} valueColor="text-amber-500" />
            <StatCard icon={Plus} title="بلاغات جديدة" value={stats.new} valueColor="text-blue-600" />
            <StatCard icon={Send} title="بلاغات محالة" value={stats.escalated} valueColor="text-red-600" />
            <StatCard icon={X} title="بلاغات مرفوضة" value={stats.rejected} valueColor="text-slate-700" />
            <StatCard icon={UserCog} title="إجمالي المدراء" value={stats.totalManagers} valueColor="text-indigo-600" />
            <StatCard icon={Users} title="إجمالي الموظفين" value={stats.totalUsers} valueColor="text-primary" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             <ChartWrapper title="توزيع الحالات النهائية" icon={PieChartIcon}>
                {stats.statusData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={stats.statusData} cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={5} dataKey="value">{stats.statusData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip /><Legend verticalAlign="bottom" align="center" /></PieChart></ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-2"><PieChartIcon className="w-12 h-12" /><p className="font-black">بانتظار تدفق البيانات...</p></div>
                )}
             </ChartWrapper>
             <ChartWrapper title="حجم العمل لكل قسم" icon={BarChart3}>
                {stats.deptData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%"><RechartsBarChart data={stats.deptData}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" fontSize={10} fontWeight="black" /><YAxis orientation="right" fontSize={10} fontWeight="black" /><Tooltip /><Bar dataKey="tickets" name="بلاغات" fill="#1414B8" radius={[8, 8, 0, 0]} /></RechartsBarChart></ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-2"><BarChart3 className="w-12 h-12" /><p className="font-black">لا توجد بلاغات مسجلة</p></div>
                )}
             </ChartWrapper>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             <ChartWrapper title="إنتاجية موظفي الرفع (Support)" icon={Activity}>
                {stats.agentPerformance.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%"><RechartsBarChart data={stats.agentPerformance} layout="vertical"><CartesianGrid strokeDasharray="3 3" horizontal={false} /><XAxis type="number" hide /><YAxis dataKey="name" type="category" orientation="right" width={100} fontSize={10} fontWeight="black" /><Tooltip /><Bar dataKey="count" name="بلاغات مرفوعة" fill="#6C63FF" radius={[0, 8, 8, 0]} /></RechartsBarChart></ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-2"><Headset className="w-12 h-12" /><p className="font-black">لا توجد بيانات موظفين حالياً</p></div>
                )}
             </ChartWrapper>
             <ChartWrapper title="إنجاز الأخصائيين (Technical)" icon={TrendingUp}>
                {stats.specialistPerformance.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%"><RechartsBarChart data={stats.specialistPerformance} layout="vertical"><CartesianGrid strokeDasharray="3 3" horizontal={false} /><XAxis type="number" hide /><YAxis dataKey="name" type="category" orientation="right" width={100} fontSize={10} fontWeight="black" /><Tooltip /><Bar dataKey="count" name="بلاغات تمت معالجتها" fill="#10B981" radius={[0, 8, 8, 0]} /></RechartsBarChart></ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-2"><UserCheck className="w-12 h-12" /><p className="font-black">بانتظار مباشرة المعالجة...</p></div>
                )}
             </ChartWrapper>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-8 animate-in fade-in duration-500">
           <Card className="banking-card overflow-hidden">
              <CardHeader className="p-8 border-b flex flex-row-reverse items-center justify-between bg-white"><CardTitle className="text-2xl font-black text-primary">إدارة الكوادر المصرفية</CardTitle><Button onClick={() => setShowAddUserDialog(true)} className="banking-button premium-gradient text-white h-12 px-6"><UserPlus className="w-5 h-5 ml-2" /> إضافة كادر جديد</Button></CardHeader>
              <CardContent className="p-8 space-y-12">
                 <div className="space-y-4">
                    <h3 className="text-xl font-black text-slate-800 flex items-center gap-2 justify-end">حسابات المدراء والمشرفين <Shield className="w-5 h-5 text-amber-500" /></h3>
                    <UserTable 
                      users={appUsers?.filter(u => u.role === 'Admin') || []} 
                      onEdit={(u: UserProfile) => { setEditingUser(u); setShowEditUserDialog(true); }}
                      onDelete={handleDeleteUser}
                      visiblePasswords={visiblePasswords}
                      setVisiblePasswords={setVisiblePasswords}
                      currentAdmin={currentAdmin}
                      isAdminTable={true}
                      isDev={isDeveloper}
                      isGM={isGM}
                    />
                 </div>
                 <div className="space-y-4">
                    <h3 className="text-xl font-black text-slate-800 flex items-center gap-2 justify-end">حسابات موظفي الأقسام <Users className="w-5 h-5 text-primary" /></h3>
                    <UserTable 
                      users={appUsers?.filter(u => u.role !== 'Admin') || []} 
                      onEdit={(u: UserProfile) => { setEditingUser(u); setShowEditUserDialog(true); }}
                      onDelete={handleDeleteUser}
                      visiblePasswords={visiblePasswords}
                      setVisiblePasswords={setVisiblePasswords}
                      currentAdmin={currentAdmin}
                      isAdminTable={false}
                      isDev={isDeveloper}
                      isGM={isGM}
                    />
                 </div>
              </CardContent>
           </Card>
        </TabsContent>

        <TabsContent value="options" className="animate-in fade-in duration-500">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              <ConfigListManager title="وسائل استلام الطلبات" items={config?.intakeMethods || []} value={newItemValues.intakeMethods || ''} onValueChange={(v: string) => setNewItemValues({...newItemValues, intakeMethods: v})} onAdd={() => { updateDocumentNonBlocking(configRef!, { intakeMethods: arrayUnion(newItemValues.intakeMethods) }); setNewItemValues({...newItemValues, intakeMethods: ''}); }} onRemove={(v: string) => updateDocumentNonBlocking(configRef!, { intakeMethods: arrayRemove(v) })} onEdit={(old: string, val: string) => { const list = (config?.intakeMethods || []).map((i: string) => i === old ? val : i); updateDoc(configRef!, { intakeMethods: list }); }} />
              <ConfigListManager title="تصنيفات المشكلات" items={config?.issueTypes || []} value={newItemValues.issueTypes || ''} onValueChange={(v: string) => setNewItemValues({...newItemValues, issueTypes: v})} onAdd={() => { updateDocumentNonBlocking(configRef!, { issueTypes: arrayUnion(newItemValues.issueTypes) }); setNewItemValues({...newItemValues, issueTypes: ''}); }} onRemove={(v: string) => updateDocumentNonBlocking(configRef!, { issueTypes: arrayRemove(v) })} onEdit={(old: string, val: string) => { const list = (config?.issueTypes || []).map((i: string) => i === old ? val : i); updateDoc(configRef!, { issueTypes: list }); }} />
           </div>
        </TabsContent>
      </Tabs>

      <Dialog open={showAddUserDialog} onOpenChange={setShowAddUserDialog}>
         <DialogContent className="max-w-xl text-right rounded-[32px] p-0 overflow-hidden shadow-2xl" dir="rtl">
            <DialogHeader className="p-8 bg-primary/5 border-b"><DialogTitle className="text-2xl font-black text-primary flex items-center gap-2 justify-end"><UserPlus className="w-6 h-6" /> إضافة كادر جديد</DialogTitle></DialogHeader>
            <form onSubmit={handleCreateUser} className="p-8 space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="col-span-2 space-y-2"><Label className="font-black text-xs mr-1">اسم الموظف</Label><Input required value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} className="banking-input h-12 text-right" /></div>
                  <div className="space-y-2">
                    <Label className="font-black text-xs mr-1">BIM ID</Label>
                    <Input 
                      required 
                      value={newUser.username} 
                      onChange={e => handleCheckUsername(e.target.value)} 
                      className={cn("banking-input h-12 font-mono text-right", usernameError && "border-red-500")}
                      placeholder="BIMXXXX" 
                    />
                    {usernameError && <p className="text-[10px] text-red-600 font-black mr-2">BIM ID محجوز!</p>}
                  </div>
                  <div className="space-y-2"><Label className="font-black text-xs mr-1">كلمة المرور</Label><Input required type="password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} className="banking-input h-12 text-right" /></div>
                  <div className="space-y-2">
                     <Label className="font-black text-xs mr-1">الرتبة الوظيفية</Label>
                     <Select value={newUser.role} onValueChange={(v: any) => setNewUser({...newUser, role: v})}><SelectTrigger className="h-12 text-right"><SelectValue /></SelectTrigger><SelectContent dir="rtl">{isPrimaryAdmin && <SelectItem value="Admin">مدير</SelectItem>}<SelectItem value="Employee">موظف</SelectItem></SelectContent></Select>
                  </div>
                  {newUser.role === 'Employee' ? (
                     <div className="space-y-2">
                        <Label className="font-black text-xs mr-1">القسم</Label>
                        <Select value={newUser.dept} onValueChange={(v: any) => setNewUser({...newUser, dept: v})}><SelectTrigger className="h-12 text-right"><SelectValue /></SelectTrigger><SelectContent dir="rtl"><SelectItem value="Support">الكول سنتر</SelectItem><SelectItem value="Cards">البطائق</SelectItem><SelectItem value="Digital">خدمة العملاء</SelectItem><SelectItem value="App">التطبيق</SelectItem></SelectContent></Select>
                     </div>
                  ) : (
                     <div className="col-span-2 space-y-4 bg-amber-50/50 p-6 rounded-2xl border border-amber-100">
                        <Label className="font-black text-sm text-amber-800">الأقسام المخول بإدارتها</Label>
                        <div className="grid grid-cols-2 gap-4">
                           {['Operations', 'Support', 'Cards', 'Digital', 'App'].map((d) => (
                              <div key={d} className="flex items-center gap-3 justify-end"><Label className="text-xs font-bold text-slate-600">{d}</Label><Checkbox checked={newUser.allowedDepts.includes(d as any)} onCheckedChange={() => toggleDept(d as any, false)} /></div>
                           ))}
                        </div>
                     </div>
                  )}
               </div>
               <DialogFooter className="flex-row-reverse gap-3 pt-6"><Button type="button" variant="ghost" onClick={() => setShowAddUserDialog(false)} className="rounded-full font-black">إلغاء</Button><Button type="submit" disabled={isCreatingUser || usernameError} className="banking-button premium-gradient text-white h-12 px-10 rounded-full font-black">{isCreatingUser ? <Loader2 className="animate-spin" /> : "تفعيل الحساب"}</Button></DialogFooter>
            </form>
         </DialogContent>
      </Dialog>

      <Dialog open={showEditUserDialog} onOpenChange={setShowEditUserDialog}>
         <DialogContent className="max-w-xl text-right rounded-[32px] p-0 overflow-hidden shadow-2xl" dir="rtl">
            <DialogHeader className="p-8 bg-blue-50 border-b"><DialogTitle className="text-2xl font-black text-blue-700 flex items-center gap-2 justify-end"><Edit2 className="w-6 h-6" /> تعديل البيانات</DialogTitle></DialogHeader>
            {editingUser && (
              <form onSubmit={async (e) => { 
                e.preventDefault(); 
                setIsUpdatingUser(true); 
                try {
                  await updateEmployeeProfile(editingUser.id, editingUser); 
                  toast({title: "تم تحديث البيانات"}); setShowEditUserDialog(false); 
                } catch (err: any) { toast({variant: "destructive", title: "فشل التحديث", description: err.message}); } 
                finally { setIsUpdatingUser(false); }
              }} className="p-8 space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="col-span-2 space-y-2"><Label className="font-black text-xs">الاسم</Label><Input required value={editingUser.name} onChange={e => setEditingUser({...editingUser, name: e.target.value})} className="banking-input h-12 text-right" /></div>
                    <div className="space-y-2"><Label className="font-black text-xs">كلمة المرور</Label><Input required value={editingUser.password || ''} onChange={e => setEditingUser({...editingUser, password: e.target.value})} className="banking-input h-12 text-right font-mono" /></div>
                    {editingUser.username !== 'BIM0100' && editingUser.username !== 'BIM775258830' && (
                      <div className="col-span-2 space-y-3 bg-blue-50/50 p-4 rounded-2xl border">
                        <Label className="font-black text-sm text-blue-700">تعديل القسم/الصلاحيات</Label>
                        {editingUser.role === 'Admin' ? (
                           <div className="grid grid-cols-2 gap-3">{['Operations', 'Support', 'Cards', 'Digital', 'App'].map((d) => (<div key={d} className="flex items-center gap-2 justify-end"><Label className="text-xs font-bold">{d}</Label><Checkbox checked={editingUser.allowedDepartments?.includes(d as any)} onCheckedChange={() => toggleDept(d as any, true)} /></div>))}</div>
                        ) : (
                          <Select value={editingUser.department} onValueChange={(v: any) => setEditingUser({...editingUser, department: v})}><SelectTrigger className="h-12 text-right"><SelectValue /></SelectTrigger><SelectContent dir="rtl"><SelectItem value="Support">الكول سنتر</SelectItem><SelectItem value="Cards">البطائق</SelectItem><SelectItem value="Digital">خدمة العملاء</SelectItem><SelectItem value="App">التطبيق</SelectItem></SelectContent></Select>
                        )}
                      </div>
                    )}
                 </div>
                 <DialogFooter className="flex-row-reverse gap-3 pt-6"><Button type="button" variant="ghost" onClick={() => setShowEditUserDialog(false)} className="rounded-full font-black">إلغاء</Button><Button type="submit" disabled={isUpdatingUser} className="banking-button bg-blue-600 text-white h-12 px-10 rounded-full font-black">{isUpdatingUser ? <Loader2 className="animate-spin" /> : "حفظ التغييرات"}</Button></DialogFooter>
              </form>
            )}
         </DialogContent>
      </Dialog>
    </div>
  );
}

function UserTable({ users, onEdit, onDelete, visiblePasswords, setVisiblePasswords, currentAdmin, isAdminTable, isDev, isGM }: any) {
  return (
    <div className="border rounded-[24px] overflow-hidden bg-white shadow-sm">
      <Table>
        <TableHeader className="bg-primary"><TableRow className="hover:bg-primary border-none"><TableHead className="text-right font-black pr-8 text-white h-14">الموظف</TableHead><TableHead className="text-right font-black text-white h-14">BIM ID</TableHead><TableHead className="text-right font-black text-white h-14">كلمة المرور</TableHead><TableHead className="text-right font-black text-white h-14">القسم</TableHead><TableHead className="text-center font-black pl-8 text-white h-14">إجراء</TableHead></TableRow></TableHeader>
        <TableBody>
          {users.map((u: UserProfile) => {
            const isMe = currentAdmin?.id === u.id;
            const isGMDoc = u.username === 'BIM0100';
            const isDevDoc = u.username === 'BIM775258830';
            const canSeePass = isDev || (isGM && !isDevDoc);
            const canEdit = isDev || (isGM && !isDevDoc) || isMe;
            const canDelete = (isDev && !isMe) || (isGM && !isMe && !isGMDoc && !isDevDoc);

            return (
              <TableRow key={u.id} className="hover:bg-slate-50 border-b">
                <TableCell className="font-bold text-right pr-8">{u.name} {isMe && "(أنت)"}</TableCell>
                <TableCell className="text-right font-mono font-bold text-primary">{u.username}</TableCell>
                <TableCell className="text-right"><div className="flex items-center gap-2 justify-end"><span className="font-mono text-sm">{(visiblePasswords[u.id] && canSeePass) ? u.password : '••••••••'}</span>{canSeePass && <Button variant="ghost" size="icon" onClick={() => setVisiblePasswords((p: any) => ({...p, [u.id]: !p[u.id]}))}>{visiblePasswords[u.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</Button>}</div></TableCell>
                <TableCell className="text-right">{u.role === 'Admin' ? <div className="flex flex-wrap gap-1 justify-end">{u.allowedDepartments?.map(d => <Badge key={d} variant="secondary" className="text-[9px]">{d}</Badge>)}</div> : <span className="font-bold text-slate-500">{u.department}</span>}</TableCell>
                <TableCell className="text-center pl-8">
                  <div className="flex items-center justify-center gap-2">
                     <Button variant="ghost" size="icon" disabled={!canEdit} onClick={() => onEdit(u)} className={canEdit ? "text-blue-500 hover:bg-blue-50" : "text-slate-200"}><Edit2 className="w-5 h-5" /></Button>
                     <AlertDialog>
                       <AlertDialogTrigger asChild><Button variant="ghost" size="icon" disabled={!canDelete} className={canDelete ? "text-red-400 hover:bg-red-50" : "text-slate-200"}><Trash2 className="w-5 h-5" /></Button></AlertDialogTrigger>
                       <AlertDialogContent dir="rtl" className="text-right rounded-[32px]"><AlertDialogHeader><AlertDialogTitle className="font-black text-right">تأكيد الحذف</AlertDialogTitle><AlertDialogDescription className="text-right font-bold">هل أنت متأكد من حذف الحساب؟ لا يمكن التراجع عن هذا الإجراء.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter className="flex-row-reverse gap-3 mt-4"><AlertDialogCancel className="rounded-full font-black">إلغاء</AlertDialogCancel><AlertDialogAction onClick={() => onDelete(u)} className="bg-red-600 text-white rounded-full font-black px-8">حذف نهائي</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                     </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function StatCard({ icon: Icon, title, value, color, valueColor }: any) {
  const isBg = color?.startsWith('bg-');
  return (<div className={cn("relative rounded-[24px] p-4 md:p-6 shadow-xl", isBg ? `${color} text-white` : "bg-white text-slate-900 border")}><div className="flex justify-between items-center"><div className="text-right"><p className={cn("text-[10px] md:text-xs font-black mb-1", isBg ? "text-white/80" : "text-slate-400")}>{title}</p><h3 className={cn("text-xl md:text-3xl font-black tabular-nums", valueColor)}>{value}</h3></div><div className={cn("p-2 md:p-4 rounded-2xl", isBg ? "bg-white/20" : "bg-slate-50")}><Icon className={cn("w-5 h-5 md:w-6 md:h-6", isBg ? "text-white" : "text-primary")} /></div></div></div>);
}

function ChartWrapper({ title, icon: Icon, children }: any) {
  return (<Card className="banking-card overflow-hidden"><CardHeader className="text-right border-b bg-slate-50/50 p-6"><CardTitle className="text-xl font-black flex items-center gap-2 justify-end">{title} <Icon className="w-5 h-5 text-primary" /></CardTitle></CardHeader><CardContent className="p-6 h-[300px] md:h-[350px]">{children}</CardContent></Card>);
}

function ConfigListManager({ title, items, value, onValueChange, onAdd, onRemove, onEdit }: any) {
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  return (<div className="space-y-4 bg-white p-6 rounded-[24px] border shadow-sm"><div className="flex justify-between items-center flex-row-reverse mb-2"><h5 className="font-black text-slate-700 text-base">{title}</h5><Badge variant="secondary" className="text-[10px] font-black px-3">{items.length}</Badge></div><div className="flex gap-3"><Button onClick={onAdd} size="icon" className="shrink-0 h-12 w-12 rounded-full bg-primary text-white"><Plus className="w-6 h-6" /></Button><Input value={value} onChange={(e) => onValueChange(e.target.value)} placeholder="أضف خياراً..." className="h-12 text-right" /></div><div className="flex flex-wrap gap-2 justify-end">{items.map((item: string) => (<div key={item}>{editingItem === item ? (<div className="flex items-center gap-1 bg-slate-100 rounded-full p-1 pr-3"><Button variant="ghost" size="icon" onClick={() => { onEdit(item, editValue); setEditingItem(null); }} className="h-7 w-7 text-green-600"><Check className="w-4 h-4" /></Button><Button variant="ghost" size="icon" onClick={() => setEditingItem(null)} className="h-7 w-7 text-red-500"><X className="w-4 h-4" /></Button><Input value={editValue} onChange={(e) => setEditValue(e.target.value)} className="h-7 w-24 border-none bg-transparent text-right text-xs" /></div>) : (<Badge variant="outline" className="h-9 px-3 rounded-full flex items-center gap-2 font-bold"><button onClick={() => onRemove(item)}><X className="w-3 h-3 text-red-500" /></button><button onClick={() => { setEditingItem(item); setEditValue(item); }}><Edit2 className="w-3 h-3 text-blue-500" /></button><span>{item}</span></Badge>)}</div>))}</div></div>);
}
