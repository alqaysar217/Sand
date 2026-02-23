
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
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { UserRole, Department } from '@/lib/types';

export default function DashboardPage() {
  const { user, firebaseUser, error, logout, setupDemoProfile } = useAuth();
  const [isActivating, setIsActivating] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const getAutoValues = () => {
    const email = firebaseUser?.email || '';
    if (email.includes('admin')) return { role: 'Admin' as UserRole, dept: 'Operations' as Department, name: 'المدير العام' };
    if (email.includes('cards')) return { role: 'Specialist' as UserRole, dept: 'Cards' as Department, name: 'أخصائي البطائق' };
    if (email.includes('frontline')) return { role: 'Agent' as UserRole, dept: 'Support' as Department, name: 'موظف الكول سنتر' };
    if (email.includes('digital')) return { role: 'Agent' as UserRole, dept: 'Digital' as Department, name: 'موظف خدمة العملاء الرقمية' };
    return { role: 'Agent' as UserRole, dept: 'Digital' as Department, name: 'موظف بنك' };
  };

  const autoValues = getAutoValues();

  // تفعيل تلقائي للحسابات التجريبية لتقليل الخطوات على المستخدم
  useEffect(() => {
    if (error === "MISSING_PROFILE" && firebaseUser && !isActivating) {
      const autoActivate = async () => {
        setIsActivating(true);
        try {
          await setupDemoProfile(autoValues.role, autoValues.dept, autoValues.name);
          toast({ title: "تم التفعيل التلقائي", description: "مرحباً بك في نظام سند." });
        } catch (err) {
          console.error("Auto activation failed", err);
        } finally {
          setIsActivating(false);
        }
      };
      autoActivate();
    }
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
      toast({ title: "تم التفعيل", description: "تم إنشاء ملفك الشخصي بنجاح، جاري تحويلك..." });
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
          <div className="h-4 w-48 bg-slate-200 rounded text-center font-black">جاري تهيئة صلاحياتك المصرفية...</div>
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
                <p className="text-white/80 text-base mt-1 font-bold">يجب ربط هويتك بملف وظيفي في النظام للبدء</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-10 space-y-10 bg-white">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6 text-right">
                <div className="flex items-center gap-3 text-primary font-black text-xl mb-4 justify-end">
                  <Rocket className="w-6 h-6" />
                  <h3>التفعيل اليدوي</h3>
                </div>
                <p className="text-slate-600 leading-relaxed font-bold">
                  سيقوم النظام بربط حسابك كـ <span className="text-primary">{autoValues.name}</span> في قسم <span className="text-secondary">{autoValues.dept}</span> فوراً.
                </p>
                <Button 
                  onClick={handleQuickActivate} 
                  className="w-full h-20 rounded-[24px] bg-primary hover:bg-primary/90 text-white font-black text-xl shadow-xl shadow-primary/20 flex items-center justify-center gap-4"
                >
                  <ShieldCheck className="w-8 h-8" />
                  تفعيل صلاحياتي الآن
                </Button>
              </div>

              <div className="bg-slate-50 p-6 rounded-[24px] border border-slate-100 space-y-6 text-right">
                <div className="flex items-center gap-3 text-slate-800 font-black text-lg justify-end">
                  <Database className="w-5 h-5 text-secondary" />
                  <h3>بيانات الربط اليدوي (Firestore)</h3>
                </div>
                <div className="space-y-4">
                  <Label className="text-[10px] text-primary font-black uppercase block text-right">Document ID (UID)</Label>
                  <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-[14px] border border-slate-200 flex-row-reverse">
                    <p className="font-mono font-black text-primary text-xs break-all">{firebaseUser.uid}</p>
                    <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full shrink-0" onClick={handleCopyUid}>
                      {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-slate-400" />}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
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
      return <div>صلاحيات غير معروفة</div>;
  }
}
