
"use client"

import React, { useState, useMemo } from 'react';
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
  UserCircle, Fingerprint, History, Calendar, CheckCircle2, Clock
} from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';

const SERVICE_ENTITIES = [
  { id: 'Cards', label: 'قسم البطاقات' },
  { id: 'Digital', label: 'الخدمات الرقمية' },
  { id: 'AppAdmin', label: 'إدارة التطبيق' },
  { id: 'Operations', label: 'العمليات المركزية' },
];

const INTAKE_METHODS = [
  { id: 'Call', label: 'اتصال هاتفي' },
  { id: 'WhatsApp', label: 'واتساب' },
  { id: 'Branch', label: 'زيارة فرع' },
];

export function AgentView() {
  const { user } = useAuth();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [showNewForm, setShowNewForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);

  const isCallCenter = user?.department === 'Support';

  const [formData, setFormData] = useState({
    customerName: '', 
    cif: '', 
    phone: '', 
    serviceType: '', 
    intakeMethod: isCallCenter ? 'Call' : 'WhatsApp', 
    subIssue: '', 
    description: ''
  });

  const agentTicketsQuery = useMemoFirebase(() => {
    if (!db || !user?.id) return null;
    return query(collection(db, 'tickets'), where('createdByAgentId', '==', user.id), orderBy('createdAt', 'desc'));
  }, [db, user?.id]);

  const { data: tickets, isLoading: isTicketsLoading } = useCollection(agentTicketsQuery);

  const filteredTickets = useMemo(() => {
    if (!tickets) return [];
    return tickets.filter(t => {
      const searchStr = searchQuery.toLowerCase();
      const matchesSearch = t.ticketID.toLowerCase().includes(searchStr) || t.customerName.toLowerCase().includes(searchStr) || t.cif.includes(searchStr);
      const matchesStatus = activeTab === 'all' || t.status === activeTab;
      return matchesSearch && matchesStatus;
    });
  }, [tickets, searchQuery, activeTab]);

  const counters = useMemo(() => {
    if (!tickets) return { all: 0, new: 0, pending: 0, resolved: 0 };
    return {
      all: tickets.length,
      new: tickets.filter(t => t.status === 'New').length,
      pending: tickets.filter(t => t.status === 'Pending').length,
      resolved: tickets.filter(t => t.status === 'Resolved').length,
    };
  }, [tickets]);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !db) return;
    setIsSubmitting(true);
    const ticketID = `TIC-${Math.floor(1000 + Math.random() * 9000)}`;
    
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
      createdByAgentName: user.name,
      attachments: [],
      logs: [{ 
        action: `تم إنشاء البلاغ بواسطة ${user.name} (${user.department})`, 
        timestamp: new Date().toISOString(), 
        userName: user.name 
      }]
    };

    addDocumentNonBlocking(collection(db, 'tickets'), newTicket)
      .then(() => {
        toast({ title: "تم الرفع بنجاح", description: `رقم البلاغ الجديد: ${ticketID}.` });
        setShowNewForm(false);
        setFormData({ customerName: '', cif: '', phone: '', serviceType: '', intakeMethod: isCallCenter ? 'Call' : 'WhatsApp', subIssue: '', description: '' });
      })
      .finally(() => setIsSubmitting(false));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending': return <Badge className="status-pending rounded-full px-4 font-black">قيد المعالجة</Badge>;
      case 'Resolved': return <Badge className="status-resolved rounded-full px-4 font-black">تم الحل</Badge>;
      default: return <Badge className="status-new rounded-full px-4 font-black">جديد</Badge>;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 text-right" dir="rtl">
      <div className="flex justify-between items-center flex-row-reverse">
        <div className="text-right">
          <h1 className="text-3xl font-black text-primary flex items-center gap-3 justify-end">
             {isCallCenter ? <Headset className="w-8 h-8" /> : <MonitorSmartphone className="w-8 h-8" />}
             {isCallCenter ? 'محطة عمل الكول سنتر' : 'بوابة خدمة العملاء الرقمية'}
          </h1>
          <p className="text-slate-500 font-bold mt-1">إدارة الطلبات والبلاغات الرسمية لقسم {isCallCenter ? 'الدعم الهاتفي' : 'الخدمات الرقمية'}</p>
        </div>
        {!showNewForm && (
          <Button onClick={() => setShowNewForm(true)} className="banking-button premium-gradient text-white h-14 px-8 shadow-xl">
            <Plus className="w-5 h-5 ml-2" /> فتح بلاغ جديد
          </Button>
        )}
      </div>

      {showNewForm ? (
        <Card className="banking-card max-w-4xl shadow-2xl border-none overflow-hidden">
          <CardHeader className="bg-slate-50/50 p-8 border-b border-slate-100 flex flex-row-reverse items-center justify-between">
            <div className="text-right">
              <CardTitle className="text-primary text-2xl font-black">نموذج استلام بلاغ عميل</CardTitle>
              <CardDescription className="text-slate-500 font-bold">يرجى تعبئة كافة الحقول الفنية لضمان سرعة المعالجة</CardDescription>
            </div>
            <Button variant="ghost" onClick={() => setShowNewForm(false)} className="rounded-full hover:bg-white text-slate-500 font-black">
              <ArrowRight className="w-5 h-5 ml-2" /> العودة للسجل
            </Button>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleCreateTicket} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2 text-right">
                  <Label className="font-black text-slate-700 mr-1 text-xs">اسم العميل الكامل</Label>
                  <Input required value={formData.customerName} onChange={e => setFormData({...formData, customerName: e.target.value})} className="banking-input h-12 text-right" />
                </div>
                <div className="space-y-2 text-right">
                  <Label className="font-black text-slate-700 mr-1 text-xs">رقم CIF / الحساب</Label>
                  <Input required value={formData.cif} onChange={e => setFormData({...formData, cif: e.target.value})} className="banking-input h-12 font-mono text-right" />
                </div>
                <div className="space-y-2 text-right">
                  <Label className="font-black text-slate-700 mr-1 text-xs">رقم التواصل</Label>
                  <Input required dir="ltr" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="banking-input h-12 text-right" />
                </div>
                <div className="space-y-2 text-right">
                  <Label className="font-black text-slate-700 mr-1 text-xs">وسيلة استلام البلاغ</Label>
                  <Select value={formData.intakeMethod} onValueChange={(v) => setFormData({...formData, intakeMethod: v})} required>
                    <SelectTrigger className="banking-input h-12 text-right"><SelectValue placeholder="اختر الوسيلة" /></SelectTrigger>
                    <SelectContent dir="rtl">
                      {INTAKE_METHODS.map(m => <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 text-right">
                  <Label className="font-black text-slate-700 mr-1 text-xs">التوجيه الفني (الجهة المعنية)</Label>
                  <Select onValueChange={(v) => setFormData({...formData, serviceType: v})} required>
                    <SelectTrigger className="banking-input h-12 text-right"><SelectValue placeholder="اختر القسم" /></SelectTrigger>
                    <SelectContent dir="rtl">
                      {SERVICE_ENTITIES.map(e => <SelectItem key={e.id} value={e.id}>{e.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 text-right">
                  <Label className="font-black text-slate-700 mr-1 text-xs">نوع المشكلة الفرعي</Label>
                  <Input required placeholder="مثلاً: إعادة تعيين رقم سري، تجميد حساب..." value={formData.subIssue} onChange={e => setFormData({...formData, subIssue: e.target.value})} className="banking-input h-12 text-right" />
                </div>
              </div>
              <div className="space-y-2 text-right">
                <Label className="font-black text-slate-700 mr-1 text-xs">ملاحظات وتفاصيل البلاغ</Label>
                <Textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="banking-input min-h-[120px] text-right" />
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
                 <Inbox className="w-6 h-6" /> البلاغات الصادرة منك
              </CardTitle>
              <div className="relative w-full md:w-80">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input placeholder="بحث برقم التذكرة أو CIF..." className="banking-input pr-10 h-11 text-right" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
              </div>
            </div>
            <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl" className="mt-6">
              <TabsList className="bg-slate-100 p-1 rounded-full h-auto">
                <TabsTrigger value="all" className="rounded-full px-6 py-2 font-black data-[state=active]:bg-primary data-[state=active]:text-white">الكل ({counters.all})</TabsTrigger>
                <TabsTrigger value="New" className="rounded-full px-6 py-2 font-black data-[state=active]:bg-blue-600 data-[state=active]:text-white">جديد ({counters.new})</TabsTrigger>
                <TabsTrigger value="Pending" className="rounded-full px-6 py-2 font-black data-[state=active]:bg-amber-500 data-[state=active]:text-white">قيد المعالجة ({counters.pending})</TabsTrigger>
                <TabsTrigger value="Resolved" className="rounded-full px-6 py-2 font-black data-[state=active]:bg-green-600 data-[state=active]:text-white">تم الحل ({counters.resolved})</TabsTrigger>
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
                    <TableHead className="text-right h-14 font-black text-white">الحالة</TableHead>
                    <TableHead className="text-center h-14 font-black text-white pl-8">الإجراء</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTickets.map((t, idx) => (
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
                      <TableCell className="py-4 text-right">{getStatusBadge(t.status)}</TableCell>
                      <TableCell className="py-4 text-center pl-8">
                        <Button variant="outline" size="sm" onClick={() => setSelectedTicket(t)} className="rounded-full font-black hover:bg-primary hover:text-white">عرض التفاصيل</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredTickets.length === 0 && (
                    <TableRow><TableCell colSpan={5} className="py-20 text-center font-bold text-slate-400">لا توجد بلاغات حالياً</TableCell></TableRow>
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
                      <div className="text-right"><span className="text-[10px] text-slate-400 block font-black text-right">رقم الحساب</span><p className="font-mono font-black text-sm text-right">{selectedTicket.cif}</p></div>
                   </div>
                </div>
                <div className="bg-white border p-6 rounded-[24px] space-y-4 shadow-sm">
                   <div className="flex items-center gap-2 text-primary font-black flex-row-reverse">
                      <MessageSquare className="w-4 h-4" /> 
                      <span>تفاصيل المشكلة ({selectedTicket.subIssue})</span>
                   </div>
                   <p className="text-slate-600 font-medium leading-relaxed text-right bg-slate-50/30 p-4 rounded-xl">{selectedTicket.description}</p>
                </div>
                
                {selectedTicket.specialistResponse && (
                  <div className="bg-green-50 border border-green-100 p-6 rounded-[24px] space-y-3">
                     <div className="flex items-center gap-2 text-green-700 font-black flex-row-reverse">
                        <CheckCircle2 className="w-4 h-4" /> 
                        <span>الرد الفني والحل المتخذ</span>
                     </div>
                     <p className="text-green-800 font-bold leading-relaxed text-right">{selectedTicket.specialistResponse}</p>
                  </div>
                )}
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
