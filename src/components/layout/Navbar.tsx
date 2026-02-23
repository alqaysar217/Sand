"use client"

import { useAuth } from '@/lib/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, PanelRight, Sun, Moon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useSidebar } from "@/components/ui/sidebar"
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useState, useEffect } from 'react';

export function Navbar() {
  const { user, logout } = useAuth();
  const { toggleSidebar } = useSidebar();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // Check local storage or system preference
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const isDark = document.documentElement.classList.contains('dark');
    
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    } else if (isDark) {
      setTheme('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

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
    <header className="h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-50 shadow-[0_2px_15px_rgba(0,0,0,0.02)] border-b dark:border-slate-800">
      <div className="flex items-center gap-6">
        <Button variant="ghost" size="icon" onClick={toggleSidebar} className="hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full h-11 w-11">
          <PanelRight className="w-6 h-6 text-slate-600 dark:text-slate-400" />
        </Button>
        
        <div className="flex items-center gap-4">
          {logo && (
            <Image 
              src={logo.imageUrl} 
              alt="Sanad Logo" 
              width={44} 
              height={44} 
              className="rounded-[14px] shadow-sm border border-slate-100 dark:border-slate-800"
              data-ai-hint={logo.imageHint}
            />
          )}
          <span className="font-bold text-2xl text-primary dark:text-white tracking-tight">سند</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-bold text-slate-900 dark:text-white leading-none">{user.name}</p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold mt-1 uppercase tracking-wider">{deptMap[user.department] || user.department}</p>
        </div>
        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/10 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-900/30 rounded-full px-4 py-1 font-bold hidden md:inline-flex">
          {roleMap[user.role] || user.role}
        </Badge>
        <div className="w-px h-10 bg-slate-100 dark:bg-slate-800 mx-2 hidden sm:block"></div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleTheme} 
            className="text-slate-400 hover:text-primary hover:bg-primary/5 dark:hover:bg-slate-800 rounded-full h-11 w-11 transition-all"
            title={theme === 'light' ? 'الوضع الداكن' : 'الوضع الفاتح'}
          >
            {theme === 'light' ? (
              <Moon className="w-5 h-5" />
            ) : (
              <Sun className="w-5 h-5 text-yellow-500" />
            )}
          </Button>

          <Button 
            variant="ghost" 
            size="icon" 
            onClick={logout} 
            className="text-slate-400 hover:text-destructive hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full h-11 w-11"
            title="تسجيل الخروج"
          >
            <LogOut className="w-5 h-5 rotate-180" />
          </Button>
        </div>
      </div>
    </header>
  );
}