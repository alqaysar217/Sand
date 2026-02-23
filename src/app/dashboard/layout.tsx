
"use client"

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/AppSidebar"
import { Navbar } from "@/components/layout/Navbar"
import { useAuth } from "@/lib/contexts/AuthContext"
import { Toaster } from "@/components/ui/toaster"
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from "lucide-react";

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { user, firebaseUser, loading, error } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // التوجه لصفحة الدخول فقط إذا لم يكن هناك مستخدم نهائياً وبدون أخطاء تفعيل
    if (!loading && !firebaseUser && !error) {
      router.push('/');
    }
  }, [firebaseUser, loading, error, router]);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#F6F9FA]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <div className="font-black text-primary animate-pulse">سند | جاري التحميل...</div>
        </div>
      </div>
    );
  }

  // السماح بعرض صفحة التفعيل التلقائي في حال كان الملف مفقوداً
  if (error === "MISSING_PROFILE") {
    return <main className="min-h-screen bg-[#F6F9FA]">{children}</main>;
  }

  if (!firebaseUser && !error) return null;
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
