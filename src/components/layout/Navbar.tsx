
"use client"

import { useAuth } from '@/lib/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, Shield, Menu, PanelRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar"
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export function Navbar() {
  const { user, logout } = useAuth();
  const { toggleSidebar } = useSidebar();

  if (!user) return null;

  const logo = PlaceHolderImages.find(img => img.id === 'sanad-logo');

  const roleMap: Record<string, string> = {
    'Agent': 'موظف رفع بلاغات',
    'Specialist': 'أخصائي معالجة فنية',
    'Admin': 'المدير العام'
  };

  const deptMap: Record<string, string> = {
    'Cards': 'قسم البطائق',
    'Digital': 'خدمة العملاء',
    'Support': 'الكول سنتر',
    'Operations': 'غرفة القيادة والرقابة'
  };

  return (
    <header className="h-20 border-b bg-white flex items-center justify-between px-6 sticky top-0 z-50 shadow-sm">
      <div className="flex items-center gap-6">
        <Button variant="ghost" size="icon" onClick={toggleSidebar} className="hover:bg-slate-100">
          <PanelRight className="w-6 h-6 text-slate-600" />
        </Button>
        
        <div className="flex items-center gap-3">
          {logo && (
            <Image 
              src={logo.imageUrl} 
              alt="Sanad Logo" 
              width={40} 
              height={40} 
              className="rounded-lg shadow-sm"
              data-ai-hint={logo.imageHint}
            />
          )}
          <span className="font-headline font-bold text-2xl text-primary tracking-tight">سند</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-bold text-slate-900">{user.name}</p>
          <p className="text-xs text-muted-foreground font-medium">{deptMap[user.department] || user.department}</p>
        </div>
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-bold hidden md:inline-flex">
          {roleMap[user.role] || user.role}
        </Badge>
        <div className="w-px h-8 bg-slate-200 mx-2 hidden sm:block"></div>
        <Button variant="ghost" size="icon" onClick={logout} className="text-slate-500 hover:text-destructive hover:bg-red-50">
          <LogOut className="w-5 h-5 rotate-180" />
        </Button>
      </div>
    </header>
  );
}
