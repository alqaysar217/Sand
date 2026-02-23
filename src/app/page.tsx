
"use client"

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, ArrowLeft, MonitorSmartphone, Headset, CreditCard, UserCog } from 'lucide-react';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

/**
 * الصفحة الرئيسية المبسطة - تسمح بالدخول المباشر للنظام لتجاوز مشاكل تسجيل الدخول
 */
export default function Home() {
  const router = useRouter();
  const logo = PlaceHolderImages.find(img => img.id === 'sanad-logo');

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
          <CardHeader className="premium-gradient text-white p-10 text-center">
            <CardTitle className="text-2xl font-black">بوابة العبور المباشر</CardTitle>
            <CardDescription className="text-white/70 font-bold mt-2">
              تم تعطيل نظام الحماية وفتح قواعد البيانات للسماح لك بإكمال بناء واجهات النظام لكل الأقسام.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-10">
            <Button 
              onClick={() => router.push('/dashboard')} 
              className="w-full banking-button bg-primary text-white h-20 text-xl font-black shadow-xl hover:scale-[1.02] transition-transform flex items-center justify-center gap-3"
            >
              <span>دخول النظام وتجربة الواجهات</span>
              <ArrowLeft className="w-6 h-6" />
            </Button>

            <div className="mt-8 pt-6 border-t border-slate-50">
              <p className="text-[10px] font-black text-slate-400 uppercase mb-4 text-center tracking-[0.2em]">أقسام النظام المتاحة للمعاينة</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col items-center p-4 bg-slate-50 rounded-2xl gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  <span className="font-bold text-[10px] text-slate-800">قسم البطائق</span>
                </div>
                <div className="flex flex-col items-center p-4 bg-slate-50 rounded-2xl gap-2">
                  <Headset className="h-5 w-5 text-secondary" />
                  <span className="font-bold text-[10px] text-slate-800">الكول سنتر</span>
                </div>
                <div className="flex flex-col items-center p-4 bg-slate-50 rounded-2xl gap-2">
                  <MonitorSmartphone className="h-5 w-5 text-accent" />
                  <span className="font-bold text-[10px] text-slate-800">الرقمية</span>
                </div>
                <div className="flex flex-col items-center p-4 bg-slate-50 rounded-2xl gap-2">
                  <UserCog className="h-5 w-5 text-red-600" />
                  <span className="font-bold text-[10px] text-slate-800">المدير العام</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
