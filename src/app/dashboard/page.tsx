"use client"

import { useEffect } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { AgentView } from '@/components/dashboard/AgentView';
import { SpecialistView } from '@/components/dashboard/SpecialistView';
import { AdminView } from '@/components/dashboard/AdminView';
import { Loader2, ShieldAlert } from "lucide-react";
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const { user, loading, firebaseUser } = useAuth();
  const router = useRouter();

  // معالجة التوجيه في useEffect لتجنب أخطاء ريندر React
  useEffect(() => {
    if (!loading && !firebaseUser && !user) {
      router.push('/');
    }
  }, [firebaseUser, user, loading, router]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <p className="font-black text-slate-400 animate-pulse">جاري جلب ملفك الشخصي...</p>
      </div>
    );
  }

  if (!firebaseUser && !user) {
    return null;
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-10 text-center space-y-6">
        <div className="p-6 bg-red-50 rounded-full">
          <ShieldAlert className="h-16 w-16 text-red-600" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-slate-800">صلاحيات مفقودة</h2>
          <p className="text-slate-500 font-bold max-w-md mx-auto">
            تم تسجيل دخولك ولكن لم يتم العثور على ملفك الشخصي في قاعدة البيانات. يرجى العودة للرئيسية وإعادة المحاولة.
          </p>
        </div>
        <Button onClick={() => router.push('/')} className="rounded-full font-black px-10 h-12">
          العودة لصفحة الدخول
        </Button>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-700">
      {user.role === 'Admin' && <AdminView />}
      {user.role === 'Agent' && <AgentView />}
      {user.role === 'Specialist' && <SpecialistView />}
    </div>
  );
}
