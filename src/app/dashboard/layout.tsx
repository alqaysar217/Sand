
"use client"

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/AppSidebar"
import { Navbar } from "@/components/layout/Navbar"
import { useAuth } from "@/lib/contexts/AuthContext"
import { Toaster } from "@/components/ui/toaster"

/**
 * تم تعديل التخطيط لتعطيل إعادة التوجيه التلقائي.
 * هذا يسمح للمستخدم بالوصول للوحة القيادة حتى لو فشل الاتصال بـ Firebase.
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-[#F6F9FA]">
        <Navbar />
        <main className="p-6 md:p-8">
          {children}
        </main>
      </SidebarInset>
      <Toaster />
    </SidebarProvider>
  );
}
