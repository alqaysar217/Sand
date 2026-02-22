
"use client"

import { useAuth } from '@/lib/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function Navbar() {
  const { user, logout } = useAuth();

  if (!user) return null;

  const roleMap: Record<string, string> = {
    'Agent': 'موظف رفع بلاغات',
    'Specialist': 'أخصائي معالجة فنية',
    'Admin': 'المدير العام (بلخرم)'
  };

  const deptMap: Record<string, string> = {
    'Cards': 'قسم البطائق',
    'Digital': 'خدمة العملاء',
    'Support': 'الكول سنتر',
    'Operations': 'غرفة القيادة والرقابة'
  };

  return (
    <header className="h-16 border-b bg-white flex items-center justify-between px-6 sticky top-0 z-50">
      <div className="flex items-center gap-2">
        <div className="bg-primary p-1.5 rounded-lg">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <span className="font-headline font-bold text-xl text-primary tracking-tight">كونكت-ريزولف</span>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-left hidden sm:block text-right">
          <p className="text-sm font-semibold">{user.name}</p>
          <p className="text-xs text-muted-foreground">{deptMap[user.department] || user.department}</p>
        </div>
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          {roleMap[user.role] || user.role}
        </Badge>
        <Button variant="ghost" size="icon" onClick={logout} className="text-muted-foreground hover:text-destructive">
          <LogOut className="w-5 h-5 rotate-180" />
        </Button>
      </div>
    </header>
  );
}
