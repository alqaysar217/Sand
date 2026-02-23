
"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, ArrowLeft, MonitorSmartphone, Headset, CreditCard, UserCog, Loader2, Lock } from 'lucide-react';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export default function Home() {
  const router = useRouter();
  const { login, setupDemoProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);
  const logo = PlaceHolderImages.find(img => img.id === 'sanad-logo');

  const employees = [
    { name: 'المدير العام', email: 'admin.bank@bank.com', role: 'Admin', dept: 'Operations', icon: UserCog },
    { name: 'الأخصائي الفني', email: 'cards.ops@bank.com', role: 'Specialist', dept: 'Cards', icon: CreditCard },
    { name: 'موظف الاتصال', email: 'callcenter.agent@bank.com', role: 'Agent', dept: 'Support', icon: Headset },
    { name: 'خدمة العملاء الرقمية', email: 'cs.digital@bank.com', role: 'Agent', dept: 'Digital', icon: MonitorSmartphone },
  ];

  const handleQuickLogin = async (emp: typeof employees[0]) => {
    setLoading(emp.email);
    try {
      await login(emp.email, 'password123');
      await setupDemoProfile(emp.role as any, emp.dept as any, emp.name);
      router.push('/dashboard');
    } catch (error) {
      toast({
        variant: "destructive",
        title: "خطأ في الدخول",
        description: "يرجى المحاولة مرة أخرى أو التحقق من اتصال الإنترنت."
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6FA] flex flex-col items-center justify-center p-6 font-body" dir="rtl">
      <div className="w-full max-w-2xl space-y-8 animate-in fade-in zoom-in-95 duration-700">
        <div className="flex flex-col items-center gap-4 mb-4">
          <div className="relative">
            {logo && (
              <Image 
                src={logo.imageUrl} 
                alt="Logo" 
                width={80} 
                height={80} 
                className="rounded-[24px] shadow-2xl border-4 border-white"
                data-ai-hint={logo.imageHint}
              />
            )}
            <div className="absolute -bottom-1 -right-1 bg-accent p-1.5 rounded-full shadow-lg border-2 border-white">
              <Shield className="w-3.5 h-3.5 text-white" />
            </div>
          </div>
          <div className="text-center">
            <h1 className="text-4xl font-black text-primary tracking-tight">سند</h1>
            <p className="text-slate-500 font-bold mt-1 text-sm">نظام إدارة العمليات المصرفية الذكي</p>
          </div>
        </div>

        <Card className="banking-card overflow-hidden border-none shadow-2xl bg-white">
          <CardHeader className="premium-gradient text-white p-10 text-center">
            <CardTitle className="text-2xl font-black">بوابة تسجيل الدخول الموحدة</CardTitle>
            <CardDescription className="text-white/70 font-bold mt-2">
              اختر هويتك الوظيفية للدخول المباشر إلى محطة العمل الخاصة بك
            </CardDescription>
          </CardHeader>
          <CardContent className="p-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {employees.map((emp) => (
                <Button 
                  key={emp.email}
                  variant="outline" 
                  disabled={!!loading}
                  onClick={() => handleQuickLogin(emp)}
                  className="h-28 flex flex-col gap-2 rounded-[24px] border-slate-100 hover:border-primary hover:bg-primary/5 transition-all group relative overflow-hidden"
                >
                  {loading === emp.email ? (
                    <Loader2 className="h-8 w-8 text-primary animate-spin" />
                  ) : (
                    <emp.icon className="h-8 w-8 text-primary group-hover:scale-110 transition-transform" />
                  )}
                  <div className="text-right">
                    <span className="block font-black text-slate-800">{emp.name}</span>
                    <span className="text-[10px] text-slate-400 font-bold">{emp.email}</span>
                  </div>
                  {loading === emp.email && (
                    <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
                      <span className="text-[10px] font-black text-primary animate-pulse">جاري التحقق...</span>
                    </div>
                  )}
                </Button>
              ))}
            </div>
            
            <div className="mt-8 pt-6 border-t border-slate-50 flex flex-col items-center gap-4">
               <div className="flex items-center gap-2 text-slate-400">
                  <Lock className="w-3 h-3" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">نظام محمي وآمن</span>
               </div>
               <p className="text-[10px] text-slate-400 font-bold text-center leading-relaxed">
                 تخضع كافة العمليات في نظام سند للرقابة المباشرة من قبل المدير العام.<br/>
                 يرجى استخدام حسابك الشخصي فقط.
               </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
