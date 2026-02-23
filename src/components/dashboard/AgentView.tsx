
"use client"

import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from '@/components/ui/textarea';
import { 
  Plus, Search, Loader2, ArrowRight, MessageSquare, Inbox, Headset, MonitorSmartphone,
  UserCircle, Fingerprint, History, Calendar, CheckCircle2, Paperclip, XCircle, Send, Archive, Upload
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
  
  const [showNewForm, setShowNewForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);

  // جلب إعدادات النظام
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
    createdByAgentName: ''
  });

  const agentTicketsQuery = useMemoFirebase(() => {
    if (!db || !user?.id) return null;
    return query(collection(db, 'tickets'), where('createdByAgentId', '==', user.id), orderBy('createdAt', 'desc'));
  }, [db, user?.id]);

  const { data: tickets } = useCollection(agentTicketsQuery);

  const filteredTickets = useMemo(() => {
    if (!tickets) return [];
    return tickets.filter(t => {
      const searchStr = searchQuery.toLowerCase();
      const matchesSearch = t.ticketID.toLowerCase().includes(searchStr) || t.customerName.toLowerCase().includes(searchStr) || t.cif.includes(searchStr);
      const matchesStatus = activeTab === 'all' || t.status === activeTab;
      return matchesSearch && matchesStatus;
    });
  }, [tickets, searchQuery, activeTab]);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !db) return;
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
      attachments: [],
      logs: [{ 
        action: `تم رفع البلاغ بواسطة: ${formData.createdByAgentName}`, 
        timestamp: new Date().toISOString(), 
        userName: user.name 
      }]
    };

    addDocumentNonBlocking(collection(db, 'tickets'), newTicket)
      .then(() => {
        toast({ title: "تم الرفع بنجاح", description: `رقم البلاغ: ${ticketID}.` });
        setShowNewForm(false);
        setFormData({ customerName: '', cif: '', phone: '', serviceType: '', intakeMethod: '', subIssue: '', description: '', createdByAgentName: '' });
      })
      .finally(() => setIsSubmitting(false));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending': return <Badge className="bg-amber-500 text-white rounded-full px-4 font-black">قيد المعالجة</Badge>;
      case 'Resolved': return <Badge className="bg-green-600 text-white rounded-full px-4 font-black">تم الحل</Badge>;
      case 'Escalated': return <Badge className="bg-red-600 text-white rounded-full px-4 font-black">محالة</Badge>;
      case 'Rejected': return <Badge className="bg-slate-700 text-white rounded-full px-4 font-black">مرفوضة</Badge>;
      default: return <Badge className="bg-blue-600 text-white rounded-full px-4 font-black">جديد</Badge>;
    }
  };

  return (
    <div className="space-y-8 text-right animate-in fade-in duration-700" dir="rtl">
      <div className="flex justify-between items-center flex-row-reverse">
        <div className="text-right">
          <h1 className="text-3xl font-black text-primary flex items-center gap-3 justify-end">
             {user?.department === 'Support' ? <Headset className="w-8 h-8" /> : <MonitorSmartphone className="w-8 h-8" />}
             {user?.department === 'Support' ? 'محطة عمل الكول سنتر' : 'بوابة خدمة العملاء الرقمية'}
          </h1>
          <p className="text-slate-500 font-bold mt-1">إدارة البلاغات لقسم {user?.department === 'Support' ? 'الدعم الهاتفي' : 'الخدمات الرقمية'}</p>
        </div>
        {!showNewForm && (
          <Button onClick={() => setShowNewForm(true)} className="banking-button premium-gradient text-white h-14 px-8 shadow-xl">
            <Plus className="w-5 h-5 ml-2" /> فتح بلاغ جديد
          </Button>
        )}
      </div>

      {showNewForm ? (
        <Card className="banking-card max-w-4xl shadow-2xl border-none overflow-hidden mx-auto">
          <CardHeader className="bg-slate-50/50 p-8 border-b border-slate-100 flex flex-row-reverse items-center justify-between">
            <div className="text-right">
              <CardTitle className="text-primary text-2xl font-black">نموذج استلام بلاغ عميل</CardTitle>
              <CardDescription className="text-slate-500 font-bold">يرجى اختيار البيانات بدقة لضمان سرعة المعالجة</CardDescription>
            </div>
            <Button variant="ghost" onClick={() => setShowNewForm(false)} className="rounded-full hover:bg-white text-slate-500 font-black">
              <ArrowRight className="w-5 h-5 ml-2" /> العودة للسجل
            </Button>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleCreateTicket} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2 text-right">
                  <Label className="font-black text-slate-700 mr-1 text-xs">موظف العلاقات (القائم بالرفع)</Label>
                  <Select onValueChange={(v) => setFormData({...formData, createdByAgentName: v})} required>
                    <SelectTrigger className="banking-input h-12 text-right"><SelectValue placeholder="اختر اسم الموظف" /></SelectTrigger>
                    <SelectContent dir="rtl">
                      {config?.staffNames?.map((name: string) => <SelectItem key={name} value={name}>{name}</SelectItem>) || (
                        ['محمد بلخرم', 'إبراهيم العمودي', 'وليد بن قبوس', 'عبدالله باخميس'].map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 text-right">
                  <Label className="font-black text-slate-700 mr-1 text-xs">الجهة الموجه إليها البلاغ</Label>
                  <Select onValueChange={(v) => setFormData({...formData, serviceType: v})} required>
                    <SelectTrigger className="banking-input h-12 text-right"><SelectValue placeholder="اختر الجهة المعنية" /></SelectTrigger>
                    <SelectContent dir="rtl">
                      {config?.serviceTypes?.map((e: string) => <SelectItem key={e} value={e}>{e}</SelectItem>) || (
                        ['كول سنتر', 'إدارة البطائق', 'مشاكل التطبيق'].map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 text-right">
                  <Label className="font-black text-slate-700 mr-1 text-xs">اسم العميل</Label>
                  <Input required value={formData.customerName} onChange={e => setFormData({...formData, customerName: e.target.value})} className="banking-input h-12 text-right" placeholder="الاسم الكامل للعميل" />
                </div>
                <div className="space-y-2 text-right">
                  <Label className="font-black text-slate-700 mr-1 text-xs">رقم CIF للعميل</Label>
                  <Input required value={formData.cif} onChange={e => setFormData({...formData, cif: e.target.value})} className="banking-input h-12 font-mono text-right" placeholder="00000000" />
                </div>
                <div className="space-y-2 text-right">
                  <Label className="font-black text-slate-700 mr-1 text-xs">رقم هاتف العميل</Label>
                  <Input required dir="ltr" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="banking-input h-12 text-right" placeholder="+967..." />
                </div>
                <div className="space-y-2 text-right">
                  <Label className="font-black text-slate-700 mr-1 text-xs">وسيلة استلام البلاغ</Label>
                  <Select onValueChange={(v) => setFormData({...formData, intakeMethod: v})} required>
                    <SelectTrigger className="banking-input h-12 text-right"><SelectValue placeholder="اختر وسيلة الاستلام" /></SelectTrigger>
                    <SelectContent dir="rtl">
                      {config?.intakeMethods?.map((m: string) => <SelectItem key={m} value={m}>{m}</SelectItem>) || (
                        ['واتساب', 'اتصال', 'من خلال الفروع'].map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 text-right">
                  <Label className="font-black text-slate-700 mr-1 text-xs">نوع المشكلة</Label>
                  <Select onValueChange={(v) => setFormData({...formData, subIssue: v})} required>
                    <SelectTrigger className="banking-input h-12 text-right"><SelectValue placeholder="اختر نوع المشكلة" /></SelectTrigger>
                    <SelectContent dir="rtl">
                      {config?.issueTypes?.map((i: string) => <SelectItem key={i} value={i}>{i}</SelectItem>) || (
                        ['تغيير رمز pin أو تأخره', 'الاستعلام عن فتح حساب', 'تأخر فتح الحساب', 'الاستعلام عن حوالة', 'مشكلة تطبيق', 'كلمة مرور', 'تأخر إصدار البطاقة'].map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2 text-right">
                <Label className="font-black text-slate-700 mr-1 text-xs">تفاصيل البلاغ</Label>
                <Textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="banking-input min-h-[120px] text-right" placeholder="اكتب تفاصيل المشكلة هنا..." />
              </div>
              <div className="space-y-4 text-right">
                <Label className="font-black text-slate-700 mr-1 text-xs flex items-center justify-end gap-2">
                   إرفاق مستندات أو لقطات شاشة <Paperclip className="w-4 h-4" />
                </Label>
                <div className="border-2 border-dashed border-slate-200 rounded-[20px] p-10 text-center bg-slate-50/50 hover:bg-slate-50 transition-all cursor-pointer group">
                   <div className="flex flex-col items-center gap-3">
                      <div className="p-4 bg-white rounded-full shadow-sm group-hover:scale-110 transition-transform"><Upload className="w-6 h-6 text-primary" /></div>
                      <p className="text-slate-500 font-black">اسحب لقطات الشاشة هنا أو اضغط للاختيار</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">PNG, JPG, PDF (MAX. 5MB)</p>
                   </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-6 border-t">
                <Button type="button" variant="ghost" onClick={() => setShowNewForm(false)} className="h-12 px-6 rounded-full font-black">إلغاء</Button>
                <Button type="submit" className="banking-button premium-gradient text-white h-12 px-12" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="animate-spin h-5 w-5" /> : "إرسال البلاغ فوراً"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card className="banking-card overflow-hidden border-none shadow-xl">
          <CardHeader className="p-8 border-b bg-white">
            <div className="flex flex-col md:flex-row-reverse justify-between items-center gap-6">
              <CardTitle className="text-2xl font-black text-primary flex items-center gap-3 justify-end">
                 <Inbox className="w-6 h-6" /> سجل البلاغات الصادرة
              </CardTitle>
              <div className="relative w-full md:w-80">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input placeholder="بحث برقم التذكرة أو CIF..." className="banking-input pr-10 h-11 text-right" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
              </div>
            </div>
            <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl" className="mt-6">
              <TabsList className="bg-slate-100 p-1 rounded-full h-auto no-scrollbar overflow-x-auto max-w-full">
                <TabsTrigger value="all" className="rounded-full px-6 py-2 font-black data-[state=active]:bg-primary data-[state=active]:text-white">الكل</TabsTrigger>
                <TabsTrigger value="New" className="rounded-full px-6 py-2 font-black data-[state=active]:bg-blue-600 data-[state=active]:text-white">جديد</TabsTrigger>
                <TabsTrigger value="Pending" className="rounded-full px-6 py-2 font-black data-[state=active]:bg-amber-500 data-[state=active]:text-white">قيد المعالجة</TabsTrigger>
                <TabsTrigger value="Escalated" className="rounded-full px-6 py-2 font-black data-[state=active]:bg-red-600 data-[state=active]:text-white">المحالة</TabsTrigger>
                <TabsTrigger value="Rejected" className="rounded-full px-6 py-2 font-black data-[state=active]:bg-slate-700 data-[state=active]:text-white">المرفوضة</TabsTrigger>
                <TabsTrigger value="Resolved" className="rounded-full px-6 py-2 font-black data-[state=active]:bg-green-600 data-[state=active]:text-white">تم الحل</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-primary">
                  <TableRow className="border-none hover:bg-primary">
                    <TableHead className="text-right h-14 font-black text-white pr-8">رقم البلاغ</TableHead>
                    <TableHead className="text-right h-14 font-black text-white">العميل</TableHead>
                    <TableHead className="text-right h-14 font-black text-white">نوع المشكلة</TableHead>
                    <TableHead className="text-right h-14 font-black text-white">الجهة الموجه إليها</TableHead>
                    <TableHead className="text-right h-14 font-black text-white">الحالة</TableHead>
                    <TableHead className="text-center h-14 font-black text-white pl-8">الإجراء</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTickets?.map((t, idx) => (
                    <TableRow key={t.id} className={`border-b border-slate-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                      <TableCell className="py-4 font-black text-slate-800 pr-8 text-right">
                         <span className="bg-primary/5 px-3 py-1 rounded-full text-xs">{t.ticketID}</span>
                      </TableCell>
                      <TableCell className="py-4 text-right">
                         <div className="font-black text-sm">{t.customerName}</div>
                         <div className="text-[10px] text-slate-400 font-mono">{t.cif}</div>
                      </TableCell>
                      <TableCell className="py-4 text-right">
                        <Badge variant="outline" className="font-bold border-slate-200 text-slate-500">{t.subIssue}</Badge>
                      </TableCell>
                      <TableCell className="py-4 text-right">
                        <span className="font-bold text-slate-600 text-xs">{t.serviceType}</span>
                      </TableCell>
                      <TableCell className="py-4 text-right">{getStatusBadge(t.status)}</TableCell>
                      <TableCell className="py-4 text-center pl-8">
                        <Button variant="outline" size="sm" onClick={() => setSelectedTicket(t)} className="rounded-full font-black hover:bg-primary hover:text-white transition-all">عرض التفاصيل</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!filteredTickets || filteredTickets.length === 0) && (
                    <TableRow><TableCell colSpan={6} className="py-20 text-center font-bold text-slate-400">لا توجد بلاغات حالياً</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="max-w-3xl text-right border-none rounded-[32px] p-0 overflow-hidden" dir="rtl">
          {selectedTicket && (
            <div className="flex flex-col">
              <div className="premium-gradient p-8 text-white">
                <div className="flex justify-between items-center flex-row-reverse">
                  <div className="flex items-center gap-4 flex-row-reverse">
                    <div className="p-3 bg-white/20 rounded-[18px] backdrop-blur-md"><History className="w-6 h-6" /></div>
                    <div className="text-right">
                      <h3 className="text-xl font-black">بلاغ رقم {selectedTicket.ticketID}</h3>
                      <p className="text-xs opacity-70 font-bold mt-1 text-right">تاريخ الإنشاء: {new Date(selectedTicket.createdAt).toLocaleString('ar-SA')}</p>
                    </div>
                  </div>
                  {getStatusBadge(selectedTicket.status)}
                </div>
              </div>
              <div className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="bg-slate-50 p-4 rounded-[20px] flex items-center gap-3 flex-row-reverse">
                      <UserCircle className="w-5 h-5 text-primary" />
                      <div className="text-right"><span className="text-[10px] text-slate-400 block font-black text-right">العميل</span><p className="font-black text-sm text-right">{selectedTicket.customerName}</p></div>
                   </div>
                   <div className="bg-slate-50 p-4 rounded-[20px] flex items-center gap-3 flex-row-reverse">
                      <Fingerprint className="w-5 h-5 text-primary" />
                      <div className="text-right"><span className="text-[10px] text-slate-400 block font-black text-right">رقم CIF</span><p className="font-mono font-black text-sm text-right">{selectedTicket.cif}</p></div>
                   </div>
                </div>
                <div className="bg-white border p-6 rounded-[24px] space-y-4 shadow-sm">
                   <div className="flex items-center gap-2 text-primary font-black flex-row-reverse">
                      <MessageSquare className="w-4 h-4" /> 
                      <span>تفاصيل المشكلة ({selectedTicket.subIssue})</span>
                   </div>
                   <p className="text-slate-600 font-medium leading-relaxed text-right bg-slate-50/30 p-4 rounded-xl">{selectedTicket.description}</p>
                </div>
              </div>
              <div className="p-6 border-t bg-slate-50 flex justify-end">
                <Button variant="outline" onClick={() => setSelectedTicket(null)} className="rounded-full font-black px-8">إغلاق النافذة</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
