
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
          <div className="w-12 h-12 bg-primary rounded-lg"></div>
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
            {error === "MISSING_PROFILE" && firebaseUser && suggestions && (
              <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-4 border-2 shadow-xl bg-white text-slate-900 overflow-hidden">
                <div className="bg-red-600 p-4 -mx-4 -mt-4 mb-4 text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="h-6 w-6" />
                    <AlertTitle className="text-right font-bold text-lg m-0">دليل ربط قاعدة البيانات</AlertTitle>
                  </div>
                </div>
                <AlertDescription className="text-right space-y-6">
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
                        <div className="flex items-center gap-2 mb-2">
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
                    <p className="text-xs font-bold text-muted-foreground uppercase mb-3 text-right">دخول سريع ببياناتك المحددة:</p>
                    <div className="grid grid-cols-1 gap-2">
                      <Button variant="outline" size="sm" className="justify-between flex-row-reverse text-[10px] h-auto py-2" onClick={() => setDemoLogin('balkharam.admin@bank.com', 'ADMIN773362423')}>
                        <div className="text-right">
                          <p className="font-bold">بلخرم (المدير العام)</p>
                          <p className="opacity-50">ADMIN773362423</p>
                        </div>
                        <Shield className="h-4 w-4 opacity-30" />
                      </Button>
                      <Button variant="outline" size="sm" className="justify-between flex-row-reverse text-[10px] h-auto py-2" onClick={() => setDemoLogin('cards.ops@bank.com', 'CARDS_SECURE_2024')}>
                        <div className="text-right">
                          <p className="font-bold">قسم البطائق</p>
                          <p className="opacity-50">CARDS_SECURE_2024</p>
                        </div>
                        <Database className="h-4 w-4 opacity-30" />
                      </Button>
                      <Button variant="outline" size="sm" className="justify-between flex-row-reverse text-[10px] h-auto py-2" onClick={() => setDemoLogin('callcenter.agent@bank.com', 'CALL7788_CC')}>
                        <div className="text-right">
                          <p className="font-bold">الكول سنتر</p>
                          <p className="opacity-50">CALL7788_CC</p>
                        </div>
                        <Mail className="h-4 w-4 opacity-30" />
                      </Button>
                      <Button variant="outline" size="sm" className="justify-between flex-row-reverse text-[10px] h-auto py-2" onClick={() => setDemoLogin('cs.frontline@bank.com', 'CS_GUEST_99')}>
                        <div className="text-right">
                          <p className="font-bold">خدمة العملاء</p>
                          <p className="opacity-50">CS_GUEST_99</p>
                        </div>
                        <Info className="h-4 w-4 opacity-30" />
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
