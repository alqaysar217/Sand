
"use client"

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Shield, Lock, Mail, ArrowLeft, CheckCircle2, Loader2, Info, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function Home() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [copied, setCopied] = useState(false);
  const { login, user, firebaseUser, loading, error, logout } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (user && !loading) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    try {
      await login(email, password);
      toast({
        title: "تم تسجيل الدخول",
        description: "مرحباً بك في نظام كونكت-ريزولف.",
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

  const copyUid = () => {
    if (firebaseUser) {
      navigator.clipboard.writeText(firebaseUser.uid);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: "تم النسخ", description: "تم نسخ المعرف UID بنجاح." });
    }
  };

  const setDemoLogin = (email: string, pass: string) => {
    setEmail(email);
    setPassword(pass);
  };

  if (loading) {
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
              نظام <span className="text-secondary">بلاغات</span> المصرفي.
            </h1>
            <p className="text-xl text-muted-foreground">
              تمكين فرق الدعم والمديرين من متابعة الشكاوى وحلها بأعلى معايير الجودة والأمان.
            </p>
            <div className="space-y-4">
              {[
                "تحليلات غرفة القيادة والرقابة (للمدير)",
                "معالجة فنية متقدمة (لقسم البطائق)",
                "رفع سريع للبلاغات (للكول سنتر)",
                "واجهة فروع مدعومة بالمرفقات (لخدمة العملاء)"
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

          <div className="space-y-4">
            {error === "MISSING_PROFILE" && firebaseUser && (
              <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-4 border-2 shadow-lg">
                <Info className="h-5 w-5" />
                <AlertTitle className="text-right font-bold text-lg mb-2">خطوة أخيرة مطلوبة لإتمام الإعداد الحقيقي</AlertTitle>
                <AlertDescription className="text-right space-y-4">
                  <p>تم تسجيل دخولك بنجاح، ولكن نحتاج الآن لربط هذا الحساب بملف تعريفي في قاعدة بيانات Firestore لتحديد صلاحياتك.</p>
                  
                  <div className="bg-white/90 p-4 rounded-md space-y-3 text-sm border-r-4 border-primary shadow-inner">
                    <p className="font-bold text-primary">يرجى إنشاء مستند في Firestore بالتفاصيل التالية:</p>
                    
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between gap-2 border p-2 rounded bg-slate-50">
                        <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-slate-200" onClick={copyUid}>
                          {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                        </Button>
                        <code className="text-primary font-mono text-xs break-all selection:bg-blue-200">{firebaseUser.uid}</code>
                        <span className="font-bold shrink-0">معرف المستند (ID):</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-2 text-xs">
                      <div className="flex justify-between border-b pb-1"><span>users</span><span className="font-bold">المجموعة:</span></div>
                      <div className="flex justify-between border-b pb-1"><span>(اسمك الكامل)</span><span className="font-bold">حقل name:</span></div>
                      <div className="flex justify-between border-b pb-1"><span>{firebaseUser.email}</span><span className="font-bold">حقل email:</span></div>
                      <div className="flex justify-between border-b pb-1 text-blue-700">
                        <code className="bg-blue-100 px-1">Admin / Specialist / Agent</code>
                        <span className="font-bold">حقل role:</span>
                      </div>
                      <div className="flex justify-between border-b pb-1 text-blue-700">
                        <code className="bg-blue-100 px-1">Operations / Cards / Support / Digital</code>
                        <span className="font-bold">حقل department:</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 flex-row-reverse">
                    <Button variant="outline" size="sm" className="w-full" onClick={logout}>تسجيل الخروج والعودة</Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {!firebaseUser && (
              <Card className="w-full max-w-md mx-auto shadow-xl border-t-4 border-t-primary">
                <CardHeader className="space-y-1 text-right">
                  <CardTitle className="text-2xl font-bold">دخول الموظفين والمسؤولين</CardTitle>
                  <CardDescription>أدخل البريد الرسمي وكلمة السر</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2 text-right">
                      <Label htmlFor="email">البريد الإلكتروني</Label>
                      <div className="relative">
                        <Mail className="absolute right-3 top-3 w-4 h-4 text-muted-foreground" />
                        <Input 
                          id="email" 
                          type="email" 
                          placeholder="balkharam.admin@bank.com" 
                          className="pr-10 text-right"
                          dir="ltr"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required 
                        />
                      </div>
                    </div>
                    <div className="space-y-2 text-right">
                      <Label htmlFor="password">كلمة المرور</Label>
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
                    <Button type="submit" className="w-full bg-primary text-white font-bold h-12" disabled={isLoggingIn}>
                      {isLoggingIn ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : "تسجيل الدخول"}
                      <ArrowLeft className="w-4 h-4 mr-2" />
                    </Button>
                  </form>

                  <div className="mt-8 pt-6 border-t">
                    <p className="text-xs font-bold text-muted-foreground uppercase mb-3 text-right">بيانات الدخول السريع (للاختبار):</p>
                    <div className="grid grid-cols-1 gap-2">
                      <Button variant="outline" size="sm" className="justify-between flex-row-reverse text-[10px]" onClick={() => setDemoLogin('balkharam.admin@bank.com', 'ADMIN773362423')}>
                        <span>المدير العام (بلخرم)</span>
                        <code className="opacity-60">ADMIN773362423</code>
                      </Button>
                      <Button variant="outline" size="sm" className="justify-between flex-row-reverse text-[10px]" onClick={() => setDemoLogin('cards.ops@bank.com', 'CARDS_SECURE_2024')}>
                        <span>قسم البطائق</span>
                        <code className="opacity-60">CARDS_SECURE_2024</code>
                      </Button>
                      <Button variant="outline" size="sm" className="justify-between flex-row-reverse text-[10px]" onClick={() => setDemoLogin('callcenter.agent@bank.com', 'CALL7788_CC')}>
                        <span>الكول سنتر</span>
                        <code className="opacity-60">CALL7788_CC</code>
                      </Button>
                      <Button variant="outline" size="sm" className="justify-between flex-row-reverse text-[10px]" onClick={() => setDemoLogin('cs.frontline@bank.com', 'CS_GUEST_99')}>
                        <span>خدمة العملاء</span>
                        <code className="opacity-60">CS_GUEST_99</code>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      <footer className="p-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} أنظمة كونكت-ريزولف المصرفية | جميع الحقوق محفوظة
      </footer>
    </div>
  );
}
