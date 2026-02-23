"use client"

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Shield, Lock, Mail, ArrowLeft, CheckCircle2, Loader2, Info, Copy, Check, Database, UserCheck } from 'lucide-react';
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

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "تم النسخ", description: "تم نسخ الكود بنجاح." });
  };

  const setDemoLogin = (email: string, pass: string) => {
    setEmail(email);
    setPassword(pass);
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#F6F9FA]">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
             <div className="w-10 h-10 bg-primary rounded-lg animate-spin"></div>
          </div>
          <div className="h-4 w-32 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  const getSuggestedFields = () => {
    if (!firebaseUser?.email) return null;
    const email = firebaseUser.email;
    if (email === 'balkharam.admin@bank.com') return { name: 'بلخرم (المدير العام)', role: 'Admin', dept: 'Operations', isAdmin: true };
    if (email === 'cards.ops@bank.com') return { name: 'الأخصائي الفني', role: 'Specialist', dept: 'Cards', isAdmin: false };
    if (email === 'callcenter.agent@bank.com') return { name: 'موظف الاتصال', role: 'Agent', dept: 'Support', isAdmin: false };
    if (email === 'cs.frontline@bank.com') return { name: 'موظف الميدان', role: 'Agent', dept: 'Digital', isAdmin: false };
    return { name: 'موظف جديد', role: 'Agent', dept: 'Support', isAdmin: false };
  };

  const suggestions = getSuggestedFields();

  return (
    <div className="min-h-screen bg-[#F6F9FA] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8 text-center animate-in fade-in zoom-in-95 duration-500">
        <div className="flex flex-col items-center gap-4 mb-8">
          {logo && (
            <Image 
              src={logo.imageUrl} 
              alt="Logo" 
              width={80} 
              height={80} 
              className="rounded-2xl border-4 border-white shadow-xl"
              data-ai-hint={logo.imageHint}
            />
          )}
          <h1 className="text-4xl font-extrabold text-primary tracking-tight">سند</h1>
          <p className="text-muted-foreground font-medium">نظام إدارة بلاغات العملاء</p>
        </div>

        {error === "MISSING_PROFILE" && firebaseUser && suggestions && (
          <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-4 border-2 shadow-xl bg-white text-slate-900 overflow-hidden text-right">
            <div className="bg-red-600 p-4 -mx-4 -mt-4 mb-4 text-white flex items-center justify-between flex-row-reverse">
              <div className="flex items-center gap-2">
                <Database className="h-6 w-6" />
                <AlertTitle className="font-bold text-lg m-0">دليل ربط قاعدة البيانات</AlertTitle>
              </div>
            </div>
            <AlertDescription className="space-y-6">
              <div className="bg-blue-50 p-3 rounded-md border border-blue-200 text-sm text-blue-800 font-bold">
                حسابك مفعل في الهوية، لكن ينقصه ملف الصلاحيات في Firestore. اتبع التالي:
              </div>

              <div className="space-y-4">
                <div className="flex flex-col gap-1">
                  <Label className="text-xs text-slate-500 font-bold">1. أنشئ مستنداً جديداً في مجموعة (users) بالمعرف التالي:</Label>
                  <div className="flex items-center justify-between gap-2 border-2 border-primary/20 p-2 rounded bg-slate-50 shadow-inner">
                    <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-slate-200" onClick={() => copyText(firebaseUser.uid)}>
                      {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4 text-primary" />}
                    </Button>
                    <code className="text-primary font-mono text-sm font-bold break-all">{firebaseUser.uid}</code>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-slate-500 font-bold">2. أضف الحقول التالية لهذا المستند بدقة:</Label>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-2 bg-slate-100 rounded border">
                      <span className="font-bold text-blue-700">{suggestions.name}</span>
                      <span className="text-xs font-mono text-slate-500">name (string)</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-slate-100 rounded border">
                      <span className="font-bold text-blue-700">{firebaseUser.email}</span>
                      <span className="text-xs font-mono text-slate-500">email (string)</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-amber-100 rounded border border-amber-300">
                      <span className="font-bold text-red-600">{suggestions.role}</span>
                      <span className="text-xs font-mono text-slate-500">role (string)</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-slate-100 rounded border">
                      <span className="font-bold text-blue-700">{suggestions.dept}</span>
                      <span className="text-xs font-mono text-slate-500">department (string)</span>
                    </div>
                  </div>
                </div>

                {suggestions.isAdmin && (
                  <div className="bg-amber-50 p-4 rounded-md border-2 border-amber-300 text-xs shadow-md">
                    <div className="flex items-center gap-2 mb-2 flex-row-reverse">
                      <Shield className="h-4 w-4 text-amber-700" />
                      <p className="font-bold text-amber-800 text-sm">3. تفعيل مفتاح المدير العام (Admin Flag)</p>
                    </div>
                    <p className="text-amber-700 mb-2 leading-relaxed">اضغط <b>+ Start collection</b> فوق كلمة `users` تماماً:</p>
                    <ul className="space-y-1 text-amber-800 list-disc list-inside">
                      <li>اسم المجموعة الجديدة: <code className="bg-white px-1 font-bold">admins</code></li>
                      <li>في خانة <b>Document ID</b> ضع كود الـ UID الخاص بك أعلاه.</li>
                      <li>اضغط <b>Save</b> مباشرة دون إضافة أي حقول.</li>
                    </ul>
                  </div>
                )}
              </div>
              
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="w-full" onClick={logout}>تسجيل الخروج والمحاولة لاحقاً</Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {!firebaseUser && (
          <Card className="w-full shadow-2xl border-t-4 border-t-primary overflow-hidden">
            <CardHeader className="space-y-2 text-center bg-slate-50/50 pb-8">
              <CardTitle className="text-2xl font-bold">دخول الموظفين</CardTitle>
              <CardDescription>أدخل البريد الرسمي وكلمة السر لنظام سند</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2 text-right">
                  <Label htmlFor="email">البريد الإلكتروني</Label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="employee@bank.com" 
                      className="pr-10 text-right h-12"
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
                      className="pr-10 text-right h-12"
                      dir="ltr"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required 
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full bg-primary text-white font-bold h-12 text-lg shadow-lg hover:shadow-primary/20 transition-all" disabled={isLoggingIn}>
                  {isLoggingIn ? <Loader2 className="w-5 h-5 animate-spin ml-2" /> : (
                    <>
                      <ArrowLeft className="w-5 h-5 ml-2" />
                      <span>تسجيل الدخول</span>
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-10 pt-6 border-t">
                <p className="text-xs font-bold text-muted-foreground uppercase mb-4 text-center">دخول سريع للتجربة:</p>
                <div className="grid grid-cols-1 gap-3">
                  <Button variant="outline" className="justify-between h-auto py-3 px-4 border-2 hover:border-primary/50 hover:bg-primary/5 group" onClick={() => setDemoLogin('balkharam.admin@bank.com', 'ADMIN773362423')}>
                    <Shield className="h-5 w-5 text-amber-500" />
                    <div className="text-right">
                      <p className="font-bold text-sm">بلخرم (المدير العام)</p>
                      <p className="text-[10px] text-muted-foreground">صلاحيات كاملة</p>
                    </div>
                  </Button>
                  <Button variant="outline" className="justify-between h-auto py-3 px-4 border-2 hover:border-primary/50 hover:bg-primary/5 group" onClick={() => setDemoLogin('cs.frontline@bank.com', 'CS_GUEST_99')}>
                    <Info className="h-5 w-5 text-blue-500" />
                    <div className="text-right">
                      <p className="font-bold text-sm">موظف خدمة العملاء</p>
                      <p className="text-[10px] text-muted-foreground">رفع ومتابعة البلاغات</p>
                    </div>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        <footer className="text-center text-xs text-muted-foreground pt-4">
          © {new Date().getFullYear()} نظام سند المصرفي | جميع الحقوق محفوظة
        </footer>
      </div>
    </div>
  );
}