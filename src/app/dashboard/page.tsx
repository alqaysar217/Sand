
"use client"

import { useAuth } from '@/lib/contexts/AuthContext';
import { AgentView } from '@/components/dashboard/AgentView';
import { SpecialistView } from '@/components/dashboard/SpecialistView';
import { AdminView } from '@/components/dashboard/AdminView';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  AlertCircle, ShieldCheck, Copy, Check, ExternalLink, 
  Loader2, LogOut, Info, Rocket, Database
} from "lucide-react";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { UserRole, Department } from '@/lib/types';

export default function DashboardPage() {
  const { user, firebaseUser, error, logout, setupDemoProfile } = useAuth();
  const [isActivating, setIsActivating] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const getAutoValues = () => {
    const email = firebaseUser?.email || '';
    if (email.includes('admin')) return { role: 'Admin' as UserRole, dept: 'Operations' as Department, name: 'المدير العام' };
    if (email.includes('cards')) return { role: 'Specialist' as UserRole, dept: 'Cards' as Department, name: 'أخصائي البطائق' };
    if (email.includes('frontline')) return { role: 'Agent' as UserRole, dept: 'Support' as Department, name: 'موظف الكول سنتر' };
    if (email.includes('digital')) return { role: 'Agent' as UserRole, dept: 'Digital' as Department, name: 'موظف خدمة العملاء الرقمية' };
    return { role: 'Agent' as UserRole, dept: 'Digital' as Department, name: 'موظف بنك' };
  };

  const autoValues = getAutoValues();

  const handleCopyUid = () => {
    if (firebaseUser?.uid) {
      navigator.clipboard.writeText(firebaseUser.uid);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: "تم النسخ", description: "تم نسخ المعرف الفريد (UID) للحافظة." });
    }
  };

  const handleQuickActivate = async () => {
    setIsActivating(true);
    try {
      await setupDemoProfile(autoValues.role, autoValues.dept, autoValues.name);
      toast({ title: "تم التفعيل", description: "تم إنشاء ملفك الشخصي بنجاح، جاري تحويلك..." });
    } catch (err) {
      toast({ variant: "destructive", title: "خطأ في التفعيل", description: "فشل إنشاء الملف في قاعدة البيانات." });
    } finally {
      setIsActivating(false);
    }
  };

  if (error === "MISSING_PROFILE" && firebaseUser) {
    return (
      <div className="max-w-4xl mx-auto mt-6 space-y-8 text-right pb-20" dir="rtl">
        <Card className="banking-card border-none shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4">
          <CardHeader className="premium-gradient text-white p-10">
            <div className="flex items-center gap-6 justify-start">
              <div className="p-4 bg-white/20 rounded-[20px] backdrop-blur-md">
                <ShieldCheck className="h-10 w-10 text-white" />
              </div>
              <div>
                <CardTitle className="text-3xl font-black">تنشيط الصلاحيات المصرفية</CardTitle>
                <p className="text-white/80 text-base mt-1 font-bold">يجب ربط هويتك بملف وظيفي في النظام</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-10 space-y-10 bg-white">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="flex items-center gap-3 text-primary font-black text-xl mb-4">
                  <Rocket className="w-6 h-6" />
                  <h3>التفعيل التلقائي (موصى به)</h3>
                </div>
                <p className="text-slate-600 leading-relaxed font-bold">
                  سيقوم النظام بربط حسابك كـ <span className="text-primary">{autoValues.name}</span> في قسم <span className="text-secondary">{autoValues.dept}</span> فوراً.
                </p>
                <Button 
                  onClick={handleQuickActivate} 
                  className="w-full h-20 rounded-[24px] bg-primary hover:bg-primary/90 text-white font-black text-xl shadow-xl shadow-primary/20 flex items-center justify-center gap-4"
                  disabled={isActivating}
                >
                  {isActivating ? <Loader2 className="animate-spin h-6 w-6" /> : <ShieldCheck className="w-8 h-8" />}
                  تفعيل حسابي الآن
                </Button>
              </div>

              <div className="bg-slate-50 p-6 rounded-[24px] border border-slate-100 space-y-6">
                <div className="flex items-center gap-3 text-slate-800 font-black text-lg">
                  <Database className="w-5 h-5 text-secondary" />
                  <h3>بيانات الربط اليدوي (Firestore)</h3>
                </div>
                <div className="space-y-4">
                  <Label className="text-[10px] text-primary font-black uppercase">Document ID (UID)</Label>
                  <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-[14px] border border-slate-200">
                    <p className="font-mono font-black text-primary text-xs break-all">{firebaseUser.uid}</p>
                    <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full shrink-0" onClick={handleCopyUid}>
                      {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-slate-400" />}
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white p-3 rounded-[14px] border border-slate-100">
                      <span className="text-[9px] font-black text-slate-400 block">role</span>
                      <p className="font-black text-xs">{autoValues.role}</p>
                    </div>
                    <div className="bg-white p-3 rounded-[14px] border border-slate-100">
                      <span className="text-[9px] font-black text-slate-400 block">department</span>
                      <p className="font-black text-xs">{autoValues.dept}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 flex gap-4 border-t">
              <Button variant="ghost" className="h-12 rounded-full font-black text-slate-400 hover:text-red-500" onClick={logout}>
                <LogOut className="w-4 h-4 ml-2" /> خروج وإلغاء
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) return (
    <div className="max-w-md mx-auto mt-20 text-right" dir="rtl">
      <Alert variant="destructive" className="rounded-[24px] shadow-xl"><AlertTitle className="font-black text-right">خطأ في النظام</AlertTitle><AlertDescription className="font-bold text-right">{error}</AlertDescription></Alert>
      <Button className="w-full h-12 rounded-full mt-4 font-black" onClick={logout}>خروج</Button>
    </div>
  );

  if (!user) return null;

  switch (user.role) {
    case 'Agent':
      return <AgentView />;
    case 'Specialist':
      return <SpecialistView />;
    case 'Admin':
      return <AdminView />;
    default:
      return <div>صلاحيات غير معروفة</div>;
  }
}
