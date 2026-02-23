
"use client"

import { useAuth } from '@/lib/contexts/AuthContext';
import { AgentView } from '@/components/dashboard/AgentView';
import { SpecialistView } from '@/components/dashboard/SpecialistView';
import { AdminView } from '@/components/dashboard/AdminView';
import { ShieldAlert, UserCog, Headset, CreditCard, MonitorSmartphone } from "lucide-react";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useState } from 'react';
import { UserRole, Department } from '@/lib/types';

export default function DashboardPage() {
  const { user } = useAuth();
  
  // نظام تجاوز الدخول (Mock User) للتطوير لتعطيل قيود Firebase
  const [mockUser, setMockUser] = useState<{role: UserRole, department: Department, name: string} | null>(null);

  // إذا كان هناك مستخدم حقيقي مسجل، نستخدمه، وإلا نستخدم المستخدم التجريبي المختار
  const activeUser = user || mockUser;

  // إذا لم يجد النظام مستخدماً، يظهر "بوابة عبور المطور" لاختيار الواجهة يدوياً
  if (!activeUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 animate-in fade-in duration-700">
        <Card className="banking-card max-w-2xl w-full border-none shadow-2xl overflow-hidden">
          <CardHeader className="premium-gradient text-white p-10 text-center">
            <div className="flex justify-center mb-4">
              <ShieldAlert className="h-16 w-16 opacity-80" />
            </div>
            <CardTitle className="text-3xl font-black">بوابة عبور المطور</CardTitle>
            <CardDescription className="text-white/70 font-bold mt-2">
              نظام الحماية معطل حالياً. اختر الواجهة التي تود إكمال بنائها وتجربتها الآن.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button 
                variant="outline" 
                className="h-24 flex flex-col gap-2 rounded-[24px] border-slate-100 hover:border-primary hover:bg-primary/5 transition-all"
                onClick={() => setMockUser({ role: 'Admin', department: 'Operations', name: 'المدير العام (تجريبي)' })}
              >
                <UserCog className="h-6 w-6 text-red-600" />
                <span className="font-black text-slate-800">واجهة المدير العام</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-24 flex flex-col gap-2 rounded-[24px] border-slate-100 hover:border-primary hover:bg-primary/5 transition-all"
                onClick={() => setMockUser({ role: 'Specialist', department: 'Cards', name: 'أخصائي البطائق (تجريبي)' })}
              >
                <CreditCard className="h-6 w-6 text-primary" />
                <span className="font-black text-slate-800">واجهة أخصائي البطائق</span>
              </Button>

              <Button 
                variant="outline" 
                className="h-24 flex flex-col gap-2 rounded-[24px] border-slate-100 hover:border-primary hover:bg-primary/5 transition-all"
                onClick={() => setMockUser({ role: 'Agent', department: 'Support', name: 'موظف الكول سنتر (تجريبي)' })}
              >
                <Headset className="h-6 w-6 text-secondary" />
                <span className="font-black text-slate-800">واجهة الكول سنتر</span>
              </Button>

              <Button 
                variant="outline" 
                className="h-24 flex flex-col gap-2 rounded-[24px] border-slate-100 hover:border-primary hover:bg-primary/5 transition-all"
                onClick={() => setMockUser({ role: 'Agent', department: 'Digital', name: 'موظف الخدمات الرقمية (تجريبي)' })}
              >
                <MonitorSmartphone className="h-6 w-6 text-accent" />
                <span className="font-black text-slate-800">واجهة الخدمات الرقمية</span>
              </Button>
            </div>
            
            <p className="text-center mt-8 text-xs font-bold text-slate-400 uppercase tracking-widest">
              هذه الواجهة متاحة فقط للمطورين لتجاوز قيود الدخول وبناء النظام
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // عرض الواجهة بناءً على الدور المختار يدوياً
  switch (activeUser.role) {
    case 'Admin':
      return <AdminView />;
    case 'Agent':
      return <AgentView />;
    case 'Specialist':
      return <SpecialistView />;
    default:
      return (
        <div className="flex flex-col items-center justify-center p-20 gap-4">
          <p className="font-black text-slate-400 text-center">لم يتم تحديد صلاحياتك الوظيفية بشكل صحيح.</p>
          <Button onClick={() => setMockUser(null)} className="rounded-full">العودة للبوابة</Button>
        </div>
      );
  }
}
