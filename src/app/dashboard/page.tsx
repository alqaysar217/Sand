"use client"

import { useAuth } from '@/lib/contexts/AuthContext';
import { AgentView } from '@/components/dashboard/AgentView';
import { SpecialistView } from '@/components/dashboard/SpecialistView';
import { AdminView } from '@/components/dashboard/AdminView';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, ShieldAlert } from "lucide-react";
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

  // توجيه المستخدم حسب دوره الوظيفي
  switch (user.role) {
    case 'Agent':
      // واجهة الموظف مفعلة بالكامل وجاهزة للفحص
      return <AgentView />;
    case 'Specialist':
      // واجهة الأخصائي مفعلة الآن للفحص
      return <SpecialistView />;
    case 'Admin':
      // واجهة المدير العام
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