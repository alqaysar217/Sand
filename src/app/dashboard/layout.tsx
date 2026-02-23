
"use client"

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/AppSidebar"
import { Navbar } from "@/components/layout/Navbar"
import { useAuth } from "@/lib/contexts/AuthContext"
import { Toaster } from "@/components/ui/toaster"
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { user, loading, error } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // لا تقم بإعادة التوجيه إذا كان هناك خطأ "ملف مفقود" لكي نتمكن من عرض رسالة الخطأ في صفحة Dashboard
    if (!loading && !user && !error) {
      router.push('/');
    }
  }, [user, loading, error, router]);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#F6F9FA]">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-primary rounded-lg"></div>
          <div className="h-4 w-32 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  // إذا كان هناك مستخدم ولكن بدون ملف شخصي، دع DashboardPage تتعامل مع العرض
  if (!user && !error) return null;

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
