
"use client"

import { useAuth } from '@/lib/contexts/AuthContext';
import { AgentView } from '@/components/dashboard/AgentView';
import { SpecialistView } from '@/components/dashboard/SpecialistView';
import { AdminView } from '@/components/dashboard/AdminView';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  AlertCircle, Database, LayoutDashboard, Rocket, 
  Loader2, ShieldCheck, Copy, Check, ExternalLink, 
  Info, User, Mail, Shield, Building2 
} from "lucide-react";
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
      <div className="max-w-5xl mx-auto mt-6 space-y-8 text-right pb-20" dir="rtl">
        <Card className="banking-card border-none shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
          <CardHeader className="premium-gradient text-white p-10">
            <div className="flex items-center gap-6 justify-start">
              <div className="p-5 bg-white/20 rounded-[28px] backdrop-blur-md shadow-inner">
                <ShieldCheck className="h-12 w-12 text-white" />
              </div>
              <div>
                <CardTitle className="text-4xl font-black tracking-tight">تفعيل الصلاحيات المصرفية</CardTitle>
                <p className="text-white/80 text-lg mt-2 font-medium">خطوة أخيرة للوصول إلى محطة عمل الأخصائي</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-10 space-y-12 bg-white">
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              {/* القسم الأول: التفعيل التلقائي */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 text-primary font-black text-2xl mb-4">
                  <Rocket className="w-8 h-8" />
                  <h3>الخيار 1: التفعيل التلقائي (موصى به)</h3>
                </div>
                <p className="text-slate-600 leading-relaxed font-medium">
                  سيقوم النظام بإنشاء ملفك الشخصي كـ <span className="text-primary font-bold">أخصائي بطائق (Cards Specialist)</span> وربطه بحسابك فوراً دون أي تدخل يدوي منك.
                </p>
                <Button 
                  onClick={handleQuickActivate} 
                  className="w-full h-24 rounded-[32px] bg-primary hover:bg-primary/90 text-white font-black text-2xl shadow-2xl shadow-primary/30 flex items-center justify-center gap-4 transition-all hover:scale-[1.02]"
                  disabled={isActivating}
                >
                  {isActivating ? <Loader2 className="animate-spin h-8 w-8" /> : <ShieldCheck className="w-10 h-10" />}
                  تفعيل حسابي الآن
                </Button>
              </div>

              {/* القسم الثاني: التعليمات اليدوية */}
              <div className="bg-slate-50/50 rounded-[40px] p-8 border border-slate-100 space-y-6">
                <div className="flex items-center gap-3 text-slate-800 font-black text-xl">
                  <Database className="w-6 h-6 text-secondary" />
                  <h3>الخيار 2: التفعيل اليدوي (خطوات الـ Firestore)</h3>
                </div>
                <div className="space-y-4">
                  <p className="text-sm text-slate-500 font-medium">إذا أردت القيام بذلك يدوياً في Firebase Console، اتبع الدليل التالي:</p>
                  <ol className="text-xs text-slate-600 space-y-3 list-decimal pr-5">
                    <li>افتح رابط <a href="https://console.firebase.google.com/" target="_blank" className="text-primary underline font-bold inline-flex items-center gap-1">Firebase Console <ExternalLink className="w-3 h-3" /></a> وافتح مشروعك.</li>
                    <li>من القائمة الجانبية، اختر <b>Firestore Database</b> ثم مجموعة <b>users</b>.</li>
                    <li>اضغط على <b>Add document</b> (إضافة وثيقة).</li>
                    <li>في خانة <b>Document ID</b>، الصق الرقم الموضح في المربع الأزرق أدناه.</li>
                    <li>أضف الحقول الموضحة في "بيانات الربط" أدناه.</li>
                  </ol>
                </div>
              </div>
            </div>

            {/* دليل البيانات التقنية - هذا هو الجزء الذي يوضح Document ID */}
            <div className="pt-10 border-t border-slate-100 space-y-8">
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-secondary/10 rounded-full"><Info className="w-5 h-5 text-secondary" /></div>
                 <h4 className="text-xl font-black text-slate-800">بيانات الربط الدقيقة (ما ستضعه في Firestore)</h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* خانة Document ID */}
                <Card className="rounded-[32px] border-2 border-primary/20 bg-primary/[0.02] p-8 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Fingerprint className="w-24 h-24" />
                  </div>
                  <div className="relative z-10 space-y-4">
                    <Label className="text-[10px] text-primary font-black uppercase tracking-[0.2em] mb-2 block">Document ID (الرقم الذي تسأل عنه)</Label>
                    <div className="flex items-center justify-between gap-4 bg-white p-5 rounded-[20px] border border-primary/10 shadow-sm">
                      <p className="font-mono font-black text-primary text-sm break-all">{firebaseUser.uid}</p>
                      <Button size="icon" variant="ghost" className="h-12 w-12 rounded-full shrink-0 bg-primary/5 hover:bg-primary/10" onClick={handleCopyUid}>
                        {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5 text-primary" />}
                      </Button>
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold">انسخ هذا الرقم وضعه في خانة Document ID عند إضافة وثيقة جديدة.</p>
                  </div>
                </Card>

                {/* الحقول المطلوبة */}
                <div className="space-y-4">
                  <Label className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] pr-2 block">الحقول المطلوبة (Add Fields)</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white border border-slate-100 p-4 rounded-[20px] shadow-sm">
                      <div className="flex items-center gap-2 mb-1">
                        <Shield className="w-3.5 h-3.5 text-secondary" />
                        <span className="text-[10px] font-black text-slate-400">اسم الحقل: role</span>
                      </div>
                      <p className="font-black text-slate-800">Specialist</p>
                    </div>
                    <div className="bg-white border border-slate-100 p-4 rounded-[20px] shadow-sm">
                      <div className="flex items-center gap-2 mb-1">
                        <Building2 className="w-3.5 h-3.5 text-secondary" />
                        <span className="text-[10px] font-black text-slate-400">اسم الحقل: department</span>
                      </div>
                      <p className="font-black text-slate-800">Cards</p>
                    </div>
                    <div className="bg-white border border-slate-100 p-4 rounded-[20px] shadow-sm">
                      <div className="flex items-center gap-2 mb-1">
                        <User className="w-3.5 h-3.5 text-secondary" />
                        <span className="text-[10px] font-black text-slate-400">اسم الحقل: name</span>
                      </div>
                      <p className="font-black text-slate-800">أخصائي بطائق</p>
                    </div>
                    <div className="bg-white border border-slate-100 p-4 rounded-[20px] shadow-sm">
                      <div className="flex items-center gap-2 mb-1">
                        <Mail className="w-3.5 h-3.5 text-secondary" />
                        <span className="text-[10px] font-black text-slate-400">اسم الحقل: email</span>
                      </div>
                      <p className="font-black text-slate-800 text-[10px]">{firebaseUser.email}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-8 flex gap-4">
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

function Fingerprint(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.02-.26 3" />
      <path d="M14 13.12c0 2.38 0 4.38-.14 4.38-.14 0-.14-2-.14-4.38 0-1.03.18-2.01.46-3" />
      <path d="M2 12c0-3.36 1.95-6.27 4.86-7.64" />
      <path d="M6.44 2.14C8.2 1.4 10.06 1 12 1c7.95 0 14.39 6.44 14.39 14.39 0 3.52-.9 6.83-2.49 9.71" />
      <path d="M17 3.34A10 10 0 0 1 21 12c0 .69-.05 1.36-.14 2" />
      <path d="M9 6.41a6 6 0 0 1 3-1.41c3.07 0 5.64 2.34 5.92 5.31" />
      <path d="M8 10.05C8 8.19 9.56 6.67 11.48 6.58c1.69-.08 3.1 1.08 3.1 2.76 0 .57-.03 1.14-.08 1.71" />
      <path d="M7 15h2" />
      <path d="M12 15v3" />
      <path d="M15 15h2" />
      <path d="M12 21v2" />
    </svg>
  )
}
