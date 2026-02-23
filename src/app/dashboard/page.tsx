
"use client"

import { useAuth } from '@/lib/contexts/AuthContext';
import { AgentView } from '@/components/dashboard/AgentView';
import { SpecialistView } from '@/components/dashboard/SpecialistView';
import { AdminView } from '@/components/dashboard/AdminView';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Database, LayoutDashboard, Rocket, Loader2, ShieldCheck } from "lucide-react";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useState } from 'react';

export default function DashboardPage() {
  const { user, firebaseUser, error, logout, setupDemoProfile } = useAuth();
  const [isActivating, setIsActivating] = useState(false);

  const handleQuickActivate = async () => {
    setIsActivating(true);
    try {
      // تحديد الصلاحيات بناءً على البريد الإلكتروني للتجربة
      const isSpecialist = firebaseUser?.email?.includes('cards');
      if (isSpecialist) {
        await setupDemoProfile('Specialist', 'Cards', 'أخصائي معالجة البطائق');
      } else {
        await setupDemoProfile('Agent', 'Digital', 'موظف خدمة العملاء');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsActivating(false);
    }
  };

  if (error === "MISSING_PROFILE" && firebaseUser) {
    return (
      <div className="max-w-2xl mx-auto mt-10 space-y-6 text-right" dir="rtl">
        <Card className="banking-card border-none shadow-2xl overflow-hidden">
          <CardHeader className="premium-gradient text-white p-10">
            <div className="flex items-center gap-5 justify-start">
              <div className="p-4 bg-white/20 rounded-[22px] backdrop-blur-md">
                <ShieldCheck className="h-10 w-10 text-white" />
              </div>
              <div>
                <CardTitle className="text-3xl font-black">خطوة أخيرة: تفعيل الصلاحيات</CardTitle>
                <p className="text-white/80 text-sm mt-2 font-medium">حسابك مسجل في النظام بنجاح، نحتاج فقط لتأكيد دورك الوظيفي.</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-10 space-y-8 bg-white">
            <div className="bg-blue-50/50 border border-blue-100 p-8 rounded-[30px] text-primary leading-relaxed font-bold text-lg text-center">
              مرحباً بك في نظام "سند". لكي نتمكن من عرض واجهة (أخصائي معالجة البطائق) لك، يرجى الضغط على الزر أدناه ليتم إعداد صلاحياتك في قاعدة البيانات تلقائياً.
            </div>

            <div className="space-y-4">
              <Button 
                onClick={handleQuickActivate} 
                className="w-full h-18 rounded-[24px] bg-primary hover:bg-primary/90 text-white font-black text-xl shadow-2xl shadow-primary/30 flex items-center justify-center gap-4 py-8"
                disabled={isActivating}
              >
                {isActivating ? <Loader2 className="animate-spin h-6 w-6" /> : <Rocket className="w-7 h-7" />}
                تفعيل حسابي التجريبي الآن
              </Button>
              <p className="text-center text-xs text-slate-400 font-bold tracking-wide">سيقوم هذا الإجراء بإنشاء سجل وظيفتك في قاعدة بيانات Firestore فوراً</p>
            </div>

            <div className="pt-8 border-t border-slate-100">
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-[3px] mb-6">بيانات تسجيل الدخول الحالية</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 bg-slate-50 rounded-[20px] border border-slate-100">
                  <p className="text-[10px] text-slate-400 font-black mb-1">البريد الإلكتروني</p>
                  <p className="font-black text-slate-800 text-sm">{firebaseUser.email}</p>
                </div>
                <div className="p-5 bg-slate-50 rounded-[20px] border border-slate-100">
                  <p className="text-[10px] text-slate-400 font-black mb-1">نوع الدخول المكتشف</p>
                  <p className="font-black text-primary text-sm">{firebaseUser.email?.includes('cards') ? 'أخصائي معالجة البطائق' : 'موظف خدمة عملاء'}</p>
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

  // توجيه المستخدم حسب دوره الوظيفي
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
