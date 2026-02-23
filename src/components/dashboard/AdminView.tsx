
"use client"

import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users, AlertTriangle, Clock, FileSpreadsheet, Plus, ShieldCheck, Trash2, CheckCircle2, 
  Edit2, Save, BarChart3, PieChart as PieChartIcon, MonitorSmartphone, CreditCard, Headset,
  Share2, MessageSquare, X, Smartphone, UserPlus, Key, Loader2
} from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase, setDocumentNonBlocking, useDoc, deleteDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar, PieChart, Pie, Cell, Legend } from 'recharts';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useAuth } from '@/lib/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { UserRole, Department } from '@/lib/types';

const COLORS = ['#1414B8', '#2A3BFF', '#6C63FF', '#10B981', '#F59E0B', '#EF4444'];

export function AdminView() {
  const db = useFirestore();
  const { toast } = useToast();
  const { createEmployeeAccount, updateAdminPassword } = useAuth();
  const [activeAdminTab, setActiveAdminTab] = useState('stats');
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [showAddUserDialog, setShowAddUserDialog] = useState(false);
  const [showChangePassDialog, setShowChangePassDialog] = useState(false);
  const [newPass, setNewPass] = useState('');
  
  const [newUser, setNewUser] = useState({
    name: '',
    username: '',
    role: 'Specialist' as UserRole,
    dept: 'Cards' as Department,
    password: ''
  });

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

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingUser(true);
    try {
      await createEmployeeAccount(newUser);
      toast({ title: "تم إنشاء الحساب", description: `الموظف ${newUser.name} يمكنه الدخول الآن.` });
      setShowAddUserDialog(false);
      setNewUser({ name: '', username: '', role: 'Specialist', dept: 'Cards', password: '' });
    } catch (err: any) {
      toast({ variant: "destructive", title: "فشل الإنشاء", description: err.message || "تأكد من عدم تكرار اسم المستخدم" });
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleChangeAdminPass = async () => {
    if (newPass.length < 6) {
      toast({ variant: "destructive", title: "تنبيه", description: "كلمة السر يجب أن تكون 6 خانات على الأقل" });
      return;
    }
    try {
      await updateAdminPassword(newPass);
      toast({ title: "تم تحديث كلمة السر", description: "يرجى استخدام كلمة السر الجديدة في المرة القادمة." });
      setShowChangePassDialog(false);
      setNewPass('');
    } catch (err) {
      toast({ variant: "destructive", title: "خطأ", description: "فشل تحديث كلمة السر." });
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
            <p className="text-slate-500 font-bold mt-1">إدارة الكوادر، الهوية المصرفية، وصلاحيات النظام</p>
          </div>
          <div className="flex items-center gap-3">
             <Button onClick={() => setShowChangePassDialog(true)} variant="outline" className="rounded-full font-black border-primary text-primary">
                <Key className="w-4 h-4 ml-2" /> تغيير كلمة السر
             </Button>
             <TabsList className="bg-slate-100 p-1 rounded-full h-auto no-scrollbar overflow-x-auto">
               <TabsTrigger value="stats" className="rounded-full px-6 py-2 font-black data-[state=active]:bg-primary data-[state=active]:text-white">الإحصائيات</TabsTrigger>
               <TabsTrigger value="staff" className="rounded-full px-6 py-2 font-black data-[state=active]:bg-primary data-[state=active]:text-white">إدارة الكادر</TabsTrigger>
               <TabsTrigger value="users" className="rounded-full px-6 py-2 font-black data-[state=active]:bg-primary data-[state=active]:text-white">حسابات النظام</TabsTrigger>
             </TabsList>
          </div>
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
           <div className="flex justify-end">
              <Button onClick={() => setShowAddUserDialog(true)} className="banking-button premium-gradient text-white h-14 px-8 shadow-xl">
                 <UserPlus className="w-5 h-5 ml-2" /> إضافة موظف جديد للنظام
              </Button>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="banking-card p-6 border-none shadow-md text-center space-y-4">
                 <CreditCard className="w-10 h-10 text-primary mx-auto" />
                 <h3 className="font-black">قسم البطائق</h3>
                 <p className="text-xs text-slate-500">أخصائيي معالجة بطائق الصراف والائتمان</p>
              </Card>
              <Card className="banking-card p-6 border-none shadow-md text-center space-y-4">
                 <MonitorSmartphone className="w-10 h-10 text-primary mx-auto" />
                 <h3 className="font-black">خدمة العملاء</h3>
                 <p className="text-xs text-slate-500">أخصائيي القنوات الرقمية والخدمات المباشرة</p>
              </Card>
              <Card className="banking-card p-6 border-none shadow-md text-center space-y-4">
                 <Smartphone className="w-10 h-10 text-primary mx-auto" />
                 <h3 className="font-black">مشاكل التطبيق</h3>
                 <p className="text-xs text-slate-500">الدعم الفني المباشر لمشاكل تطبيق بنك سند</p>
              </Card>
              <Card className="banking-card p-6 border-none shadow-md text-center space-y-4">
                 <Headset className="w-10 h-10 text-primary mx-auto" />
                 <h3 className="font-black">الكول سنتر</h3>
                 <p className="text-xs text-slate-500">موظفي استلام ورفع البلاغات من العملاء</p>
              </Card>
           </div>
        </TabsContent>

        <TabsContent value="users" className="animate-in fade-in duration-500 mt-0">
           <Card className="banking-card border-none shadow-xl overflow-hidden">
              <CardHeader className="p-8 border-b flex flex-row-reverse items-center justify-between">
                 <CardTitle className="text-2xl font-black text-primary">حسابات الهوية المصرفية المسجلة</CardTitle>
                 <Badge variant="outline" className="font-black h-8 px-4">{appUsers?.length} مستخدم</Badge>
              </CardHeader>
              <CardContent className="p-0">
                 <Table>
                    <TableHeader className="bg-primary">
                       <TableRow className="hover:bg-primary border-none">
                          <TableHead className="text-right font-black text-white h-14 pr-8">الاسم الكامل</TableHead>
                          <TableHead className="text-right font-black text-white h-14">BIM ID (اسم المستخدم)</TableHead>
                          <TableHead className="text-right font-black text-white h-14">الدور</TableHead>
                          <TableHead className="text-right font-black text-white h-14 pl-8">القسم المعين</TableHead>
                       </TableRow>
                    </TableHeader>
                    <TableBody>
                       {appUsers?.map((u, idx) => (
                          <TableRow key={u.id} className={`border-b ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                             <TableCell className="font-bold text-right pr-8">{u.name}</TableCell>
                             <TableCell className="text-right font-mono font-bold text-primary">{u.username || 'N/A'}</TableCell>
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

      {/* نافذة إضافة موظف */}
      <Dialog open={showAddUserDialog} onOpenChange={setShowAddUserDialog}>
         <DialogContent className="max-w-xl text-right rounded-[32px] p-0 overflow-hidden shadow-2xl" dir="rtl">
            <DialogHeader className="p-8 bg-primary/5 border-b">
               <DialogTitle className="text-2xl font-black text-primary flex items-center gap-2 justify-end">
                  <UserPlus className="w-6 h-6" /> إضافة موظف جديد
               </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateUser} className="p-8 space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                     <Label className="font-black text-xs mr-1">الاسم الكامل</Label>
                     <Input required value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} className="banking-input h-12 text-right" placeholder="اسم الموظف الثلاثي" />
                  </div>
                  <div className="space-y-2">
                     <Label className="font-black text-xs mr-1">اسم المستخدم (BIM ID)</Label>
                     <Input required value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} className="banking-input h-12 font-mono text-right" placeholder="BIM0101" />
                  </div>
                  <div className="space-y-2">
                     <Label className="font-black text-xs mr-1">الدور الوظيفي</Label>
                     <Select value={newUser.role} onValueChange={(v: any) => setNewUser({...newUser, role: v})}>
                        <SelectTrigger className="banking-input h-12 text-right"><SelectValue /></SelectTrigger>
                        <SelectContent dir="rtl">
                           <SelectItem value="Agent">موظف رفع (Agent)</SelectItem>
                           <SelectItem value="Specialist">أخصائي معالجة (Specialist)</SelectItem>
                        </SelectContent>
                     </Select>
                  </div>
                  <div className="space-y-2">
                     <Label className="font-black text-xs mr-1">القسم المعين</Label>
                     <Select value={newUser.dept} onValueChange={(v: any) => setNewUser({...newUser, dept: v})}>
                        <SelectTrigger className="banking-input h-12 text-right"><SelectValue /></SelectTrigger>
                        <SelectContent dir="rtl">
                           <SelectItem value="Support">الكول سنتر</SelectItem>
                           <SelectItem value="Cards">إدارة البطائق</SelectItem>
                           <SelectItem value="Digital">خدمة العملاء</SelectItem>
                           <SelectItem value="App">مشاكل التطبيق</SelectItem>
                        </SelectContent>
                     </Select>
                  </div>
                  <div className="col-span-1 md:col-span-2 space-y-2">
                     <Label className="font-black text-xs mr-1">كلمة المرور المؤقتة</Label>
                     <Input required type="password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} className="banking-input h-12 text-right" placeholder="••••••••" />
                  </div>
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

      {/* نافذة تغيير كلمة سر المدير */}
      <Dialog open={showChangePassDialog} onOpenChange={setShowChangePassDialog}>
         <DialogContent className="max-w-md text-right rounded-[32px] p-0 overflow-hidden shadow-2xl" dir="rtl">
            <DialogHeader className="p-8 bg-primary/5 border-b">
               <DialogTitle className="text-2xl font-black text-primary flex items-center gap-2 justify-end">
                  <Key className="w-6 h-6" /> تحديث كلمة سر الإدارة
               </DialogTitle>
            </DialogHeader>
            <div className="p-8 space-y-6">
               <div className="space-y-3">
                  <Label className="font-black text-sm mr-1">كلمة السر الجديدة</Label>
                  <Input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} className="banking-input h-14 text-right" placeholder="••••••••" />
                  <p className="text-[10px] text-slate-400 font-bold">يرجى اختيار كلمة سر قوية لضمان أمن النظام</p>
               </div>
               <div className="pt-4 flex flex-col gap-3">
                  <Button onClick={handleChangeAdminPass} className="banking-button premium-gradient text-white h-14 rounded-full font-black shadow-xl">
                     تحديث كلمة السر الآن
                  </Button>
                  <Button variant="ghost" onClick={() => setShowChangePassDialog(false)} className="rounded-full font-black">إلغاء</Button>
               </div>
            </div>
         </DialogContent>
      </Dialog>
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
