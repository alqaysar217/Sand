
"use client"

import { useAuth } from '@/lib/contexts/AuthContext';
import { AgentView } from '@/components/dashboard/AgentView';
import { SpecialistView } from '@/components/dashboard/SpecialistView';
import { AdminView } from '@/components/dashboard/AdminView';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  AlertCircle, Database, LayoutDashboard, Rocket, 
  Loader2, ShieldCheck, Copy, Check, ExternalLink, 
  Info, User, Mail, Shield, Building2, Fingerprint, LogOut
} from "lucide-react";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
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
              <div className="space-y-6">
                <div className="flex items-center gap-3 text-primary font-black text-2xl mb-4">
                  <Rocket className="w-8 h-8" />
                  <h3>الخيار 1: التفعيل التلقائي (موصى به)</h3>
                </div>
                <p className="text-slate-600 leading-relaxed font-medium">
                  سيقوم النظام بإنشاء ملفك الشخصي كـ <span className="text-primary font-bold">أخصائي بطائق (Cards Specialist)</span> وربطه بحسابك فوراً.
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

              <div className="bg-slate-50/50 rounded-[40px] p-8 border border-slate-100 space-y-6">
                <div className="flex items-center gap-3 text-slate-800 font-black text-xl">
                  <Database className="w-6 h-6 text-secondary" />
                  <h3>الخيار 2: التفعيل اليدوي (عبر Firestore)</h3>
                </div>
                <div className="space-y-4">
                  <p className="text-sm text-slate-500 font-medium">إذا لم ينجح الزر أعلاه، اتبع الخطوات التالية في Firebase Console:</p>
                  <ol className="text-xs text-slate-600 space-y-3 list-decimal pr-5">
                    <li>افتح رابط <a href="https://console.firebase.google.com/" target="_blank" className="text-primary underline font-bold inline-flex items-center gap-1">Firebase Console <ExternalLink className="w-3 h-3" /></a>.</li>
                    <li>اذهب لـ <b>Authentication</b> وانسخ الـ <b>UID</b> الخاص بك (الموجود في المربع الأزرق أدناه).</li>
                    <li>اذهب لـ <b>Firestore Database</b> ثم مجموعة <b>users</b>.</li>
                    <li>اضغط <b>Add document</b> وضع الرقم في خانة <b>Document ID</b>.</li>
                  </ol>
                </div>
              </div>
            </div>

            <div className="pt-10 border-t border-slate-100 space-y-8">
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-secondary/10 rounded-full"><Info className="w-5 h-5 text-secondary" /></div>
                 <h4 className="text-xl font-black text-slate-800">بيانات الربط الدقيقة</h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="rounded-[32px] border-2 border-primary/20 bg-primary/[0.02] p-8 relative overflow-hidden group">
                  <div className="relative z-10 space-y-4">
                    <Label className="text-[10px] text-primary font-black uppercase tracking-[0.2em] mb-2 block">Document ID (الرقم المطلوب)</Label>
                    <div className="flex items-center justify-between gap-4 bg-white p-5 rounded-[20px] border border-primary/10 shadow-sm">
                      <p className="font-mono font-black text-primary text-sm break-all">{firebaseUser.uid}</p>
                      <Button size="icon" variant="ghost" className="h-12 w-12 rounded-full shrink-0 bg-primary/5 hover:bg-primary/10" onClick={handleCopyUid}>
                        {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5 text-primary" />}
                      </Button>
                    </div>
                  </div>
                </Card>

                <div className="space-y-4">
                  <Label className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] pr-2 block">الحقول المطلوبة (Add Fields)</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white border border-slate-100 p-4 rounded-[20px] shadow-sm">
                      <span className="text-[10px] font-black text-slate-400 block mb-1">role</span>
                      <p className="font-black text-slate-800">Specialist</p>
                    </div>
                    <div className="bg-white border border-slate-100 p-4 rounded-[20px] shadow-sm">
                      <span className="text-[10px] font-black text-slate-400 block mb-1">department</span>
                      <p className="font-black text-slate-800">Cards</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-8 flex gap-4">
              <Button variant="ghost" className="flex-1 h-14 rounded-full font-black text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all" onClick={logout}>
                <LogOut className="w-5 h-5 ml-2" /> خروج وإلغاء
              </Button>
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
          <h2 className="text-2xl font-black text-slate-800">صلاحيات غير معروفة</h2>
          <Button variant="outline" onClick={logout} className="mt-10 w-full h-14 rounded-full font-black">تسجيل الخروج</Button>
        </div>
      );
  }
}
