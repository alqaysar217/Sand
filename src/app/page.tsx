
"use client"

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Shield, Lock, Mail, ArrowLeft, Loader2, CreditCard, Headset, UserCog, MonitorSmartphone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function Home() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password123');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { login, user, loading, error } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const logo = PlaceHolderImages.find(img => img.id === 'sanad-logo');

  useEffect(() => {
    // التوجه للوحة القيادة فور تحقق هوية المستخدم أو حاجته للتفعيل
    if ((user || error === "MISSING_PROFILE") && !loading) {
      router.push('/dashboard');
    }
  }, [user, error, loading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    try {
      await login(email, password);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "خطأ في الدخول",
        description: "تأكد من البريد الإلكتروني أو حاول لاحقاً.",
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const setDemoLogin = (email: string) => {
    setEmail(email);
    setPassword('password123');
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#F4F6FA]">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
             <div className="w-10 h-10 bg-primary rounded-[12px] animate-spin"></div>
          </div>
          <div className="h-4 w-32 bg-slate-200 rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F6FA] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-lg space-y-8 animate-in fade-in zoom-in-95 duration-700">
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

        <Card className="banking-card overflow-hidden border-none shadow-2xl">
          <CardHeader className="space-y-2 text-center bg-slate-50/50 pb-8 pt-8 border-b border-slate-100">
            <CardTitle className="text-2xl font-black text-slate-800">تسجيل الدخول الآمن</CardTitle>
            <CardDescription className="text-slate-400 font-medium">أدخل بيانات الهوية الوظيفية للوصول</CardDescription>
          </CardHeader>
          <CardContent className="pt-8 px-10 pb-10">
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2 text-right">
                <Label className="text-slate-600 font-bold mr-1 text-xs">البريد الإلكتروني الرسمي</Label>
                <div className="relative">
                  <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input 
                    type="email" 
                    placeholder="user@bank.com" 
                    className="banking-input pr-12 text-right h-12"
                    dir="ltr"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required 
                  />
                </div>
              </div>
              <div className="space-y-2 text-right">
                <Label className="text-slate-600 font-bold mr-1 text-xs">كلمة المرور</Label>
                <div className="relative">
                  <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input 
                    type="password" 
                    placeholder="••••••••" 
                    className="banking-input pr-12 text-right h-12"
                    dir="ltr"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required 
                  />
                </div>
              </div>
              <Button type="submit" className="w-full banking-button premium-gradient text-white h-12 text-lg font-black mt-2" disabled={isLoggingIn}>
                {isLoggingIn ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>
                    <ArrowLeft className="w-5 h-5 ml-2" />
                    <span>دخول النظام</span>
                  </>
                )}
              </Button>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-50">
              <p className="text-[10px] font-black text-slate-400 uppercase mb-4 text-center tracking-[0.2em]">بوابات الدخول السريع</p>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="flex flex-col h-auto py-4 px-3 rounded-[20px] border-slate-100 hover:bg-slate-50 transition-all gap-2" onClick={() => setDemoLogin('cs.digital@bank.com')}>
                  <MonitorSmartphone className="h-5 w-5 text-accent" />
                  <span className="font-bold text-xs text-slate-800">الخدمات الرقمية</span>
                </Button>
                <Button variant="outline" className="flex flex-col h-auto py-4 px-3 rounded-[20px] border-slate-100 hover:bg-slate-50 transition-all gap-2" onClick={() => setDemoLogin('callcenter.agent@bank.com')}>
                  <Headset className="h-5 w-5 text-secondary" />
                  <span className="font-bold text-xs text-slate-800">الكول سنتر</span>
                </Button>
                <Button variant="outline" className="flex flex-col h-auto py-4 px-3 rounded-[20px] border-slate-100 hover:bg-slate-50 transition-all gap-2" onClick={() => setDemoLogin('cards.ops@bank.com')}>
                  <CreditCard className="h-5 w-5 text-primary" />
                  <span className="font-bold text-xs text-slate-800">قسم البطائق</span>
                </Button>
                <Button variant="outline" className="flex flex-col h-auto py-4 px-3 rounded-[20px] border-slate-100 hover:bg-slate-50 transition-all gap-2" onClick={() => setDemoLogin('admin.bank@bank.com')}>
                  <UserCog className="h-5 w-5 text-red-600" />
                  <span className="font-bold text-xs text-slate-800">المدير العام</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
