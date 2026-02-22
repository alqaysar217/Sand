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
          { title: 'New Ticket', icon: PlusSquare, href: '#new' },
          { title: 'My Active Tickets', icon: History, href: '#active' },
          { title: 'Archive', icon: History, href: '#archive' },
        ];
      case 'Specialist':
        return [
          { title: 'Incoming Tasks', icon: Inbox, href: '#tasks' },
          { title: 'In Progress', icon: History, href: '#progress' },
          { title: 'Resolved', icon: History, href: '#resolved' },
        ];
      case 'Admin':
        return [
          { title: 'Analytics', icon: BarChart3, href: '#stats' },
          { title: 'Overdue Tickets', icon: AlertCircle, href: '#overdue' },
          { title: 'User Management', icon: Users, href: '#users' },
          { title: 'System Logs', icon: Settings, href: '#logs' },
        ];
      default:
        return [];
    }
  };

  return (
    <Sidebar className="border-r">
      <SidebarContent className="bg-white">
        <SidebarGroup>
          <SidebarGroupLabel className="text-primary font-bold px-4 py-2 mt-2">
            MAIN MENU
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <a href="/dashboard">
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Dashboard Home</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {getNavItems().map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.href}>
                      <item.icon className="w-4 h-4" />
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