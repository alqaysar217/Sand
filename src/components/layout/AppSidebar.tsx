
"use client"

import { useAuth } from '@/lib/contexts/AuthContext';
import { 
  LayoutDashboard, 
  PlusSquare, 
  Inbox, 
  BarChart3, 
  Users, 
  AlertCircle,
  Archive,
  Clock,
  Shield,
  FileText,
  XCircle,
  Send
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
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export function AppSidebar() {
  const { user } = useAuth();
  if (!user) return null;

  const logo = PlaceHolderImages.find(img => img.id === 'sanad-logo');

  // إرسال حدث مخصص للتحكم في الواجهة
  const handleNav = (action: string) => {
    window.dispatchEvent(new CustomEvent('sidebar-nav', { detail: action }));
  };

  const getNavItems = () => {
    switch (user.role) {
      case 'Agent':
        return [
          { title: 'الرئيسية (الكل)', icon: LayoutDashboard, action: 'home' },
          { title: 'رفع بلاغ جديد', icon: PlusSquare, action: 'new-ticket' },
          { title: 'بلاغات قيد العمل', icon: Clock, action: 'Pending' },
          { title: 'البلاغات المحالة', icon: Send, action: 'Escalated' },
          { title: 'بلاغات مرفوضة', icon: XCircle, action: 'Rejected' },
          { title: 'الأرشيف (تم الحل)', icon: Archive, action: 'Resolved' },
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
      <SidebarHeader className="p-6 border-b bg-primary/5">
        <div className="flex items-center gap-3">
          {logo && (
            <Image 
              src={logo.imageUrl} 
              alt="Sanad Logo" 
              width={32} 
              height={32} 
              className="rounded-lg shadow-sm"
              data-ai-hint={logo.imageHint}
            />
          )}
          <span className="font-bold text-2xl text-primary">سند</span>
        </div>
      </SidebarHeader>
      <SidebarContent className="bg-white">
        <SidebarGroup>
          <SidebarGroupLabel className="text-primary font-bold px-4 py-4 mb-2 text-right text-sm">
            لوحة التحكم السريع
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {getNavItems().map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    onClick={() => handleNav(item.action)}
                    className="flex items-center gap-3 hover:bg-slate-100 h-12 w-full px-4 justify-start text-right"
                  >
                    <item.icon className="w-5 h-5 text-slate-500" />
                    <span className="text-base font-medium">{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-6 border-t bg-slate-50 text-[11px] text-muted-foreground text-center font-medium">
        نظام سند المصرفي لإدارة البلاغات v2.5
      </SidebarFooter>
    </Sidebar>
  );
}
