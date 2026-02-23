
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

  useEffect(() => {
    if (!loading && !firebaseUser && !user) {
      router.push('/');
    }
  }, [firebaseUser, user, loading, router]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <p className="font-black text-slate-400 animate-pulse">جاري جلب ملفك المصرفي...</p>
      </div>
    );
  }

  if (!firebaseUser && !user) return null;

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-10 text-center space-y-6">
        <ShieldAlert className="h-16 w-16 text-red-600" />
        <h2 className="text-2xl font-black">صلاحيات مفقودة</h2>
        <Button onClick={() => router.push('/')} className="rounded-full font-black">العودة للرئيسية</Button>
      </div>
    );
  }

  // التوجيه بناءً على الدور والقسم
  // الكول سنتر يذهب لـ AgentView (للرفع)
  // البطائق، خدمة العملاء، ومشاكل التطبيق يذهبون لـ SpecialistView (للمعالجة)
  return (
    <div className="animate-in fade-in duration-700">
      {user.role === 'Admin' && <AdminView />}
      {user.role === 'Agent' && user.department === 'Support' && <AgentView />}
      {user.role === 'Specialist' && (user.department === 'Cards' || user.department === 'Digital' || user.department === 'App') && <SpecialistView />}
    </div>
  );
}
