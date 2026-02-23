
"use client"

import { useAuth } from '@/lib/contexts/AuthContext';
import { AgentView } from '@/components/dashboard/AgentView';
import { SpecialistView } from '@/components/dashboard/SpecialistView';
import { AdminView } from '@/components/dashboard/AdminView';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Database, LayoutDashboard, Rocket, Loader2 } from "lucide-react";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useState } from 'react';

export default function DashboardPage() {
  const { user, firebaseUser, error, logout, setupDemoProfile } = useAuth();
  const [isActivating, setIsActivating] = useState(false);

  const handleQuickActivate = async () => {
    setIsActivating(true);
    // تحديد الصلاحيات بناءً على البريد الإلكتروني للتجربة
    const isSpecialist = firebaseUser?.email?.includes('cards');
    if (isSpecialist) {
      await setupDemoProfile('Specialist', 'Cards', 'أخصائي معالجة البطائق');
    } else {
      await setupDemoProfile('Agent', 'Digital', 'موظف خدمة العملاء');
    }
    setIsActivating(false);
  };

  if (error === "MISSING_PROFILE" && firebaseUser) {
    return (
      <div className="max-w-2xl mx-auto mt-10 space-y-6 text-right" dir="rtl">
        <Card className="banking-card border-none shadow-2xl overflow-hidden">
          <CardHeader className="premium-gradient text-white p-8">
            <div className="flex items-center gap-4 justify-start">
              <div className="p-3 bg-white/20 rounded-2xl"><Database className="h-8 w-8" /></div>
              <div>
                <CardTitle className="text-2xl font-black">إعداد صلاحيات الوصول</CardTitle>
                <p className="text-white/70 text-sm mt-1">حسابك مسجل ولكن يحتاج لتعريف الصلاحيات الفنية</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
            <div className="bg-amber-50 border border-amber-100 p-6 rounded-[24px] text-amber-900 leading-relaxed font-medium">
              مرحباً بك! أنت الآن مسجل في نظام "سند" بنجاح. لكي نتمكن من عرض لوحة التحكم الصحيحة لك، يجب تفعيل ملفك الشخصي.
            </div>

            <div className="space-y-4">
              <Button 
                onClick={handleQuickActivate} 
                className="w-full h-16 rounded-[20px] bg-primary hover:bg-primary/90 text-white font-black text-lg shadow-xl shadow-primary/20 flex items-center justify-center gap-3"
                disabled={isActivating}
              >
                {isActivating ? <Loader2 className="animate-spin" /> : <Rocket className="w-6 h-6" />}
                تفعيل حسابي التجريبي الآن
              </Button>
              <p className="text-center text-xs text-slate-400 font-bold">هذا الإجراء سيقوم بإنشاء سجل صلاحياتك في Firestore تلقائياً</p>
            </div>

            <div className="pt-8 border-t border-slate-100">
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-4">بياناتك التقنية الحالية</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-[18px] border border-slate-100">
                  <p className="text-[10px] text-slate-400 font-bold mb-1">البريد الإلكتروني</p>
                  <p className="font-black text-slate-800 text-sm">{firebaseUser.email}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-[18px] border border-slate-100">
                  <p className="text-[10px] text-slate-400 font-bold mb-1">نوع الدخول</p>
                  <p className="font-black text-slate-800 text-sm">{firebaseUser.email?.includes('cards') ? 'أخصائي بطائق' : 'موظف خدمة عملاء'}</p>
                </div>
              </div>
            </div>

            <div className="pt-4 flex gap-4">
              <Button variant="ghost" className="flex-1 h-14 rounded-full font-bold text-slate-400" onClick={logout}>تسجيل الخروج</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto mt-20 space-y-4 text-right" dir="rtl">
        <Alert variant="destructive" className="rounded-[24px] border-none shadow-xl">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle className="font-bold">خطأ في النظام</AlertTitle>
          <AlertDescription className="mt-2 font-medium">{error}</AlertDescription>
        </Alert>
        <Button className="w-full h-12 rounded-full font-bold" variant="outline" onClick={logout}>العودة لتسجيل الدخول</Button>
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
          <div className="p-4 bg-slate-50 rounded-full w-fit mx-auto mb-6"><LayoutDashboard className="w-12 h-12 text-slate-300" /></div>
          <h2 className="text-xl font-black text-slate-800">صلاحيات غير معروفة</h2>
          <p className="text-slate-500 mt-2">يرجى مراجعة مدير النظام لتحديث دورك الوظيفي.</p>
          <Button variant="outline" onClick={logout} className="mt-8 w-full h-12 rounded-full font-bold">تسجيل الخروج</Button>
        </div>
      );
  }
}
