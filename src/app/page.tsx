
"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, MonitorSmartphone, Headset, CreditCard, UserCog, Loader2, Lock, Smartphone, X } from 'lucide-react';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

export default function Home() {
  const router = useRouter();
  const { login } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState<any | null>(null);
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  
  const logo = PlaceHolderImages.find(img => img.id === 'sanad-logo');

  const employees = [
    { id: 'admin', name: 'المدير العام', role: 'Admin', dept: 'Operations', icon: UserCog, defaultUsername: 'BIM0100' },
    { id: 'cards', name: 'أخصائي البطائق', role: 'Specialist', dept: 'Cards', icon: CreditCard },
    { id: 'callcenter', name: 'موظف الاتصال (الكول سنتر)', role: 'Agent', dept: 'Support', icon: Headset },
    { id: 'digital', name: 'أخصائي خدمة العملاء الرقمية', role: 'Specialist', dept: 'Digital', icon: MonitorSmartphone },
    { id: 'app', name: 'أخصائي مشاكل التطبيق', role: 'Specialist', dept: 'App', icon: Smartphone },
  ];

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmp) return;
    
    setLoading(true);
    try {
      await login(credentials.username, credentials.password);
      toast({ title: "تم تسجيل الدخول", description: `مرحباً بك في محطة العمل، ${selectedEmp.name}` });
      router.push('/dashboard');
    } catch (error: any) {
      // إظهار رسالة الخطأ للمستخدم دون تسجيلها في الكونسول لتجنب Overlay التطوير
      const msg = error.message || "فشل تسجيل الدخول. تأكد من البيانات والارتباط بالقسم الصحيح.";
      toast({ 
        variant: "destructive", 
        title: "خطأ في الدخول", 
        description: msg.includes('auth/') ? "اسم المستخدم أو كلمة المرور غير صحيحة." : msg
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6FA] flex flex-col items-center justify-center p-6 font-body" dir="rtl">
      <div className="w-full max-w-3xl space-y-8 animate-in fade-in zoom-in-95 duration-700">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {employees.map((emp) => (
                <Button 
                  key={emp.id}
                  variant="outline" 
                  onClick={() => {
                    setSelectedEmp(emp);
                    setCredentials({ ...credentials, username: emp.defaultUsername || '' });
                  }}
                  className="h-28 flex flex-col gap-2 rounded-[24px] border-slate-100 hover:border-primary hover:bg-primary/5 transition-all group relative overflow-hidden text-center p-4"
                >
                  <emp.icon className="h-8 w-8 text-primary group-hover:scale-110 transition-transform" />
                  <div className="flex flex-col items-center">
                    <span className="block font-black text-slate-800 text-sm">{emp.name}</span>
                    <span className="text-[9px] text-slate-400 font-bold">{emp.dept} Portal</span>
                  </div>
                </Button>
              ))}
            </div>
            
            <div className="mt-8 pt-6 border-t border-slate-50 flex flex-col items-center gap-4">
               <div className="flex items-center gap-2 text-slate-400">
                  <Lock className="w-3 h-3" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">نظام محمي وآمن</span>
               </div>
               <p className="text-[10px] text-slate-400 font-bold text-center leading-relaxed">
                 تخضع كافة العمليات في نظام سند للرقابة المباشرة من قبل الإدارة.<br/>
                 يرجى استخدام حسابك المهني فقط.
               </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!selectedEmp} onOpenChange={() => setSelectedEmp(null)}>
        <DialogContent className="max-w-md text-right rounded-[32px] p-0 overflow-hidden shadow-2xl" dir="rtl">
          <DialogHeader className="p-8 bg-primary/5 border-b">
            <DialogTitle className="text-2xl font-black text-primary text-right flex items-center gap-3 justify-end">
               {selectedEmp?.name} <Lock className="w-6 h-6" />
            </DialogTitle>
            <DialogDescription className="text-right font-bold text-slate-500">
               يرجى إدخال بيانات الهوية المصرفية (BIM ID) للمتابعة
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleLoginSubmit} className="p-8 space-y-6">
            <div className="space-y-3 text-right">
              <Label className="font-black text-sm text-slate-600 mr-1">اسم المستخدم (BIM ID)</Label>
              <Input 
                required 
                value={credentials.username}
                onChange={e => setCredentials({...credentials, username: e.target.value})}
                placeholder="BIMxxxx" 
                className="banking-input h-14 text-right font-mono text-lg" 
              />
            </div>
            <div className="space-y-3 text-right">
              <Label className="font-black text-sm text-slate-600 mr-1">كلمة المرور</Label>
              <Input 
                required 
                type="password"
                value={credentials.password}
                onChange={e => setCredentials({...credentials, password: e.target.value})}
                placeholder="••••••••" 
                className="banking-input h-14 text-right" 
              />
            </div>
            <div className="pt-4 flex flex-col gap-3">
              <Button type="submit" disabled={loading} className="banking-button premium-gradient text-white h-14 w-full rounded-full font-black text-lg shadow-xl">
                {loading ? <Loader2 className="animate-spin" /> : "تسجيل الدخول للنظام"}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setSelectedEmp(null)} className="rounded-full font-black">
                إلغاء والعودة
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
