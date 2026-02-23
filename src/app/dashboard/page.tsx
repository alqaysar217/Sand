
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

  // نظام ذكي لتعيين الصلاحيات بناءً على القائمة الرسمية المرسلة من العميل
  const autoValues = useMemo(() => {
    const email = firebaseUser?.email || '';
    if (email === 'admin.bank@bank.com') return { role: 'Admin' as UserRole, dept: 'Operations' as Department, name: 'المدير العام' };
    if (email === 'balkharam.admin@bank.com') return { role: 'Admin' as UserRole, dept: 'Operations' as Department, name: 'بلخرم (المدير العام)' };
    if (email === 'cs.frontline@bank.com') return { role: 'Agent' as UserRole, dept: 'Digital' as Department, name: 'موظف الميدان' };
    if (email === 'callcenter.agent@bank.com') return { role: 'Agent' as UserRole, dept: 'Support' as Department, name: 'موظف الاتصال' };
    if (email === 'cards.ops@bank.com') return { role: 'Specialist' as UserRole, dept: 'Cards' as Department, name: 'الأخصائي الفني' };
    if (email === 'cs.digital@bank.com') return { role: 'Agent' as UserRole, dept: 'Digital' as Department, name: 'موظف خدمة العملاء الرقمية' };
    
    // قيمة افتراضية في حال وجود إيميل غير مسجل
    return { role: 'Agent' as UserRole, dept: 'Digital' as Department, name: 'موظف بنك جديد' };
  }, [firebaseUser?.email]);

  // التنشيط التلقائي الفوري: يتم إنشاء الملف بمجرد اكتشاف أنه مفقود
  useEffect(() => {
    if (error === "MISSING_PROFILE" && firebaseUser && !isActivating && !user) {
      const runActivation = async () => {
        setIsActivating(true);
        try {
          await setupDemoProfile(autoValues.role, autoValues.dept, autoValues.name);
          toast({ title: "تم تفعيل الهوية المصرفية", description: `مرحباً بك: ${autoValues.name}` });
        } catch (err) {
          console.error("Auto activation failed", err);
          toast({ variant: "destructive", title: "خطأ في التهيئة", description: "فشل تفعيل الصلاحيات تلقائياً." });
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
            <p className="text-slate-400 font-bold text-sm">يتم الآن التحقق من الهوية المصرفية لـ {autoValues.name}</p>
          </div>
        </div>
      </div>
    );
  }

  // السماح بالعرض فقط إذا وجد المستخدم والملف الشخصي
  if (!user && !isActivating) return (
     <div className="flex flex-col items-center justify-center p-20 gap-4">
        <Loader2 className="animate-spin h-10 w-10 text-primary" />
        <p className="font-black text-slate-500">جاري تحميل البيانات الفنية...</p>
        <Button onClick={logout} variant="outline" className="rounded-full">العودة للرئيسية</Button>
     </div>
  );

  switch (user.role) {
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
          <Button onClick={logout} className="rounded-full">الخروج وإعادة المحاولة</Button>
        </div>
      );
  }
}
