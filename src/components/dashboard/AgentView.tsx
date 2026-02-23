
"use client"

import React, { useState, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { 
  Plus, Search, Loader2, Inbox, Headset,
  Phone, Share2, MessageSquare, ImageIcon, User, Paperclip, X, Upload
} from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, useDoc } from '@/firebase';
import { collection, query, where, orderBy, doc } from 'firebase/firestore';

export function AgentView() {
  const { user } = useAuth();
  const db = useFirestore();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [showNewForm, setShowNewForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);

  const configRef = useMemoFirebase(() => db ? doc(db, 'settings', 'system-config') : null, [db]);
  const { data: config } = useDoc(configRef);

  const [formData, setFormData] = useState({ 
    customerName: '', 
    cif: '', 
    phone: '', 
    serviceType: '', 
    intakeMethod: '', 
    subIssue: '', 
    description: '', 
    createdByAgentName: '',
  });

  const [attachments, setAttachments] = useState<{url: string, description: string}[]>([]);

  const agentTicketsQuery = useMemoFirebase(() => {
    if (!db || !user?.id) return null;
    return query(collection(db, 'tickets'), where('createdByAgentId', '==', user.id), orderBy('createdAt', 'desc'));
  }, [db, user?.id]);

  const { data: tickets } = useCollection(agentTicketsQuery);

  const filteredTickets = useMemo(() => {
    if (!tickets) return [];
    return tickets.filter(t => {
      const matchesSearch = (t.ticketID || '').includes(searchQuery) || (t.customerName || '').includes(searchQuery) || (t.cif || '').includes(searchQuery);
      const matchesStatus = activeTab === 'all' || t.status === activeTab;
      return matchesSearch && matchesStatus;
    });
  }, [tickets, searchQuery, activeTab]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachments([...attachments, { url: reader.result as string, description: file.name }]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveAttachment = (idx: number) => {
    setAttachments(attachments.filter((_, i) => i !== idx));
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !db || !formData.createdByAgentName) {
      toast({ variant: "destructive", title: "تنبيه", description: "يرجى اختيار اسم الموظف أولاً" });
      return;
    }
    setIsSubmitting(true);
    const ticketID = `TIC-${Math.floor(10000 + Math.random() * 90000)}`;
    
    const newTicket = {
      ticketID,
      createdAt: new Date().toISOString(),
      status: 'New',
      customerName: formData.customerName,
      cif: formData.cif,
      phoneNumber: formData.phone,
      serviceType: formData.serviceType,
      intakeMethod: formData.intakeMethod,
      subIssue: formData.subIssue,
      description: formData.description,
      createdByAgentId: user.id,
      createdByAgentName: formData.createdByAgentName,
      attachments: attachments,
      logs: [{ 
        action: `تم رفع البلاغ وتوجيهه إلى ${formData.serviceType} بواسطة: ${formData.createdByAgentName}`, 
        timestamp: new Date().toISOString(), 
        userName: formData.createdByAgentName 
      }]
    };

    addDocumentNonBlocking(collection(db, 'tickets'), newTicket)
      .then(() => {
        toast({ title: "تم الرفع بنجاح", description: `رقم البلاغ: ${ticketID}` });
        setShowNewForm(false);
        setFormData({ customerName: '', cif: '', phone: '', serviceType: '', intakeMethod: '', subIssue: '', description: '', createdByAgentName: '' });
        setAttachments([]);
      })
      .finally(() => setIsSubmitting(false));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending': return <Badge className="bg-amber-500 rounded-full font-black">قيد المعالجة</Badge>;
      case 'Resolved': return <Badge className="bg-green-600 rounded-full font-black">تم الحل</Badge>;
      case 'Rejected': return <Badge className="bg-slate-700 rounded-full font-black">مرفوض</Badge>;
      default: return <Badge className="bg-blue-600 rounded-full font-black">جديد</Badge>;
    }
  };

  return (
    <div className="space-y-8 text-right" dir="rtl">
      <div className="flex justify-between items-center flex-row-reverse">
        <div className="text-right">
          <h1 className="text-3xl font-black text-primary flex items-center gap-3 justify-end">
             <Headset className="w-8 h-8" /> محطة عمل الكول سنتر
          </h1>
          <p className="text-slate-500 font-bold mt-1">إنشاء وبث البلاغات المصرفية للأقسام الفنية</p>
        </div>
        {!showNewForm && (
          <Button onClick={() => setShowNewForm(true)} className="banking-button premium-gradient text-white h-14 px-8 shadow-xl">
            <Plus className="w-5 h-5 ml-2" /> فتح بلاغ جديد
          </Button>
        )}
      </div>

      {showNewForm ? (
        <Card className="banking-card max-w-5xl shadow-2xl border-none mx-auto overflow-hidden">
          <CardHeader className="bg-primary/5 p-8 border-b">
            <CardTitle className="text-primary text-2xl font-black flex items-center gap-2 justify-end">
               نموذج استلام ورفع طلب مصرفي <Plus className="w-6 h-6" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-10">
            <form onSubmit={handleCreateTicket} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-50/50 p-6 rounded-[32px] border border-slate-100">
                <div className="space-y-3 text-right">
                  <Label className="font-black text-sm mr-1 text-primary flex items-center gap-2 justify-end">
                    موظف الكول سنتر (الرفع) <User className="w-4 h-4" />
                  </Label>
                  <Select value={formData.createdByAgentName} onValueChange={(v) => setFormData({...formData, createdByAgentName: v})} required>
                    <SelectTrigger className="banking-input h-14 text-right border-slate-200">
                      <SelectValue placeholder={config?.agentNames?.length ? "اختر اسم الموظف" : "ثم اضافة الموظفين من قبل في واجهه المدير، لم لا تظهر"} />
                    </SelectTrigger>
                    <SelectContent dir="rtl">
                      {config?.agentNames?.map((n: string) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3 text-right">
                  <Label className="font-black text-sm mr-1 text-primary flex items-center gap-2 justify-end">
                    توجيه البلاغ إلى القسم المختص <Share2 className="w-4 h-4" />
                  </Label>
                  <Select onValueChange={(v) => setFormData({...formData, serviceType: v})} required>
                    <SelectTrigger className="banking-input h-14 text-right border-slate-200"><SelectValue placeholder="اختر الجهة المستلمة" /></SelectTrigger>
                    <SelectContent dir="rtl">
                      <SelectItem value="إدارة البطائق">قسم البطائق (Cards)</SelectItem>
                      <SelectItem value="مشاكل التطبيق">التطبيق الإلكتروني (Mobile App)</SelectItem>
                      <SelectItem value="خدمة العملاء">خدمة العملاء (Digital CS)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-3 text-right">
                  <Label className="font-black text-sm mr-1">اسم العميل</Label>
                  <Input required value={formData.customerName} onChange={e => setFormData({...formData, customerName: e.target.value})} className="banking-input h-14 text-right border-slate-200" placeholder="الاسم الكامل للعميل" />
                </div>
                <div className="space-y-3 text-right">
                  <Label className="font-black text-sm mr-1">رقم CIF</Label>
                  <Input required value={formData.cif} onChange={e => setFormData({...formData, cif: e.target.value})} className="banking-input h-14 font-mono text-right border-slate-200" placeholder="رقم العميل الموحد" />
                </div>
                <div className="space-y-3 text-right">
                  <Label className="font-black text-sm mr-1">رقم الهاتف</Label>
                  <div className="relative">
                     <Phone className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                     <Input required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="banking-input h-14 text-right pr-12 border-slate-200" placeholder="00966..." />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3 text-right">
                  <Label className="font-black text-sm mr-1 flex items-center gap-2 justify-end">وسيلة استلام الطلب <Share2 className="w-4 h-4 text-accent" /></Label>
                  <Select onValueChange={(v) => setFormData({...formData, intakeMethod: v})} required>
                    <SelectTrigger className="banking-input h-14 text-right border-slate-200">
                      <SelectValue placeholder={config?.intakeMethods?.length ? "كيف تواصل العميل؟" : "ثم اضافة الموظفين من قبل في واجهه المدير، لم لا تظهر"} />
                    </SelectTrigger>
                    <SelectContent dir="rtl">
                      {config?.intakeMethods?.map((m: string) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3 text-right">
                  <Label className="font-black text-sm mr-1 flex items-center gap-2 justify-end">نوع المشكلة <MessageSquare className="w-4 h-4 text-accent" /></Label>
                  <Select onValueChange={(v) => setFormData({...formData, subIssue: v})} required>
                    <SelectTrigger className="banking-input h-14 text-right border-slate-200">
                      <SelectValue placeholder={config?.issueTypes?.length ? "تصنيف المشكلة الفنية" : "ثم اضافة الموظفين من قبل في واجهه المدير، لم لا تظهر"} />
                    </SelectTrigger>
                    <SelectContent dir="rtl">
                      {config?.issueTypes?.map((i: string) => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-3 text-right">
                  <Label className="font-black text-sm mr-1">وصف المشكلة بالتفصيل</Label>
                  <Textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="banking-input min-h-[150px] text-right border-slate-200 text-base" placeholder="اكتب هنا كافة التفاصيل..." />
                </div>

                <div className="space-y-3 text-right">
                  <Label className="font-black text-sm mr-1 flex items-center gap-2 justify-end">المرفقات والصور <ImageIcon className="w-4 h-4 text-slate-400" /></Label>
                  <div className="flex flex-col gap-4">
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileChange} 
                      accept="image/*" 
                      className="hidden" 
                    />
                    <Button 
                      type="button" 
                      onClick={() => fileInputRef.current?.click()} 
                      variant="outline" 
                      className="rounded-2xl h-16 w-full border-dashed border-2 border-primary/30 text-primary font-black flex items-center justify-center gap-3 hover:bg-primary/5"
                    >
                      <Upload className="w-5 h-5" /> اختر صورة من جهازك لإرفاقها بالبلاغ
                    </Button>

                    {attachments.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                        {attachments.map((at, idx) => (
                          <div key={idx} className="relative group bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
                            <div className="aspect-square w-full rounded-xl overflow-hidden border">
                               <img src={at.url} alt="preview" className="w-full h-full object-cover" />
                            </div>
                            <Button 
                              type="button" 
                              variant="destructive" 
                              size="icon" 
                              onClick={() => handleRemoveAttachment(idx)}
                              className="absolute -top-2 -right-2 w-7 h-7 rounded-full shadow-lg"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-8 border-t">
                <Button type="button" variant="ghost" onClick={() => setShowNewForm(false)} className="rounded-full font-black px-8">إلغاء</Button>
                <Button type="submit" className="banking-button premium-gradient text-white h-14 px-16 shadow-2xl" disabled={isSubmitting}>
                   {isSubmitting ? <Loader2 className="animate-spin" /> : "إرسال البلاغ للأقسام الفنية"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card className="banking-card overflow-hidden shadow-xl border-none">
          <CardHeader className="p-8 border-b bg-white">
            <div className="flex flex-col md:flex-row-reverse justify-between items-center gap-6">
              <CardTitle className="text-2xl font-black text-primary flex items-center gap-3">
                 <Inbox className="w-6 h-6" /> سجل البلاغات الصادرة
              </CardTitle>
              <div className="relative w-full md:w-80">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input placeholder="بحث برقم البلاغ أو CIF..." className="banking-input pr-10 h-11 text-right" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-primary text-white">
                <TableRow className="border-none hover:bg-primary">
                  <TableHead className="text-right h-14 font-black text-white pr-8">رقم البلاغ</TableHead>
                  <TableHead className="text-right h-14 font-black text-white">العميل</TableHead>
                  <TableHead className="text-right h-14 font-black text-white">الجهة المستلمة</TableHead>
                  <TableHead className="text-right h-14 font-black text-white">الحالة</TableHead>
                  <TableHead className="text-center h-14 font-black text-white pl-8">الإجراء</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTickets?.map((t, idx) => (
                  <TableRow key={t.id} className={`border-b transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                    <TableCell className="font-black pr-8 text-right"><Badge variant="outline">{t.ticketID}</Badge></TableCell>
                    <TableCell className="text-right font-bold">{t.customerName}</TableCell>
                    <TableCell className="text-right font-bold text-slate-500">{t.serviceType}</TableCell>
                    <TableCell className="text-right">{getStatusBadge(t.status)}</TableCell>
                    <TableCell className="text-center pl-8">
                      <Button variant="outline" size="sm" onClick={() => setSelectedTicket(t)} className="rounded-full font-black border-primary text-primary">عرض التفاصيل</Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredTickets?.length === 0 && (
                   <TableRow>
                      <TableCell colSpan={5} className="text-center py-20 font-black text-slate-400">لا توجد بلاغات صادرة حالياً</TableCell>
                   </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="max-w-3xl text-right rounded-[32px] p-0 overflow-hidden" dir="rtl">
           {selectedTicket && (
             <div className="p-8 space-y-6">
                <div className="flex justify-between items-center border-b pb-4">
                   <h3 className="text-2xl font-black text-primary">بلاغ رقم {selectedTicket.ticketID}</h3>
                   {getStatusBadge(selectedTicket.status)}
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="bg-slate-50 p-4 rounded-xl">
                      <span className="text-[10px] text-slate-400 block font-black uppercase">اسم العميل</span>
                      <p className="font-black text-lg">{selectedTicket.customerName}</p>
                   </div>
                   <div className="bg-slate-50 p-4 rounded-xl">
                      <span className="text-[10px] text-slate-400 block font-black uppercase">رقم CIF</span>
                      <p className="font-mono font-black text-lg">{selectedTicket.cif}</p>
                   </div>
                </div>
                <div className="bg-slate-50 p-6 rounded-2xl">
                   <span className="text-[10px] text-slate-400 block font-black mb-2 uppercase">تفاصيل المشكلة</span>
                   <p className="font-medium leading-relaxed">{selectedTicket.description}</p>
                </div>
                {selectedTicket.attachments?.length > 0 && (
                  <div className="space-y-4">
                    <span className="text-[10px] text-slate-400 block font-black uppercase">المرفقات</span>
                    <div className="grid grid-cols-3 gap-4">
                       {selectedTicket.attachments.map((at: any, i: number) => (
                         <div key={i} className="bg-white border p-2 rounded-xl">
                            <img src={at.url} alt="attachment" className="w-full aspect-video object-cover rounded-lg cursor-pointer" onClick={() => window.open(at.url)} />
                         </div>
                       ))}
                    </div>
                  </div>
                )}
                <div className="flex justify-end pt-4">
                   <Button onClick={() => setSelectedTicket(null)} className="rounded-full font-black px-12 h-12">إغلاق</Button>
                </div>
             </div>
           )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
