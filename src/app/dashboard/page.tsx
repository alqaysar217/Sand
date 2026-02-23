
"use client"

import { useAuth } from '@/lib/contexts/AuthContext';
import { AgentView } from '@/components/dashboard/AgentView';
import { SpecialistView } from '@/components/dashboard/SpecialistView';
import { AdminView } from '@/components/dashboard/AdminView';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { Button } from '@/components/ui/button';
import { useState, useEffect, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { UserRole, Department } from '@/lib/types';

export default function DashboardPage() {
  const { user, firebaseUser, error, loading, logout, setupDemoProfile } = useAuth();
  const [isActivating, setIsActivating] = useState(false);
  const { toast } = useToast();

  const autoValues = useMemo(() => {
    const email = firebaseUser?.email || '';
    // مطابقة دقيقة بناءً على قائمة المستخدم المرسلة
    if (email === 'admin.bank@bank.com') return { role: 'Admin' as UserRole, dept: 'Operations' as Department, name: 'المدير العام' };
    if (email === 'balkharam.admin@bank.com') return { role: 'Admin' as UserRole, dept: 'Operations' as Department, name: 'بلخرم (المدير العام)' };
    if (email === 'callcenter.agent@bank.com') return { role: 'Agent' as UserRole, dept: 'Support' as Department, name: 'موظف الاتصال' };
    if (email === 'cards.ops@bank.com') return { role: 'Specialist' as UserRole, dept: 'Cards' as Department, name: 'الأخصائي الفني' };
    if (email === 'cs.frontline@bank.com') return { role: 'Agent' as UserRole, dept: 'Digital' as Department, name: 'موظف الميدان' };
    if (email === 'cs.digital@bank.com') return { role: 'Agent' as UserRole, dept: 'Digital' as Department, name: 'موظف خدمة العملاء الرقمية' };
    
    // افتراضي في حال لم يتطابق شيء
    return { role: 'Agent' as UserRole, dept: 'Digital' as Department, name: 'موظف بنك' };
  }, [firebaseUser?.email]);

  // تفعيل فوري وحاسم للحسابات التجريبية
  useEffect(() => {
    if (error === "MISSING_PROFILE" && firebaseUser && !isActivating && !user) {
      const runActivation = async () => {
        setIsActivating(true);
        try {
          await setupDemoProfile(autoValues.role, autoValues.dept, autoValues.name);
          toast({ title: "تم تفعيل الصلاحيات", description: `مرحباً بك ${autoValues.name} في نظام سند.` });
        } catch (err) {
          console.error("Auto activation failed", err);
          toast({ variant: "destructive", title: "خطأ في التفعيل", description: "يرجى المحاولة مرة أخرى." });
        } finally {
          setIsActivating(false);
        }
      };
      runActivation();
    }
  }, [error, firebaseUser, autoValues, setupDemoProfile, toast, isActivating, user]);

  if (loading || isActivating) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#F6F9FA]">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
             <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
             <Loader2 className="absolute inset-0 m-auto h-6 w-6 text-primary animate-pulse" />
          </div>
          <div className="text-center space-y-2">
            <h2 className="font-black text-primary text-xl">جاري تهيئة بيئة العمل...</h2>
            <p className="text-slate-400 font-bold text-sm">يتم الآن التحقق من هويتك المصرفية كـ {autoValues.name}</p>
          </div>
        </div>
      </div>
    );
  }

  if (error === "MISSING_PROFILE") {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-6 text-center">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <p className="font-black text-slate-600 text-lg">لم يتم العثور على ملفك الشخصي، جاري إنشاؤه تلقائياً...</p>
        <Button onClick={logout} variant="outline" className="rounded-full">خروج ومحاولة مرة أخرى</Button>
      </div>
    );
  }

  if (error) return (
    <div className="max-w-md mx-auto mt-20 text-right" dir="rtl">
      <Alert variant="destructive" className="rounded-[24px] shadow-xl border-none">
        <AlertTitle className="font-black text-right mb-2">تنبيه النظام</AlertTitle>
        <AlertDescription className="font-bold text-right">{error}</AlertDescription>
      </Alert>
      <Button className="w-full h-12 rounded-full mt-6 font-black bg-primary shadow-lg" onClick={logout}>تسجيل الخروج والعودة</Button>
    </div>
  );

  if (!user) return null;

  switch (user.role) {
    case 'Agent':
      return <AgentView />;
    case 'Specialist':
      return <SpecialistView />;
    case 'Admin':
      return <AdminView />;
    default:
      return (
        <div className="flex flex-col items-center justify-center p-20 gap-4">
          <p className="font-black text-slate-400">نعتذر، لم نتمكن من تحديد واجهة العمل الخاصة بك.</p>
          <Button onClick={logout} className="rounded-full">العودة للخلف</Button>
        </div>
      );
  }
}
