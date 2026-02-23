
"use client"

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/AppSidebar"
import { Navbar } from "@/components/layout/Navbar"
import { useAuth } from "@/lib/contexts/AuthContext"
import { Toaster } from "@/components/ui/toaster"
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { firebaseUser, loading, error } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // التوجه لصفحة الدخول فقط في حال انقطاع الجلسة تماماً
    if (!loading && !firebaseUser && !error) {
      router.push('/');
    }
  }, [firebaseUser, loading, error, router]);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#F6F9FA]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <div className="font-black text-primary animate-pulse text-lg">سند | جاري تأمين الاتصال...</div>
        </div>
      </div>
    );
  }

  // نسمح بعرض المحتوى إذا كان هناك مستخدم فيربيس، حتى لو الملف في طور الإنشاء
  if (!firebaseUser && !error) return null;

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-[#F6F9FA]">
        <Navbar />
        <main className="p-6 md:p-8">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DashboardContent>{children}</DashboardContent>
      <Toaster />
    </>
  );
}
