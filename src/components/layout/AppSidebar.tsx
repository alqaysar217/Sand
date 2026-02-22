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
  AlertCircle
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
} from "@/components/ui/sidebar"

export function AppSidebar() {
  const { user } = useAuth();
  if (!user) return null;

  const getNavItems = () => {
    switch (user.role) {
      case 'Agent':
        return [
          { title: 'تذكرة جديدة', icon: PlusSquare, href: '#new' },
          { title: 'تذاكري النشطة', icon: History, href: '#active' },
          { title: 'الأرشيف', icon: History, href: '#archive' },
        ];
      case 'Specialist':
        return [
          { title: 'المهام الواردة', icon: Inbox, href: '#tasks' },
          { title: 'قيد المعالجة', icon: History, href: '#progress' },
          { title: 'تم الحل', icon: History, href: '#resolved' },
        ];
      case 'Admin':
        return [
          { title: 'التحليلات', icon: BarChart3, href: '#stats' },
          { title: 'تذاكر متأخرة', icon: AlertCircle, href: '#overdue' },
          { title: 'إدارة المستخدمين', icon: Users, href: '#users' },
          { title: 'سجلات النظام', icon: Settings, href: '#logs' },
        ];
      default:
        return [];
    }
  };

  return (
    <Sidebar className="border-l border-r-0" side="right">
      <SidebarContent className="bg-white">
        <SidebarGroup>
          <SidebarGroupLabel className="text-primary font-bold px-4 py-2 mt-2 text-right">
            القائمة الرئيسية
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild className="flex-row-reverse">
                  <a href="/dashboard">
                    <LayoutDashboard className="w-4 h-4 ml-2 mr-0" />
                    <span>الرئيسية</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {getNavItems().map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="flex-row-reverse">
                    <a href={item.href}>
                      <item.icon className="w-4 h-4 ml-2 mr-0" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
