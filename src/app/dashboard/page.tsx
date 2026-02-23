
"use client"

import { useAuth } from '@/lib/contexts/AuthContext';
import { AgentView } from '@/components/dashboard/AgentView';
import { SpecialistView } from '@/components/dashboard/SpecialistView';
import { AdminView } from '@/components/dashboard/AdminView';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Database, LayoutDashboard, Rocket, Loader2, ShieldCheck, Copy, Check } from "lucide-react";
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
      <div className="max-w-3xl mx-auto mt-10 space-y-6 text-right" dir="rtl">
        <Card className="banking-card border-none shadow-2xl overflow-hidden">
          <CardHeader className="premium-gradient text-white p-10">
            <div className="flex items-center gap-5 justify-start">
              <div className="p-4 bg-white/20 rounded-[22px] backdrop-blur-md">
                <ShieldCheck className="h-10 w-10 text-white" />
              </div>
              <div>
                <CardTitle className="text-3xl font-black">خطوة أخيرة: تفعيل الصلاحيات</CardTitle>
                <p className="text-white/80 text-sm mt-2 font-medium">حسابك مسجل بنجاح، نحتاج لربط دورك الوظيفي في قاعدة البيانات.</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-10 space-y-8 bg-white">
            <div className="bg-blue-50/50 border border-blue-100 p-8 rounded-[30px] text-primary leading-relaxed font-bold text-lg text-center">
              مرحباً بك. لكي نتمكن من عرض واجهة الأخصائي لك، يرجى الضغط على الزر أدناه ليقوم النظام بإنشاء سجل وظيفتك في Firestore تلقائياً.
            </div>

            <Button 
              onClick={handleQuickActivate} 
              className="w-full h-20 rounded-[24px] bg-primary hover:bg-primary/90 text-white font-black text-xl shadow-2xl shadow-primary/30 flex items-center justify-center gap-4 py-8 transition-all hover:scale-[1.02]"
              disabled={isActivating}
            >
              {isActivating ? <Loader2 className="animate-spin h-7 w-7" /> : <Rocket className="w-8 h-8" />}
              تفعيل حسابي (أخصائي بطائق) الآن
            </Button>

            <div className="pt-10 border-t border-slate-100">
              <h4 className="text-sm font-black text-slate-800 mb-6 flex items-center gap-2">
                <Database className="w-4 h-4 text-primary" /> بيانات الربط اليدوي (للمبرمجين)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 bg-slate-50 rounded-[20px] border border-slate-200 relative group">
                  <p className="text-[10px] text-slate-400 font-black mb-1 uppercase">User ID (UID)</p>
                  <p className="font-mono font-black text-slate-700 text-xs break-all">{firebaseUser.uid}</p>
                  <Button size="icon" variant="ghost" className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={handleCopyUid}>
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-slate-400" />}
                  </Button>
                </div>
                <div className="p-5 bg-slate-50 rounded-[20px] border border-slate-200">
                  <p className="text-[10px] text-slate-400 font-black mb-1 uppercase">Required Role</p>
                  <p className="font-black text-primary text-sm">Specialist</p>
                </div>
                <div className="p-5 bg-slate-50 rounded-[20px] border border-slate-200">
                  <p className="text-[10px] text-slate-400 font-black mb-1 uppercase">Department</p>
                  <p className="font-black text-slate-700 text-sm">Cards</p>
                </div>
                <div className="p-5 bg-slate-50 rounded-[20px] border border-slate-200">
                  <p className="text-[10px] text-slate-400 font-black mb-1 uppercase">Collection Path</p>
                  <p className="font-mono font-black text-slate-700 text-xs">/users/{firebaseUser.uid.substring(0,5)}...</p>
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
          <AlertTitle className="font-black text-lg">حدث خطأ في النظام</AlertTitle>
          <AlertDescription className="mt-2 font-bold">{error}</AlertDescription>
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
