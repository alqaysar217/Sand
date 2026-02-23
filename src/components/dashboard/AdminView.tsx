
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
  Share2, MessageSquare, X, Smartphone, UserPlus, Key, Loader2, Info, AlertCircle
} from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase, setDocumentNonBlocking, useDoc, deleteDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar, PieChart, Pie, Cell, Legend } from 'recharts';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useAuth } from '@/lib/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Department } from '@/lib/types';

const COLORS = ['#1414B8', '#2A3BFF', '#6C63FF', '#10B981', '#F59E0B', '#EF4444'];

export function AdminView() {
  const db = useFirestore();
  const { toast } = useToast();
  const { createEmployeeAccount, updateAdminPassword, checkUsernameExists } = useAuth();
  const [activeAdminTab, setActiveAdminTab] = useState('stats');
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [showAddUserDialog, setShowAddUserDialog] = useState(false);
  const [showChangePassDialog, setShowChangePassDialog] = useState(false);
  const [newPass, setNewPass] = useState('');
  
  const [newUser, setNewUser] = useState({
    name: '',
    username: '',
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

  // فحص توفر اسم المستخدم فور الكتابة
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (newUser.username.length >= 4) {
        setIsCheckingUsername(true);
        const exists = await checkUsernameExists(newUser.username);
        if (exists) {
          setUsernameError('اسم المستخدم هذا محجوز بالفعل');
        } else {
          setUsernameError('');
        }
        setIsCheckingUsername(false);
      } else {
        setUsernameError('');
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [newUser.username, checkUsernameExists]);

  const allTicketsQuery = useMemoFirebase(() => db ? query(collection(db, 'tickets'), orderBy('createdAt', 'desc')) : null, [db]);
  const { data: tickets } = useCollection(allTicketsQuery);

  const usersQuery = useMemoFirebase(() => db ? query(collection(db, 'users'), orderBy('createdAt', 'desc')) : null, [db]);
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
    if (usernameError) return;
    setIsCreatingUser(true);
    try {
      await createEmployeeAccount(newUser);
      toast({ title: "تم إنشاء الحساب بنجاح", description: `الموظف ${newUser.name} (BIM ID: ${newUser.username}) جاهز للعمل.` });
      setShowAddUserDialog(false);
      setNewUser({ name: '', username: '', dept: 'Cards', password: '' });
    } catch (err: any) {
      toast({ variant: "destructive", title: "فشل الإنشاء", description: err.message });
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
               <TabsTrigger value="stats" className="rounded-full px-6 py-2 font-black data-[state=active]:bg-primary data-[state=active]:text-white transition-all">الإحصائيات</TabsTrigger>
               <TabsTrigger value="staff" className="rounded-full px-6 py-2 font-black data-[state=active]:bg-primary data-[state=active]:text-white transition-all">إدارة الكادر</TabsTrigger>
               <TabsTrigger value="users" className="rounded-full px-6 py-2 font-black data-[state=active]:bg-primary data-[state=active]:text-white transition-all">حسابات النظام</TabsTrigger>
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
           <div className="flex justify-between items-center flex-row-reverse">
              <Button onClick={() => setShowAddUserDialog(true)} className="banking-button premium-gradient text-white h-14 px-8 shadow-xl">
                 <UserPlus className="w-5 h-5 ml-2" /> إضافة موظف جديد للنظام
              </Button>
              <div className="flex items-center gap-2 text-slate-400 font-bold bg-white px-6 py-3 rounded-full border">
                 <Info className="w-4 h-4 text-primary" />
                 <span>يمكن للمدير تحديد BIM ID المخصص وكلمة المرور لكل موظف</span>
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
                          <TableHead className="text-right font-black text-white h-14">BIM ID (اسم المستخدم)</TableHead>
                          <TableHead className="text-right font-black text-white h-14">الدور الوظيفي</TableHead>
                          <TableHead className="text-right font-black text-white h-14">القسم</TableHead>
                          <TableHead className="text-center font-black text-white h-14 pl-8">الإجراء</TableHead>
                       </TableRow>
                    </TableHeader>
                    <TableBody>
                       {appUsers?.map((u, idx) => (
                          <TableRow key={u.id} className={`border-b transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                             <TableCell className="font-bold text-right pr-8">{u.name}</TableCell>
                             <TableCell className="text-right font-mono font-bold text-primary">{u.username || 'N/A'}</TableCell>
                             <TableCell className="text-right">
                                <Badge className={`rounded-full px-4 font-black ${
                                   u.role === 'Admin' ? 'bg-red-500' : u.role === 'Specialist' ? 'bg-primary' : 'bg-secondary'
                                }`}>
                                   {u.role === 'Admin' ? 'مدير نظام' : u.role === 'Specialist' ? 'أخصائي معالجة' : 'موظف رفع'}
                                </Badge>
                             </TableCell>
                             <TableCell className="text-right font-bold text-slate-500">{u.department}</TableCell>
                             <TableCell className="text-center pl-8">
                                <Button variant="ghost" size="icon" className="text-red-400 hover:text-red-600 rounded-full h-10 w-10">
                                   <Trash2 className="w-5 h-5" />
                                </Button>
                             </TableCell>
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
                  <div className="space-y-2 col-span-2">
                     <Label className="font-black text-xs mr-1">الاسم الكامل للموظف</Label>
                     <Input required value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} className="banking-input h-12 text-right" placeholder="الاسم الثلاثي المعتمد" />
                  </div>
                  <div className="space-y-2">
                     <Label className="font-black text-xs mr-1">اسم المستخدم (BIM ID)</Label>
                     <div className="relative">
                        <Input 
                          required 
                          value={newUser.username} 
                          onChange={e => setNewUser({...newUser, username: e.target.value})} 
                          className={cn(
                            "banking-input h-12 font-mono text-right transition-all",
                            usernameError ? "border-red-500 focus:ring-red-200" : "border-slate-200"
                          )} 
                          placeholder="BIM0101" 
                        />
                        {isCheckingUsername && <Loader2 className="absolute left-3 top-3.5 w-5 h-5 animate-spin text-primary" />}
                     </div>
                     {usernameError && <p className="text-[10px] text-red-500 font-bold mr-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {usernameError}</p>}
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
                  <div className="col-span-1 md:col-span-2 space-y-2">
                     <Label className="font-black text-xs mr-1">كلمة المرور الافتتاحية</Label>
                     <Input required type="password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} className="banking-input h-12 text-right" placeholder="••••••••" />
                     <p className="text-[10px] text-slate-400 font-bold mr-1">سيتمكن الموظف من استخدام هذه الكلمة للدخول لقسمه المخصص فقط.</p>
                  </div>
               </div>
               <DialogFooter className="flex-row-reverse gap-3 pt-6">
                  <Button type="button" variant="ghost" onClick={() => setShowAddUserDialog(false)} className="rounded-full font-black px-8 h-12">إلغاء</Button>
                  <Button type="submit" disabled={isCreatingUser || !!usernameError} className="banking-button premium-gradient text-white h-12 px-10 rounded-full font-black shadow-lg">
                     {isCreatingUser ? <Loader2 className="animate-spin" /> : "إنشاء الحساب وتفعيله"}
                  </Button>
               </DialogFooter>
            </form>
         </DialogContent>
      </Dialog>

      {/* نافذة تغيير كلمة سر المدير */}
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
      "relative rounded-[24px] p-6 shadow-xl overflow-hidden",
      isBgColor ? `${color} text-white` : "bg-white text-slate-900 border border-slate-100"
    )}>
      <div className="flex justify-between items-center relative z-20">
        <div className="text-right">
          <p className={cn(
            "text-xs font-black mb-1",
            isBgColor ? "text-white/80" : "text-slate-500"
          )}>{title}</p>
          <h3 className="text-3xl font-black tabular-nums">{value}</h3>
        </div>
        <div className={cn(
          "p-4 rounded-2xl flex items-center justify-center",
          isBgColor ? "bg-white/20" : "bg-slate-50"
        )}>
          <Icon className={cn("w-6 h-6", isBgColor ? "text-white" : color)} />
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
