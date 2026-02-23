"use client"

import { useAuth } from '@/lib/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, PanelRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useSidebar } from "@/components/ui/sidebar"
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
    <header className="h-20 bg-white/80 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-50 shadow-[0_2px_15px_rgba(0,0,0,0.02)]">
      <div className="flex items-center gap-6">
        <Button variant="ghost" size="icon" onClick={toggleSidebar} className="hover:bg-slate-100 rounded-full h-11 w-11">
          <PanelRight className="w-6 h-6 text-slate-600" />
        </Button>
        
        <div className="flex items-center gap-4">
          {logo && (
            <Image 
              src={logo.imageUrl} 
              alt="Sanad Logo" 
              width={44} 
              height={44} 
              className="rounded-[14px] shadow-sm border border-slate-100"
              data-ai-hint={logo.imageHint}
            />
          )}
          <span className="font-bold text-2xl text-primary tracking-tight">سند</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-bold text-slate-900 leading-none">{user.name}</p>
          <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-wider">{deptMap[user.department] || user.department}</p>
        </div>
        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/10 rounded-full px-4 py-1 font-bold hidden md:inline-flex">
          {roleMap[user.role] || user.role}
        </Badge>
        <div className="w-px h-10 bg-slate-100 mx-2 hidden sm:block"></div>
        <Button variant="ghost" size="icon" onClick={logout} className="text-slate-400 hover:text-destructive hover:bg-red-50 rounded-full h-11 w-11">
          <LogOut className="w-5 h-5 rotate-180" />
        </Button>
      </div>
    </header>
  );
}