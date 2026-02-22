
"use client"

import { useAuth } from '@/lib/contexts/AuthContext';
import { AgentView } from '@/components/dashboard/AgentView';
import { SpecialistView } from '@/components/dashboard/SpecialistView';
import { AdminView } from '@/components/dashboard/AdminView';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Construction } from "lucide-react";
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  const { user, error, logout } = useAuth();

  if (error) {
    return (
      <div className="max-w-md mx-auto mt-20 space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="text-right">خطأ في التهيئة</AlertTitle>
          <AlertDescription className="text-right">
            {error === "MISSING_PROFILE" ? "حسابك موجود ولكن ملف الصلاحيات في Firestore غير مكتمل." : error}
            <br />
            تأكد من اتباع دليل الربط الموضح في الصفحة الرئيسية.
          </AlertDescription>
        </Alert>
        <Button className="w-full" variant="outline" onClick={logout}>تسجيل الخروج</Button>
      </div>
    );
  }

  if (!user) return null;

  // توجيه المستخدم حسب دوره الوظيفي
  switch (user.role) {
    case 'Agent':
      // الإبقاء على واجهة الموظف في وضع الصيانة لتمكين المستخدم من فحص بقية الأقسام
      return (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-xl border-2 border-dashed border-slate-200 min-h-[400px]">
          <Construction className="w-16 h-16 text-amber-500 mb-4" />
          <h2 className="text-2xl font-bold text-primary">واجهة الكول سنتر (قيد الصيانة المؤقتة)</h2>
          <p className="text-muted-foreground mt-2 max-w-md">
            تم إيقاف هذا القسم مؤقتاً لتمكينك من فحص واجهات "المدير العام" و "الأخصائي الفني" دون تداخل في الصلاحيات.
          </p>
          <div className="flex gap-4 mt-8">
            <Button variant="outline" onClick={logout}>تسجيل الخروج للدخول بحساب آخر</Button>
          </div>
        </div>
      );
    case 'Specialist':
      return <SpecialistView />;
    case 'Admin':
      return <AdminView />;
    default:
      return (
        <div className="p-12 text-center">
          <h2 className="text-xl font-bold">صلاحيات غير معروفة</h2>
          <p className="text-muted-foreground">يرجى مراجعة مدير النظام لتحديد دورك بشكل صحيح.</p>
          <Button variant="outline" onClick={logout} className="mt-4">تسجيل الخروج</Button>
        </div>
      );
  }
}
