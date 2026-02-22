"use client"

import { useAuth } from '@/lib/contexts/AuthContext';
import { 
  LayoutDashboard, 
  PlusSquare, 
  History, 
  Inbox, 
  BarChart3, 
  Users, 
  Settings,
  AlertCircle,
  FileCheck,
  Archive,
  Clock,
  Shield
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar"

export function AppSidebar() {
  const { user } = useAuth();
  if (!user) return null;

  // إرسال حدث مخصص للتحكم في الواجهة بدلاً من إعادة تحميل الصفحة
  const handleNav = (action: string) => {
    window.dispatchEvent(new CustomEvent('sidebar-nav', { detail: action }));
  };

  const getNavItems = () => {
    switch (user.role) {
      case 'Agent':
        return [
          { title: 'الرئيسية (السجل)', icon: LayoutDashboard, action: 'home' },
          { title: 'رفع بلاغ جديد', icon: PlusSquare, action: 'new-ticket' },
          { title: 'البلاغات المحالة', icon: History, action: 'home' }, // سنستخدم الفلتر داخل الواجهة
          { title: 'الأرشيف المحلول', icon: Archive, action: 'home' },
        ];
      case 'Specialist':
        return [
          { title: 'محطة العمل', icon: Inbox, action: 'home' },
          { title: 'المهام الواردة', icon: Clock, action: 'home' },
          { title: 'البلاغات المرفوضة', icon: AlertCircle, action: 'home' },
        ];
      case 'Admin':
        return [
          { title: 'لوحة التحكم', icon: BarChart3, action: 'home' },
          { title: 'تذاكر متأخرة', icon: AlertCircle, action: 'home' },
          { title: 'إدارة الموظفين', icon: Users, action: 'home' },
        ];
      default:
        return [];
    }
  };

  return (
    <Sidebar className="border-l border-r-0" side="right">
      <SidebarHeader className="p-4 border-b bg-primary/5">
        <div className="flex items-center gap-2 justify-end">
          <span className="font-bold text-primary">كونكت-ريزولف</span>
          <Shield className="w-5 h-5 text-primary" />
        </div>
      </SidebarHeader>
      <SidebarContent className="bg-white">
        <SidebarGroup>
          <SidebarGroupLabel className="text-primary font-bold px-4 py-2 mt-2 text-right">
            لوحة الوصول السريع
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {getNavItems().map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    onClick={() => handleNav(item.action)}
                    className="flex-row-reverse hover:bg-slate-100 h-11 w-full"
                  >
                    <item.icon className="w-5 h-5 ml-3 mr-0 text-slate-500" />
                    <span className="text-sm font-medium">{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t bg-slate-50 text-[10px] text-muted-foreground text-center">
        نظام إدارة البلاغات المصرفي v1.2
      </SidebarFooter>
    </Sidebar>
  );
}
