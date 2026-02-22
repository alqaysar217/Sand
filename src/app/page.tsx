"use client"

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Shield, Lock, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function Home() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    login(email);
  };

  if (user) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#F6F9FA]">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-primary rounded-lg"></div>
          <div className="h-4 w-32 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F9FA] flex flex-col">
      <nav className="p-6">
        <div className="max-w-7xl mx-auto flex items-center gap-2">
          <div className="bg-primary p-1.5 rounded-lg">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <span className="font-headline font-bold text-2xl text-primary tracking-tight">كونكت-ريزولف</span>
        </div>
      </nav>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl w-full items-center">
          <div className="hidden lg:block space-y-8">
            <h1 className="text-5xl font-bold text-primary leading-tight">
              ذكاء <span className="text-secondary">الحلول</span> المصرفية.
            </h1>
            <p className="text-xl text-muted-foreground">
              تمكين فرق الدعم الخاصة بك من خلال التوجيه الآلي، الردود المدعومة بالذكاء الاصطناعي، والتحليلات الفورية.
            </p>
            <div className="space-y-4">
              {[
                "وصول وصلاحيات مبنية على الأدوار",
                "توجيه آلي للأقسام المعنية",
                "مساعد استجابة مدعوم بالذكاء الاصطناعي",
                "تحليلات تشغيلية متقدمة"
              ].map((text) => (
                <div key={text} className="flex items-center gap-3">
                  <div className="bg-green-100 p-1 rounded-full">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  </div>
                  <span className="font-medium text-slate-700">{text}</span>
                </div>
              ))}
            </div>
          </div>

          <Card className="w-full max-w-md mx-auto shadow-xl border-t-4 border-t-primary">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold text-right">دخول الموظفين</CardTitle>
              <CardDescription className="text-right">أدخل بيانات الاعتماد الخاصة بك للمتابعة</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="block text-right">البريد الإلكتروني</Label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="name@bank.com" 
                      className="pr-10 text-right"
                      dir="ltr"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center flex-row-reverse">
                    <Label htmlFor="password">كلمة المرور</Label>
                    <a href="#" className="text-xs text-secondary hover:underline">نسيت كلمة المرور؟</a>
                  </div>
                  <div className="relative">
                    <Lock className="absolute right-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input 
                      id="password" 
                      type="password" 
                      placeholder="••••••••" 
                      className="pr-10 text-right"
                      dir="ltr"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required 
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full bg-primary text-white font-bold h-12">
                  تسجيل الدخول <ArrowLeft className="w-4 h-4 mr-2" />
                </Button>
              </form>

              <div className="mt-8 pt-6 border-t">
                <p className="text-xs font-bold text-muted-foreground uppercase mb-3 text-right">حسابات تجريبية:</p>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" className="text-[10px] px-1 justify-start overflow-hidden flex-row-reverse" onClick={() => setEmail('ahmed@bank.com')}>
                    <span className="truncate">موظف: ahmed@bank.com</span>
                  </Button>
                  <Button variant="outline" size="sm" className="text-[10px] px-1 justify-start overflow-hidden flex-row-reverse" onClick={() => setEmail('sarah@bank.com')}>
                    <span className="truncate">أخصائي: sarah@bank.com</span>
                  </Button>
                  <Button variant="outline" size="sm" className="text-[10px] px-1 justify-start overflow-hidden flex-row-reverse" onClick={() => setEmail('omar@bank.com')}>
                    <span className="truncate">تقني: omar@bank.com</span>
                  </Button>
                  <Button variant="outline" size="sm" className="text-[10px] px-1 justify-start overflow-hidden flex-row-reverse" onClick={() => setEmail('khalid@bank.com')}>
                    <span className="truncate">مدير: khalid@bank.com</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="p-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} أنظمة كونكت-ريزولف المصرفية. جميع الحقوق محفوظة.
      </footer>
    </div>
  );
}
