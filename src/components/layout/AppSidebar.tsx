
"use client"

import { useAuth } from '@/lib/contexts/AuthContext';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { useMemo, useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  PlusSquare, 
  Inbox, 
  BarChart3, 
  Users, 
  AlertCircle,
  Archive,
  Clock,
  Send,
  XCircle,
  FileText
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
  SidebarMenuBadge,
} from "@/components/ui/sidebar"
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export function AppSidebar() {
  const { user } = useAuth();
  const db = useFirestore();
  const [activeAction, setActiveAction] = useState('all');

  useEffect(() => {
    const handleSync = (e: any) => {
      const action = e.detail;
      if (['all', 'New', 'Pending', 'Escalated', 'Resolved', 'Rejected', 'new-ticket'].includes(action)) {
        setActiveAction(action);
      }
    };
    window.addEventListener('sidebar-nav', handleSync);
    return () => window.removeEventListener('sidebar-nav', handleSync);
  }, []);

  const ticketsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    if (user.role === 'Admin') {
      return query(collection(db, 'tickets'), orderBy('createdAt', 'desc'));
    } else if (user.role === 'Specialist') {
      return query(
        collection(db, 'tickets'),
        where('serviceType', '==', user.department),
        orderBy('createdAt', 'desc')
      );
    } else {
      return query(
        collection(db, 'tickets'),
        where('createdByAgentId', '==', user.id),
        orderBy('createdAt', 'desc')
      );
    }
  }, [db, user]);

  const { data: tickets } = useCollection(ticketsQuery);

  const counts = useMemo(() => {
    if (!tickets) return {};
    return {
      all: tickets.length,
      New: tickets.filter(t => t.status === 'New').length,
      Pending: tickets.filter(t => t.status === 'Pending').length,
      Escalated: tickets.filter(t => t.status === 'Escalated').length,
      Resolved: tickets.filter(t => t.status === 'Resolved').length,
      Rejected: tickets.filter(t => t.status === 'Rejected').length,
    };
  }, [tickets]);

  if (!user) return null;

  const logo = PlaceHolderImages.find(img => img.id === 'sanad-logo');

  const handleNav = (action: string) => {
    setActiveAction(action);
    window.dispatchEvent(new CustomEvent('sidebar-nav', { detail: action }));
  };

  const getNavItems = () => {
    if (user.role === 'Agent') {
      return [
        { title: 'كل البلاغات', icon: LayoutDashboard, action: 'all', count: counts.all, badgeColor: 'bg-primary' },
        { title: 'بلاغ جديد', icon: PlusSquare, action: 'new-ticket' },
        { title: 'جديد', icon: AlertCircle, action: 'New', count: counts.New, badgeColor: 'bg-blue-600' },
        { title: 'قيد المعالجة', icon: Clock, action: 'Pending', count: counts.Pending, badgeColor: 'bg-amber-500' },
        { title: 'محالة للأقسام', icon: Send, action: 'Escalated', count: counts.Escalated, badgeColor: 'bg-red-600' },
        { title: 'مرفوضة', icon: XCircle, action: 'Rejected', count: counts.Rejected, badgeColor: 'bg-slate-700' },
        { title: 'الأرشيف (تم الحل)', icon: Archive, action: 'Resolved', count: counts.Resolved, badgeColor: 'bg-green-600' },
      ];
    } else if (user.role === 'Specialist') {
      return [
        { title: 'محطة العمل', icon: Inbox, action: 'all', count: counts.all, badgeColor: 'bg-primary' },
        { title: 'تم الحل', icon: Archive, action: 'Resolved', count: counts.Resolved, badgeColor: 'bg-green-600' },
      ];
    } else {
      return [
        { title: 'الإحصائيات', icon: BarChart3, action: 'all' },
        { title: 'إدارة الموظفين', icon: Users, action: 'all' },
        { title: 'إعدادات النظام', icon: FileText, action: 'all' },
      ];
    }
  };

  return (
    <Sidebar className="border-l border-r-0 bg-white" side="right">
      <SidebarHeader className="p-8 border-b bg-primary/5">
        <div className="flex items-center gap-4">
          {logo && (
            <Image 
              src={logo.imageUrl} 
              alt="Sanad Logo" 
              width={48} 
              height={48} 
              className="rounded-[16px] shadow-lg border-2 border-white"
              data-ai-hint={logo.imageHint}
            />
          )}
          <span className="font-bold text-3xl text-primary tracking-tight">سند</span>
        </div>
      </SidebarHeader>
      <SidebarContent className="bg-white px-3 py-6 no-scrollbar">
        <SidebarGroup>
          <SidebarGroupLabel className="text-slate-400 font-bold px-4 py-4 mb-4 text-right text-[10px] uppercase tracking-[2px]">
            التنقل الذكي
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-2">
              {getNavItems().map((item) => {
                const isActive = activeAction === item.action;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      onClick={() => handleNav(item.action)}
                      className={`flex items-center gap-4 h-13 w-full px-5 justify-start text-right rounded-[18px] transition-all duration-300 ${
                        isActive 
                          ? 'bg-primary text-white shadow-lg' 
                          : 'hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      <span className="text-base font-bold">{item.title}</span>
                    </SidebarMenuButton>
                    {item.count !== undefined && item.count > 0 && (
                      <SidebarMenuBadge className={`left-4 right-auto min-w-[22px] h-[22px] flex items-center justify-center rounded-full text-[10px] font-black border-2 border-white shadow-md transition-all duration-300 ${
                        isActive ? 'bg-white text-primary' : `${item.badgeColor || 'bg-slate-100'} text-white`
                      }`}>
                        {item.count}
                      </SidebarMenuBadge>
                    )}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-8 border-t bg-slate-50/50 text-[10px] text-slate-400 text-center font-bold uppercase tracking-wider">
        سند المصرفي v2.5
      </SidebarFooter>
    </Sidebar>
  );
}
