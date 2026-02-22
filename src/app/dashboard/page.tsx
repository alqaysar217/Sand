
"use client"

import { useAuth } from '@/lib/contexts/AuthContext';
import { AgentView } from '@/components/dashboard/AgentView';
import { SpecialistView } from '@/components/dashboard/SpecialistView';
import { AdminView } from '@/components/dashboard/AdminView';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
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
            {error}
            <br />
            تأكد من إنشاء مستند للمستخدم في مجموعة "users" داخل Firestore باستخدام الـ UID الخاص به.
          </AlertDescription>
        </Alert>
        <Button className="w-full" variant="outline" onClick={logout}>تسجيل الخروج</Button>
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
        <div className="p-12 text-center">
          <h2 className="text-xl font-bold">صلاحيات غير معروفة</h2>
          <p className="text-muted-foreground">يرجى مراجعة مدير النظام لتحديد دورك (Agent/Specialist/Admin).</p>
        </div>
      );
  }
}
