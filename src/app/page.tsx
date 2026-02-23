
"use client"

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Shield, Lock, Mail, ArrowLeft, Loader2, Info, Copy, Check, Database, CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function Home() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [copied, setCopied] = useState(false);
  const { login, user, firebaseUser, loading, error, logout } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const logo = PlaceHolderImages.find(img => img.id === 'sanad-logo');

  useEffect(() => {
    // التوجه للداشبورد في حال وجود مستخدم وملف شخصي، أو وجود خطأ "ملف مفقود" لعرض التعليمات
    if ((user || error === "MISSING_PROFILE") && !loading) {
      router.push('/dashboard');
    }
  }, [user, error, loading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    try {
      await login(email, password);
      toast({
        title: "تم تسجيل الدخول",
        description: "مرحباً بك في نظام سند.",
      });
    } catch (error: any) {
      let message = "فشل تسجيل الدخول. يرجى التحقق من البيانات.";
      if (error.code === 'auth/invalid-credential') {
        message = "البريد الإلكتروني أو كلمة المرور غير صحيحة.";
      }
      
      toast({
        variant: "destructive",
        title: "خطأ في الدخول",
        description: message,
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const setDemoLogin = (email: string, pass: string) => {
    setEmail(email);
    setPassword(pass);
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
      <div className="w-full max-w-md space-y-8 animate-in fade-in zoom-in-95 duration-700">
        <div className="flex flex-col items-center gap-4 mb-8">
          <div className="relative">
            {logo && (
              <Image 
                src={logo.imageUrl} 
                alt="Logo" 
                width={90} 
                height={90} 
                className="rounded-[28px] shadow-2xl border-4 border-white"
                data-ai-hint={logo.imageHint}
              />
            )}
            <div className="absolute -bottom-2 -right-2 bg-accent p-2 rounded-full shadow-lg border-2 border-white">
              <Shield className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="text-center">
            <h1 className="text-4xl font-extrabold text-primary tracking-tight">سند</h1>
            <p className="text-slate-500 font-medium mt-1">بوابة الموظفين | نظام الإدارة المصرفية</p>
          </div>
        </div>

        <Card className="banking-card overflow-hidden">
          <CardHeader className="space-y-2 text-center bg-slate-50/30 pb-10 pt-8">
            <CardTitle className="text-2xl font-bold text-slate-800">تسجيل الدخول</CardTitle>
            <CardDescription className="text-slate-500">أدخل بياناتك الرسمية للوصول للنظام</CardDescription>
          </CardHeader>
          <CardContent className="pt-8 px-8 pb-10">
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2 text-right">
                <Label htmlFor="email" className="text-slate-600 font-bold mr-1">البريد الإلكتروني</Label>
                <div className="relative">
                  <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="name@bank.com" 
                    className="banking-input pr-12 text-right h-13"
                    dir="ltr"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required 
                  />
                </div>
              </div>
              <div className="space-y-2 text-right">
                <Label htmlFor="password" className="text-slate-600 font-bold mr-1">كلمة المرور</Label>
                <div className="relative">
                  <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="••••••••" 
                    className="banking-input pr-12 text-right h-13"
                    dir="ltr"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required 
                  />
                </div>
              </div>
              <Button type="submit" className="w-full banking-button premium-gradient text-white h-14 text-lg" disabled={isLoggingIn}>
                {isLoggingIn ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                  <>
                    <ArrowLeft className="w-5 h-5 ml-2" />
                    <span>دخول النظام</span>
                  </>
                )}
              </Button>
            </form>

            <div className="mt-10 pt-8 border-t border-slate-50">
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-4 text-center tracking-widest">خيارات الدخول السريع</p>
              <div className="grid grid-cols-1 gap-3">
                <Button variant="outline" className="justify-between h-auto py-4 px-5 rounded-[20px] border-slate-100 hover:bg-slate-50 transition-all group" onClick={() => setDemoLogin('cs.frontline@bank.com', 'CS_GUEST_99')}>
                  <Info className="h-5 w-5 text-secondary" />
                  <div className="text-right">
                    <p className="font-bold text-sm text-slate-800">موظف خدمة العملاء</p>
                    <p className="text-[10px] text-slate-400">إدارة البلاغات والمتابعة</p>
                  </div>
                </Button>
                <Button variant="outline" className="justify-between h-auto py-4 px-5 rounded-[20px] border-slate-100 hover:bg-slate-50 transition-all group" onClick={() => setDemoLogin('cards.ops@bank.com', 'CARDS_SPECIALIST_101')}>
                  <CreditCard className="h-5 w-5 text-primary" />
                  <div className="text-right">
                    <p className="font-bold text-sm text-slate-800">أخصائي معالجة البطائق</p>
                    <p className="text-[10px] text-slate-400">فحص البلاغات والرد الفني الذكي</p>
                  </div>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <footer className="text-center text-[10px] text-slate-400 pt-4 font-medium">
          © {new Date().getFullYear()} نظام سند المصرفي | النسخة الاحترافية 2.5
        </footer>
      </div>
    </div>
  );
}
