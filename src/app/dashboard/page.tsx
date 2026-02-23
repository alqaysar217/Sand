
"use client"

import { useAuth } from '@/lib/contexts/AuthContext';
import { AgentView } from '@/components/dashboard/AgentView';
import { SpecialistView } from '@/components/dashboard/SpecialistView';
import { AdminView } from '@/components/dashboard/AdminView';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  ShieldCheck, Copy, Check, Loader2, LogOut, Rocket, Database
} from "lucide-react";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useState, useEffect, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { UserRole, Department } from '@/lib/types';

export default function DashboardPage() {
  const { user, firebaseUser, error, logout, setupDemoProfile } = useAuth();
  const [isActivating, setIsActivating] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const autoValues = useMemo(() => {
    const email = firebaseUser?.email || '';
    if (email.includes('admin')) return { role: 'Admin' as UserRole, dept: 'Operations' as Department, name: 'المدير العام' };
    if (email.includes('cards')) return { role: 'Specialist' as UserRole, dept: 'Cards' as Department, name: 'أخصائي البطائق' };
    if (email.includes('frontline')) return { role: 'Agent' as UserRole, dept: 'Support' as Department, name: 'موظف الكول سنتر' };
    if (email.includes('digital')) return { role: 'Agent' as UserRole, dept: 'Digital' as Department, name: 'موظف خدمة العملاء الرقمية' };
    return { role: 'Agent' as UserRole, dept: 'Digital' as Department, name: 'موظف بنك' };
  }, [firebaseUser?.email]);

  // تفعيل تلقائي للحسابات التجريبية لتقليل الخطوات على المستخدم
  useEffect(() => {
    let mounted = true;
    if (error === "MISSING_PROFILE" && firebaseUser && !isActivating) {
      const autoActivate = async () => {
        setIsActivating(true);
        try {
          await setupDemoProfile(autoValues.role, autoValues.dept, autoValues.name);
          if (mounted) {
            toast({ title: "تم التفعيل التلقائي", description: "مرحباً بك في نظام سند." });
          }
        } catch (err) {
          console.error("Auto activation failed", err);
        } finally {
          if (mounted) setIsActivating(false);
        }
      };
      autoActivate();
    }
    return () => { mounted = false; };
  }, [error, firebaseUser, autoValues, setupDemoProfile, toast, isActivating]);

  const handleCopyUid = () => {
    if (firebaseUser?.uid) {
      navigator.clipboard.writeText(firebaseUser.uid);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: "تم النسخ", description: "تم نسخ المعرف الفريد (UID) للحافظة." });
    }
  };

  const handleQuickActivate = async () => {
    setIsActivating(true);
    try {
      await setupDemoProfile(autoValues.role, autoValues.dept, autoValues.name);
    } catch (err) {
      toast({ variant: "destructive", title: "خطأ في التفعيل", description: "فشل إنشاء الملف في قاعدة البيانات." });
    } finally {
      setIsActivating(false);
    }
  };

  if (isActivating) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#F6F9FA]">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 text-primary animate-spin" />
          <div className="font-black text-primary">جاري تهيئة صلاحياتك المصرفية...</div>
        </div>
      </div>
    );
  }

  if (error === "MISSING_PROFILE" && firebaseUser) {
    return (
      <div className="max-w-4xl mx-auto mt-6 space-y-8 text-right pb-20" dir="rtl">
        <Card className="banking-card border-none shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4">
          <CardHeader className="premium-gradient text-white p-10">
            <div className="flex items-center gap-6 justify-start flex-row-reverse">
              <div className="p-4 bg-white/20 rounded-[20px] backdrop-blur-md">
                <ShieldCheck className="h-10 w-10 text-white" />
              </div>
              <div className="text-right">
                <CardTitle className="text-3xl font-black">تنشيط الصلاحيات المصرفية</CardTitle>
                <p className="text-white/80 text-base mt-1 font-bold">يتم الآن ربط هويتك بملف وظيفي في النظام...</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-10 flex flex-col items-center gap-6">
            <Loader2 className="h-12 w-12 text-primary animate-spin" />
            <p className="font-bold text-slate-500">يرجى الانتظار ثوانٍ معدودة لتجهيز واجهة العمل الخاصة بك.</p>
            <Button variant="outline" onClick={handleQuickActivate} className="rounded-full">اضغط هنا إذا لم يتم التحويل تلقائياً</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) return (
    <div className="max-w-md mx-auto mt-20 text-right" dir="rtl">
      <Alert variant="destructive" className="rounded-[24px] shadow-xl">
        <AlertTitle className="font-black text-right">خطأ في النظام</AlertTitle>
        <AlertDescription className="font-bold text-right">{error}</AlertDescription>
      </Alert>
      <Button className="w-full h-12 rounded-full mt-4 font-black" onClick={logout}>خروج</Button>
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
          <p className="font-black text-slate-400">صلاحيات غير معروفة أو لم يتم تحديد القسم بعد.</p>
          <Button onClick={logout}>تسجيل الخروج</Button>
        </div>
      );
  }
}
