
"use client"

import { useAuth } from '@/lib/contexts/AuthContext';
import { AgentView } from '@/components/dashboard/AgentView';
import { SpecialistView } from '@/components/dashboard/SpecialistView';
import { AdminView } from '@/components/dashboard/AdminView';
import { ShieldAlert, UserCog, Headset, CreditCard, MonitorSmartphone, Terminal } from "lucide-react";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useState, useEffect } from 'react';
import { UserRole, Department } from '@/lib/types';

export default function DashboardPage() {
  const { user } = useAuth();
  
  // نظام تجاوز الدخول (Mock User) لتعطيل قيود Firebase كلياً
  const [mockUser, setMockUser] = useState<{role: UserRole, department: Department, name: string} | null>(null);

  // إذا كان هناك مستخدم حقيقي مسجل، نستخدمه، وإلا نستخدم المستخدم التجريبي المختار
  const activeUser = user || mockUser;

  // عند اختيار مستخدم تجريبي، نقوم بحفظه في الـ Local Storage لضمان استقرار الجلسة أثناء التطوير
  useEffect(() => {
    const saved = localStorage.getItem('debug_user');
    if (saved && !user) {
      setMockUser(JSON.parse(saved));
    }
  }, [user]);

  const selectMockUser = (role: UserRole, department: Department, name: string) => {
    const newUser = { role, department, name };
    setMockUser(newUser);
    localStorage.setItem('debug_user', JSON.stringify(newUser));
  };

  const resetBypass = () => {
    setMockUser(null);
    localStorage.removeItem('debug_user');
  };

  // إذا لم يجد النظام مستخدماً، يظهر "بوابة عبور المطور" لاختيار الواجهة يدوياً
  if (!activeUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 animate-in fade-in duration-700">
        <Card className="banking-card max-w-2xl w-full border-none shadow-2xl overflow-hidden">
          <CardHeader className="premium-gradient text-white p-10 text-center relative">
            <div className="absolute top-4 right-4 opacity-20"><Terminal className="h-12 w-12" /></div>
            <div className="flex justify-center mb-4">
              <ShieldAlert className="h-16 w-16 opacity-80" />
            </div>
            <CardTitle className="text-3xl font-black">بوابة عبور المطور</CardTitle>
            <CardDescription className="text-white/70 font-bold mt-2">
              نظام الحماية وقواعد البيانات (Firestore Rules) مفتوحة الآن. اختر الواجهة التي تود إكمال بنائها.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button 
                variant="outline" 
                className="h-28 flex flex-col gap-2 rounded-[24px] border-slate-100 hover:border-red-600 hover:bg-red-50 transition-all group"
                onClick={() => selectMockUser('Admin', 'Operations', 'المدير العام (تجريبي)')}
              >
                <UserCog className="h-8 w-8 text-red-600 group-hover:scale-110 transition-transform" />
                <span className="font-black text-slate-800">واجهة المدير العام</span>
                <span className="text-[10px] text-slate-400 font-bold">إحصائيات وإدارة كاملة</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-28 flex flex-col gap-2 rounded-[24px] border-slate-100 hover:border-primary hover:bg-primary/5 transition-all group"
                onClick={() => selectMockUser('Specialist', 'Cards', 'أخصائي البطائق (تجريبي)')}
              >
                <CreditCard className="h-8 w-8 text-primary group-hover:scale-110 transition-transform" />
                <span className="font-black text-slate-800">واجهة أخصائي البطائق</span>
                <span className="text-[10px] text-slate-400 font-bold">معالجة البلاغات الفنية</span>
              </Button>

              <Button 
                variant="outline" 
                className="h-28 flex flex-col gap-2 rounded-[24px] border-slate-100 hover:border-secondary hover:bg-secondary/5 transition-all group"
                onClick={() => selectMockUser('Agent', 'Support', 'موظف الكول سنتر (تجريبي)')}
              >
                <Headset className="h-8 w-8 text-secondary group-hover:scale-110 transition-transform" />
                <span className="font-black text-slate-800">واجهة الكول سنتر</span>
                <span className="text-[10px] text-slate-400 font-bold">استلام البلاغات الهاتفية</span>
              </Button>

              <Button 
                variant="outline" 
                className="h-28 flex flex-col gap-2 rounded-[24px] border-slate-100 hover:border-accent hover:bg-accent/5 transition-all group"
                onClick={() => selectMockUser('Agent', 'Digital', 'موظف الخدمات الرقمية (تجريبي)')}
              >
                <MonitorSmartphone className="h-8 w-8 text-accent group-hover:scale-110 transition-transform" />
                <span className="font-black text-slate-800">واجهة الخدمات الرقمية</span>
                <span className="text-[10px] text-slate-400 font-bold">بلاغات التطبيق والموقع</span>
              </Button>
            </div>
            
            <p className="text-center mt-8 text-xs font-bold text-slate-400 uppercase tracking-widest">
              تم تعطيل نظام التحقق من الهوية لتمكينك من إكمال بناء النظام بنجاح
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // عرض الواجهة بناءً على الدور المختار يدوياً
  return (
    <div className="relative">
      {/* زر عائم للعودة لبوابة العبور في أي وقت */}
      <Button 
        variant="outline" 
        size="sm" 
        onClick={resetBypass}
        className="fixed bottom-4 left-4 z-[100] rounded-full bg-white/80 backdrop-blur-md border-red-200 text-red-600 font-black shadow-xl hover:bg-red-600 hover:text-white"
      >
        <Terminal className="w-4 h-4 ml-2" /> تبديل الواجهة
      </Button>

      {activeUser.role === 'Admin' && <AdminView />}
      {activeUser.role === 'Agent' && <AgentView />}
      {activeUser.role === 'Specialist' && <SpecialistView />}
      
      {activeUser.role !== 'Admin' && activeUser.role !== 'Agent' && activeUser.role !== 'Specialist' && (
        <div className="flex flex-col items-center justify-center p-20 gap-4">
          <p className="font-black text-slate-400 text-center">لم يتم تحديد صلاحياتك الوظيفية بشكل صحيح.</p>
          <Button onClick={resetBypass} className="rounded-full">العودة للبوابة</Button>
        </div>
      )}
    </div>
  );
}
