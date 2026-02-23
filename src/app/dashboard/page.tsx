
"use client"

import { useAuth } from '@/lib/contexts/AuthContext';
import { AgentView } from '@/components/dashboard/AgentView';
import { SpecialistView } from '@/components/dashboard/SpecialistView';
import { AdminView } from '@/components/dashboard/AdminView';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Database, LayoutDashboard, Rocket, Loader2, ShieldCheck, Copy, Check, ExternalLink, Info } from "lucide-react";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export default function DashboardPage() {
  const { user, firebaseUser, error, logout, setupDemoProfile } = useAuth();
  const [isActivating, setIsActivating] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

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
      const isSpecialist = firebaseUser?.email?.includes('cards');
      if (isSpecialist) {
        await setupDemoProfile('Specialist', 'Cards', 'أخصائي معالجة البطائق');
      } else {
        await setupDemoProfile('Agent', 'Digital', 'موظف خدمة العملاء');
      }
      toast({ title: "تم التفعيل", description: "تم إنشاء ملفك الشخصي بنجاح، جاري تحويلك..." });
    } catch (err) {
      console.error(err);
      toast({ variant: "destructive", title: "خطأ في التفعيل", description: "فشل إنشاء الملف في قاعدة البيانات." });
    } finally {
      setIsActivating(false);
    }
  };

  if (error === "MISSING_PROFILE" && firebaseUser) {
    return (
      <div className="max-w-4xl mx-auto mt-10 space-y-8 text-right pb-20" dir="rtl">
        <Card className="banking-card border-none shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
          <CardHeader className="premium-gradient text-white p-10">
            <div className="flex items-center gap-6 justify-start">
              <div className="p-5 bg-white/20 rounded-[28px] backdrop-blur-md shadow-inner">
                <ShieldCheck className="h-12 w-12 text-white" />
              </div>
              <div>
                <CardTitle className="text-4xl font-black tracking-tight">تفعيل الصلاحيات المصرفية</CardTitle>
                <p className="text-white/80 text-lg mt-2 font-medium">خطوة أخيرة للوصول إلى لوحة تحكم الأخصائي</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-10 space-y-10 bg-white">
            <div className="bg-blue-50/50 border-2 border-dashed border-blue-200 p-8 rounded-[32px] text-primary leading-relaxed font-bold text-xl text-center shadow-sm">
               مرحباً بك في نظام سند. لكي نتمكن من عرض واجهة الأخصائي، نحتاج لربط حسابك بدوره الوظيفي في قاعدة البيانات.
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <Card className="rounded-[32px] border-none bg-slate-50 p-8 space-y-6">
                  <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
                    <Rocket className="w-6 h-6 text-primary" /> الخيار 1: التفعيل التلقائي
                  </h3>
                  <p className="text-slate-500 font-medium">سيقوم النظام بإنشاء سجل وظيفتك تلقائياً كأخصائي بطائق (Cards Specialist).</p>
                  <Button 
                    onClick={handleQuickActivate} 
                    className="w-full h-20 rounded-[24px] bg-primary hover:bg-primary/90 text-white font-black text-xl shadow-2xl shadow-primary/30 flex items-center justify-center gap-4 py-8 transition-all hover:scale-[1.02]"
                    disabled={isActivating}
                  >
                    {isActivating ? <Loader2 className="animate-spin h-7 w-7" /> : <ShieldCheck className="w-8 h-8" />}
                    تفعيل حسابي الآن
                  </Button>
               </Card>

               <Card className="rounded-[32px] border-none bg-slate-50 p-8 space-y-6">
                  <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
                    <Database className="w-6 h-6 text-secondary" /> الخيار 2: التفعيل اليدوي
                  </h3>
                  <p className="text-slate-500 font-medium text-sm">إذا كنت مبرمجاً، يمكنك إضافة الوثيقة يدوياً في Firebase Console باتباع الخطوات التالية:</p>
                  <ul className="text-xs text-slate-600 space-y-2 list-disc pr-4">
                    <li>افتح رابط <a href="https://console.firebase.google.com/" target="_blank" className="text-primary underline flex items-center gap-1 inline-flex">Firebase Console <ExternalLink className="w-3 h-3" /></a></li>
                    <li>اذهب إلى <b>Firestore Database</b> ثم مجموعة <b>users</b>.</li>
                    <li>أنشئ وثيقة جديدة واستخدم الـ <b>UID</b> الموضح أدناه كمعرف للوثيقة (Document ID).</li>
                    <li>أضف الحقول: name, email, role (Specialist), department (Cards).</li>
                  </ul>
               </Card>
            </div>

            <div className="pt-10 border-t border-slate-100">
              <h4 className="text-sm font-black text-slate-800 mb-6 flex items-center gap-2">
                <Info className="w-4 h-4 text-primary" /> بيانات الربط التقنية (للمطورين)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 bg-white rounded-[20px] border border-slate-200 relative group flex flex-col justify-center">
                  <p className="text-[10px] text-slate-400 font-black mb-1 uppercase tracking-widest">User ID (الذي يوضع في Document ID)</p>
                  <p className="font-mono font-black text-primary text-xs break-all pr-12">{firebaseUser.uid}</p>
                  <Button size="icon" variant="ghost" className="absolute left-2 top-1/2 -translate-y-1/2 bg-slate-50 rounded-full" onClick={handleCopyUid}>
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-slate-400" />}
                  </Button>
                </div>
                <div className="p-5 bg-white rounded-[20px] border border-slate-200">
                  <p className="text-[10px] text-slate-400 font-black mb-1 uppercase tracking-widest">Required Role (حقل الدور الوظيفي)</p>
                  <p className="font-black text-slate-800 text-sm">Specialist</p>
                </div>
                <div className="p-5 bg-white rounded-[20px] border border-slate-200">
                  <p className="text-[10px] text-slate-400 font-black mb-1 uppercase tracking-widest">Department (حقل القسم)</p>
                  <p className="font-black text-slate-800 text-sm">Cards</p>
                </div>
                <div className="p-5 bg-white rounded-[20px] border border-slate-200">
                  <p className="text-[10px] text-slate-400 font-black mb-1 uppercase tracking-widest">Collection Path (المجموعة)</p>
                  <p className="font-mono font-black text-slate-400 text-xs">/users</p>
                </div>
              </div>
            </div>

            <div className="pt-6 flex gap-4">
              <Button variant="ghost" className="flex-1 h-14 rounded-full font-black text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all" onClick={logout}>إلغاء وتسجيل الخروج</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto mt-20 space-y-4 text-right" dir="rtl">
        <Alert variant="destructive" className="rounded-[24px] border-none shadow-xl p-6">
          <AlertCircle className="h-6 w-6" />
          <AlertTitle className="font-black text-lg text-right">حدث خطأ في النظام</AlertTitle>
          <AlertDescription className="mt-2 font-bold text-right">{error}</AlertDescription>
        </Alert>
        <Button className="w-full h-14 rounded-full font-black text-lg" variant="outline" onClick={logout}>العودة لصفحة الدخول</Button>
      </div>
    );
  }

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
        <div className="p-12 text-center bg-white rounded-[32px] shadow-sm max-w-md mx-auto mt-20">
          <div className="p-6 bg-slate-50 rounded-full w-fit mx-auto mb-6"><LayoutDashboard className="w-16 h-16 text-slate-300" /></div>
          <h2 className="text-2xl font-black text-slate-800">صلاحيات غير معروفة</h2>
          <p className="text-slate-500 mt-2 font-medium">يرجى مراجعة مدير النظام لتحديث دورك الوظيفي.</p>
          <Button variant="outline" onClick={logout} className="mt-10 w-full h-14 rounded-full font-black">تسجيل الخروج</Button>
        </div>
      );
  }
}
