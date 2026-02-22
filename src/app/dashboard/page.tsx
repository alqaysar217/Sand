
"use client"

import { useAuth } from '@/lib/contexts/AuthContext';
import { AgentView } from '@/components/dashboard/AgentView';
import { SpecialistView } from '@/components/dashboard/SpecialistView';
import { AdminView } from '@/components/dashboard/AdminView';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Construction, ShieldAlert } from "lucide-react";
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
          </AlertDescription>
        </Alert>
        <Button className="w-full" variant="outline" onClick={logout}>تسجيل الخروج</Button>
      </div>
    );
  }

  if (!user) return null;

  // توجيه المستخدم حسب دوره الوظيفي مع تعطيل الواجهات مؤقتاً للفحص
  switch (user.role) {
    case 'Agent':
      return (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-xl border-2 border-dashed border-slate-200 min-h-[400px]">
          <Construction className="w-16 h-16 text-amber-500 mb-4" />
          <h2 className="text-2xl font-bold text-primary">واجهة الموظف (متوقفة مؤقتاً)</h2>
          <p className="text-muted-foreground mt-2 max-w-md">
            تم إيقاف هذا القسم مؤقتاً لتمكينك من فحص واجهة "المدير العام" دون تداخل.
          </p>
          <Button variant="outline" onClick={logout} className="mt-8">تسجيل الخروج</Button>
        </div>
      );
    case 'Specialist':
      return (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-xl border-2 border-dashed border-slate-200 min-h-[400px]">
          <ShieldAlert className="w-16 h-16 text-blue-500 mb-4" />
          <h2 className="text-2xl font-bold text-primary">واجهة الأخصائي (متوقفة مؤقتاً)</h2>
          <p className="text-muted-foreground mt-2 max-w-md">
            تم إيقاف هذا القسم مؤقتاً لتمكينك من فحص واجهة "المدير العام" أولاً.
          </p>
          <Button variant="outline" onClick={logout} className="mt-8">تسجيل الخروج</Button>
        </div>
      );
    case 'Admin':
      return <AdminView />;
    default:
      return (
        <div className="p-12 text-center">
          <h2 className="text-xl font-bold">صلاحيات غير معروفة</h2>
          <Button variant="outline" onClick={logout} className="mt-4">تسجيل الخروج</Button>
        </div>
      );
  }
}
