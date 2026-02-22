
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
  Clock
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
import { Shield } from 'lucide-react';

export function AppSidebar() {
  const { user, logout } = useAuth();
  if (!user) return null;

  const getNavItems = () => {
    switch (user.role) {
      case 'Agent':
        return [
          { title: 'الرئيسية', icon: LayoutDashboard, href: '/dashboard' },
          { title: 'بلاغ جديد', icon: PlusSquare, href: '/dashboard' },
          { title: 'سجل البلاغات', icon: History, href: '/dashboard' },
          { title: 'الأرشيف', icon: Archive, href: '/dashboard' },
        ];
      case 'Specialist':
        return [
          { title: 'محطة العمل', icon: Inbox, href: '/dashboard' },
          { title: 'المهام الواردة', icon: Clock, href: '/dashboard' },
          { title: 'بلاغات محلولة', icon: FileCheck, href: '/dashboard' },
        ];
      case 'Admin':
        return [
          { title: 'لوحة التحكم', icon: BarChart3, href: '/dashboard' },
          { title: 'تذاكر متأخرة', icon: AlertCircle, href: '/dashboard' },
          { title: 'إدارة الموظفين', icon: Users, href: '/dashboard' },
          { title: 'الإعدادات', icon: Settings, href: '/dashboard' },
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
            قائمة الوصول السريع
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {getNavItems().map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="flex-row-reverse hover:bg-slate-100 h-11">
                    <a href={item.href}>
                      <item.icon className="w-5 h-5 ml-3 mr-0 text-slate-500" />
                      <span className="text-sm font-medium">{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t bg-slate-50 text-[10px] text-muted-foreground text-center">
        نظام إدارة البلاغات v1.0
      </SidebarFooter>
    </Sidebar>
  );
}
