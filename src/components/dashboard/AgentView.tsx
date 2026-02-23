"use client"

import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, Search, Loader2, 
  ArrowRight, ImageIcon, 
  MessageSquare, Phone, MapPin, ExternalLink,
  Upload, User, X, Trash2, CheckCircle2, AlertCircle, Clock,
  BellRing, FileText, Reply, History, Building2, UserCircle, Fingerprint, Share2, Settings2, Paperclip,
  Inbox
} from 'lucide-react';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, query, where, orderBy, doc } from 'firebase/firestore';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';

const SERVICE_ENTITIES = [
  { id: 'CallCenter', label: 'الكول سنتر' },
  { id: 'Cards', label: 'قسم البطاقات' },
  { id: 'Digital', label: 'خدمات أونلاين الإلكترونية' },
  { id: 'AppAdmin', label: 'إدارة تطبيق البنك' },
];

const INTAKE_METHODS = [
  { id: 'WhatsApp', label: 'واتساب', icon: MessageSquare },
  { id: 'Call', label: 'اتصال هاتف', icon: Phone },
  { id: 'Branch', label: 'من أحد الفروع', icon: MapPin },
];

const ISSUE_TYPES = [
  'تأخر رمز PIN',
  'تأخر فتح الحساب',
  'الرسائل لا تعمل',
  'استعلام عن حوالة',
  'تغيير رمز PIN',
  'أخرى'
];

const AGENT_NAMES = [
  "وليد بن قبوس",
  "ابراهيم العمودي",
  "عبدالله باخميس",
  "محمد بلخرم"
];

export function AgentView() {
  const { user } = useAuth();
  const db = useFirestore();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [showNewForm, setShowNewForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    const handleSidebarAction = (e: any) => {
      const action = e.detail;
      if (action === 'new-ticket') {
        setShowNewForm(true);
      } else if (['all', 'New', 'Pending', 'Escalated', 'Resolved', 'Rejected'].includes(action)) {
        setShowNewForm(false);
        setActiveTab(action);
      } else if (action === 'home') {
        setShowNewForm(false);
        setActiveTab('all');
      }
    };
    window.addEventListener('sidebar-nav', handleSidebarAction);
    return () => window.removeEventListener('sidebar-nav', handleSidebarAction);
  }, []);

  const [formData, setFormData] = useState({
    customerName: '',
    cif: '',
    phone: '',
    serviceType: '',
    intakeMethod: '',
    subIssue: '',
    description: '',
    createdByAgentName: '',
    attachments: [] as { url: string; description: string }[]
  });

  const agentTicketsQuery = useMemoFirebase(() => {
    if (!db || !user?.id) return null;
    return query(
      collection(db, 'tickets'),
      where('createdByAgentId', '==', user.id),
      orderBy('createdAt', 'desc')
    );
  }, [db, user?.id]);

  const { data: tickets, isLoading: isTicketsLoading } = useCollection(agentTicketsQuery);

  const filteredTickets = useMemo(() => {
    if (!tickets) return [];
    return tickets.filter(t => {
      const searchStr = searchQuery.toLowerCase();
      const matchesSearch = 
        t.ticketID.toLowerCase().includes(searchStr) ||
        t.customerName.toLowerCase().includes(searchStr) ||
        t.cif.includes(searchStr) ||
        (t.phoneNumber && t.phoneNumber.includes(searchStr));
      const matchesStatus = activeTab === 'all' || t.status === activeTab;
      return matchesSearch && matchesStatus;
    });
  }, [tickets, searchQuery, activeTab]);

  const counters = useMemo(() => {
    if (!tickets) return { all: 0, new: 0, pending: 0, escalated: 0, resolved: 0, rejected: 0 };
    return {
      all: tickets.length,
      new: tickets.filter(t => t.status === 'New').length,
      pending: tickets.filter(t => t.status === 'Pending').length,
      escalated: tickets.filter(t => t.status === 'Escalated').length,
      resolved: tickets.filter(t => t.status === 'Resolved').length,
      rejected: tickets.filter(t => t.status === 'Rejected').length,
    };
  }, [tickets]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500 * 1024) {
      toast({ variant: "destructive", title: "حجم الملف كبير جداً", description: "يرجى اختيار صورة بحجم أقل من 500 كيلوبايت." });
      return;
    }
    setUploadingImage(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({
        ...prev,
        attachments: [...prev.attachments, { url: reader.result as string, description: 'لقطة شاشة مرفقة' }]
      }));
      setUploadingImage(false);
    };
    reader.readAsDataURL(file);
  };

  const removeAttachment = (index: number) => {
    setFormData(prev => ({ ...prev, attachments: prev.attachments.filter((_, i) => i !== index) }));
  };

  const handleDeleteTicket = async () => {
    if (!db || !selectedTicket) return;
    const ticketIdToDelete = selectedTicket.id;
    setIsDeleteDialogOpen(false);
    setSelectedTicket(null);
    try {
      deleteDocumentNonBlocking(doc(db, 'tickets', ticketIdToDelete));
      toast({ title: "تم إلغاء البلاغ", description: "تم حذف البلاغ نهائياً من النظام." });
    } catch (error) {
      toast({ variant: "destructive", title: "خطأ", description: "حدث خطأ أثناء الحذف." });
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !db || !formData.createdByAgentName) return;

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
      createdByAgentName: formData.createdByAgentName,
      attachments: formData.attachments,
      logs: [{ action: 'تم إنشاء البلاغ', timestamp: new Date().toISOString(), userName: formData.createdByAgentName }]
    };

    addDocumentNonBlocking(collection(db, 'tickets'), newTicket)
      .then(() => {
        toast({ title: "تم الرفع بنجاح", description: `رقم البلاغ: ${ticketID}.` });
        setShowNewForm(false);
        setFormData({ customerName: '', cif: '', phone: '', serviceType: '', intakeMethod: '', subIssue: '', description: '', createdByAgentName: '', attachments: [] });
      })
      .finally(() => setIsSubmitting(false));
  };

  const getEntityLabel = (id: string) => SERVICE_ENTITIES.find(e => e.id === id)?.label || id;
  const getIntakeLabel = (id: string) => INTAKE_METHODS.find(m => m.id === id)?.label || id;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending': return <Badge className="status-pending rounded-full px-4">قيد المعالجة</Badge>;
      case 'Resolved': return <Badge className="status-resolved rounded-full px-4">تم الحل</Badge>;
      case 'Escalated': return <Badge className="status-escalated rounded-full px-4">محال للإدارة</Badge>;
      case 'Rejected': return <Badge className="status-rejected rounded-full px-4">مرفوض</Badge>;
      default: return <Badge className="status-new rounded-full px-4">جديد</Badge>;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="text-right">
          <h1 className="text-3xl font-extrabold text-primary tracking-tight">صندوق الوارد والعمليات</h1>
          <p className="text-slate-500 font-medium mt-1">تتبع حالة طلباتك والردود الفنية من الأقسام</p>
        </div>
        {!showNewForm && (
          <Button onClick={() => setShowNewForm(true)} className="banking-button premium-gradient text-white h-14 px-8 shadow-xl">
            <Plus className="w-5 h-5 ml-2" /> فتح بلاغ فني جديد
          </Button>
        )}
      </div>

      {showNewForm ? (
        <Card className="banking-card max-w-4xl animate-in slide-in-from-top-6">
          <CardHeader className="bg-slate-50/50 p-8 border-b border-slate-100 flex flex-row items-center justify-between">
            <div className="text-right flex-1">
              <CardTitle className="text-primary text-2xl flex items-center gap-3 justify-start">
                 <div className="p-3 bg-primary/10 rounded-[16px]"><FileText className="w-6 h-6 text-primary" /></div>
                 رفع بلاغ فني جديد 
              </CardTitle>
              <CardDescription className="text-slate-500 mt-1">يرجى تعبئة كافة الحقول بدقة لضمان سرعة المعالجة</CardDescription>
            </div>
            <Button variant="ghost" onClick={() => setShowNewForm(false)} className="rounded-full hover:bg-white text-slate-500">
              <ArrowRight className="w-5 h-5 ml-2" /> رجوع للسجل
            </Button>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleCreateTicket} className="space-y-8">
              <div className="bg-primary/5 p-6 rounded-[24px] border border-primary/10 space-y-4">
                <div className="flex items-center gap-3 text-primary font-bold">
                   <div className="p-2 bg-white rounded-full shadow-sm"><User className="w-4 h-4" /></div>
                   <span>الموظف القائم بالبلاغ</span>
                </div>
                <Select onValueChange={(v) => setFormData({...formData, createdByAgentName: v})} required dir="rtl">
                  <SelectTrigger className="banking-input h-14 text-lg border-none shadow-sm bg-white">
                    <SelectValue placeholder="اختر اسم الموظف" />
                  </SelectTrigger>
                  <SelectContent>
                    {AGENT_NAMES.map(name => <SelectItem key={name} value={name}>{name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3 text-right">
                  <Label className="font-bold text-slate-700 flex items-center gap-2 justify-start mr-1">
                    <Building2 className="w-4 h-4 text-primary" /> الجهة المعنية
                  </Label>
                  <Select onValueChange={(v) => setFormData({...formData, serviceType: v})} required dir="rtl">
                    <SelectTrigger className="banking-input h-13 border-slate-100"><SelectValue placeholder="اختر الجهة" /></SelectTrigger>
                    <SelectContent>
                      {SERVICE_ENTITIES.map(e => <SelectItem key={e.id} value={e.id}>{e.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3 text-right">
                  <Label className="font-bold text-slate-700 flex items-center gap-2 justify-start mr-1">
                    <UserCircle className="w-4 h-4 text-primary" /> اسم العميل الكامل
                  </Label>
                  <Input placeholder="أدخل اسم العميل" required value={formData.customerName} onChange={e => setFormData({...formData, customerName: e.target.value})} className="banking-input h-13 border-slate-100" />
                </div>
                <div className="space-y-3 text-right">
                  <Label className="font-bold text-slate-700 flex items-center gap-2 justify-start mr-1">
                    <Fingerprint className="w-4 h-4 text-primary" /> رقم الحساب / CIF
                  </Label>
                  <Input placeholder="أدخل الرقم" required value={formData.cif} onChange={e => setFormData({...formData, cif: e.target.value})} className="banking-input h-13 font-mono border-slate-100" />
                </div>
                <div className="space-y-3 text-right">
                  <Label className="font-bold text-slate-700 flex items-center gap-2 justify-start mr-1">
                    <Phone className="w-4 h-4 text-primary" /> رقم التواصل
                  </Label>
                  <Input placeholder="+966..." required dir="ltr" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="banking-input h-13 border-slate-100" />
                </div>
                <div className="space-y-3 text-right">
                  <Label className="font-bold text-slate-700 flex items-center gap-2 justify-start mr-1">
                    <Share2 className="w-4 h-4 text-primary" /> قناة الاستلام
                  </Label>
                  <Select onValueChange={(v) => setFormData({...formData, intakeMethod: v})} required dir="rtl">
                    <SelectTrigger className="banking-input h-13 border-slate-100"><SelectValue placeholder="اختر القناة" /></SelectTrigger>
                    <SelectContent>
                      {INTAKE_METHODS.map(m => <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3 text-right">
                  <Label className="font-bold text-slate-700 flex items-center gap-2 justify-start mr-1">
                    <Settings2 className="w-4 h-4 text-primary" /> تصنيف المشكلة
                  </Label>
                  <Select onValueChange={(v) => setFormData({...formData, subIssue: v})} required dir="rtl">
                    <SelectTrigger className="banking-input h-13 border-slate-100"><SelectValue placeholder="اختر التصنيف" /></SelectTrigger>
                    <SelectContent>
                      {ISSUE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3 text-right">
                <Label className="font-bold text-slate-700 flex items-center gap-2 justify-start mr-1">
                  <MessageSquare className="w-4 h-4 text-primary" /> شرح تفصيلي للمشكلة
                </Label>
                <Textarea placeholder="يرجى كتابة كافة التفاصيل الفنية هنا..." required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="banking-input min-h-[150px] p-5 border-slate-100" />
              </div>

              <div className="space-y-4 pt-4">
                <Label className="flex items-center gap-2 font-bold text-slate-700 justify-start mr-1">
                  <ImageIcon className="w-4 h-4 text-primary" /> المستندات والصور المرفقة
                </Label>
                <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                <Button type="button" variant="outline" className="border-dashed border-2 h-28 w-full bg-slate-50/50 hover:bg-primary/5 rounded-[20px] transition-all" onClick={() => fileInputRef.current?.click()} disabled={uploadingImage}>
                  {uploadingImage ? <Loader2 className="animate-spin text-primary" /> : <div className="flex flex-col items-center gap-1 text-slate-400"><Paperclip className="w-6 h-6 mb-1 text-primary" /> <span>إضافة مرفقات (بحد أقصى 500 ك.ب)</span></div>}
                </Button>
                <div className="grid grid-cols-4 md:grid-cols-6 gap-4">
                  {formData.attachments.map((att, i) => (
                    <div key={i} className="relative rounded-[16px] border bg-white p-1 group shadow-sm">
                      <img src={att.url} className="h-20 w-full object-cover rounded-[14px]" />
                      <Button size="icon" variant="destructive" className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeAttachment(i)}><X className="h-4 w-4" /></Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-8 border-t border-slate-100 flex-row-reverse">
                <Button type="button" variant="ghost" onClick={() => setShowNewForm(false)} className="h-14 px-8 rounded-full">إلغاء</Button>
                <Button type="submit" className="banking-button premium-gradient text-white h-14 px-12" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin ml-2" /> : "إرسال البلاغ فوراً"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card className="banking-card overflow-hidden">
            <CardHeader className="p-8 border-b border-slate-50 space-y-6">
              <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
                <CardTitle className="text-xl text-right w-full flex items-center gap-3 justify-start">
                   <div className="p-2 bg-primary/5 rounded-full"><History className="w-5 h-5 text-primary" /></div>
                   سجل البلاغات والعمليات
                </CardTitle>
                <div className="relative w-full lg:w-[450px]">
                  <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input 
                    placeholder="بحث برقم البلاغ، الاسم، أو الهاتف..." 
                    className="banking-input pr-12 h-12 border-none bg-slate-100/50" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl" className="w-full">
                <TabsList className="bg-slate-100/50 p-1.5 h-auto rounded-[20px] grid grid-cols-2 md:grid-cols-6 gap-1">
                  {[
                    { val: 'all', label: 'الكل', count: counters.all },
                    { val: 'New', label: 'الجديدة', count: counters.new, color: 'bg-blue-600' },
                    { val: 'Pending', label: 'قيد العمل', count: counters.pending, color: 'bg-amber-500' },
                    { val: 'Escalated', label: 'المحالة', count: counters.escalated, color: 'bg-red-600' },
                    { val: 'Resolved', label: 'الأرشيف', count: counters.resolved, color: 'bg-green-600' },
                    { val: 'Rejected', label: 'المرفوضة', count: counters.rejected, color: 'bg-slate-700' },
                  ].map(tab => (
                    <TabsTrigger key={tab.val} value={tab.val} className="relative rounded-[16px] py-2.5 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
                      <span>{tab.label}</span>
                      {tab.count > 0 && (
                        <span className={`absolute -top-1 -left-1 ${tab.color || 'bg-slate-400'} text-white text-[9px] min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1.5 border-2 border-white font-extrabold shadow-sm`}>
                          {tab.count}
                        </span>
                      )}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent className="p-0">
              {isTicketsLoading ? (
                <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary h-10 w-10" /></div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/30 hover:bg-slate-50/30">
                      <TableHead className="text-right h-14 font-bold text-slate-500 uppercase text-[10px] tracking-widest pr-8">رقم البلاغ</TableHead>
                      <TableHead className="text-right h-14 font-bold text-slate-500 uppercase text-[10px] tracking-widest">الجهة المعنية</TableHead>
                      <TableHead className="text-right h-14 font-bold text-slate-500 uppercase text-[10px] tracking-widest">بيانات العميل</TableHead>
                      <TableHead className="text-right h-14 font-bold text-slate-500 uppercase text-[10px] tracking-widest">الحالة</TableHead>
                      <TableHead className="text-center h-14 font-bold text-slate-500 uppercase text-[10px] tracking-widest pl-8">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTickets.map((t: any) => (
                      <TableRow key={t.id} className="hover:bg-slate-50/50 transition-colors border-slate-50">
                        <TableCell className="font-bold text-primary text-right pr-8">
                           <div className="flex items-center gap-3">
                             <span className="bg-primary/5 px-3 py-1.5 rounded-full">{t.ticketID}</span>
                             {t.status === 'Resolved' && !t.acknowledged && (
                               <BellRing className="w-4 h-4 text-red-500 animate-bounce" />
                             )}
                           </div>
                        </TableCell>
                        <TableCell className="text-right text-slate-600 font-medium">{getEntityLabel(t.serviceType)}</TableCell>
                        <TableCell className="text-right">
                           <div className="font-bold text-slate-800">{t.customerName}</div>
                           <div className="text-[10px] text-slate-400 font-mono mt-1">{t.cif}</div>
                        </TableCell>
                        <TableCell className="text-right">
                          {getStatusBadge(t.status)}
                        </TableCell>
                        <TableCell className="text-center pl-8">
                           <Button variant="outline" size="sm" onClick={() => setSelectedTicket(t)} className="rounded-full h-9 px-4 border-slate-100 hover:bg-primary/5 hover:text-primary transition-all">
                             <ExternalLink className="w-3.5 h-3.5 ml-2" /> عرض التفاصيل
                           </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredTickets.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-24">
                           <div className="flex flex-col items-center gap-4 text-slate-300">
                             <Inbox className="w-16 h-16 opacity-20" />
                             <p className="font-bold text-lg">لا توجد بلاغات حالياً</p>
                           </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detail Dialog Updated for Premium Style */}
      <Dialog open={!!selectedTicket} onOpenChange={(open) => !open && setSelectedTicket(null)}>
        <DialogContent className="max-w-4xl text-right p-0 border-none rounded-[32px] overflow-hidden shadow-2xl" dir="rtl">
          {selectedTicket && (
            <div className="flex flex-col h-[85vh]">
              <DialogHeader className="p-8 border-b bg-slate-50/50 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="bg-white p-4 rounded-[24px] shadow-sm flex items-center gap-4 border border-slate-50">
                    <div className="p-3 bg-primary/10 rounded-full"><History className="w-6 h-6 text-primary" /></div>
                    <div className="text-right">
                      <DialogTitle className="text-2xl text-slate-800 font-extrabold">
                        مراجعة البلاغ {selectedTicket.ticketID}
                      </DialogTitle>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                        تاريخ الإنشاء: {new Date(selectedTicket.createdAt).toLocaleString('ar-SA')}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(selectedTicket.status)}
                </div>
              </DialogHeader>
              
              <ScrollArea className="flex-1 px-8 py-6 no-scrollbar">
                <div className="space-y-8 pb-10">
                  {/* Status Specific Response Cards */}
                  {selectedTicket.status === 'Resolved' && (
                    <div className="bg-green-50/50 border border-green-100 p-8 rounded-[28px] space-y-5 animate-in zoom-in-95 duration-500">
                      <div className="flex items-center gap-3 text-green-700 font-extrabold text-lg">
                        <CheckCircle2 className="w-6 h-6" />
                        <span>الحل الفني المعتمد</span>
                      </div>
                      <div className="bg-white p-6 rounded-[20px] border border-green-50 shadow-sm">
                        <p className="text-base leading-relaxed text-slate-700 text-right">
                          {selectedTicket.specialistResponse}
                        </p>
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-green-600 font-bold">
                         <span>الموظف المجيب: {selectedTicket.assignedToSpecialistName}</span>
                         <span>توقيت الحل: {new Date(selectedTicket.resolvedAt).toLocaleString('ar-SA')}</span>
                      </div>
                    </div>
                  )}

                  {selectedTicket.status === 'Rejected' && (
                    <div className="bg-slate-100/50 border border-slate-200 p-8 rounded-[28px] space-y-5">
                      <div className="flex items-center gap-3 text-slate-700 font-extrabold text-lg">
                        <AlertCircle className="w-6 h-6" />
                        <span>سبب رفض البلاغ</span>
                      </div>
                      <div className="bg-white p-6 rounded-[20px] border border-slate-100 shadow-sm">
                        <p className="text-base leading-relaxed text-slate-600 text-right">
                          {selectedTicket.rejectionReason || 'تم الرفض لعدم اكتمال المتطلبات التقنية'}
                        </p>
                      </div>
                    </div>
                  )}

                  {selectedTicket.status === 'Escalated' && (
                    <div className="bg-red-50/50 border border-red-100 p-8 rounded-[28px] space-y-5">
                      <div className="flex items-center gap-3 text-red-700 font-extrabold text-lg">
                        <Reply className="w-6 h-6" />
                        <span>تقرير إحالة البلاغ للمتابعة</span>
                      </div>
                      <div className="bg-white p-6 rounded-[20px] border border-red-50 shadow-sm">
                        <p className="text-base leading-relaxed text-red-900 text-right">
                          {selectedTicket.escalationNote || 'تمت إحالة البلاغ لمراجعة الإدارة العليا'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Customer Info Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6 bg-slate-50/50 p-8 rounded-[32px] border border-slate-100">
                    <div className="text-right space-y-1"><Label className="text-[10px] text-slate-400 font-bold uppercase block">العميل</Label><p className="font-bold text-slate-800 text-lg">{selectedTicket.customerName}</p></div>
                    <div className="text-right space-y-1"><Label className="text-[10px] text-slate-400 font-bold uppercase block">الرقم التعريفي (CIF)</Label><p className="font-mono font-bold text-primary text-lg">{selectedTicket.cif}</p></div>
                    <div className="text-right space-y-1"><Label className="text-[10px] text-slate-400 font-bold uppercase block">رقم التواصل</Label><p className="font-bold text-slate-800 text-lg" dir="ltr">{selectedTicket.phoneNumber}</p></div>
                    <div className="text-right space-y-1"><Label className="text-[10px] text-slate-400 font-bold uppercase block">قناة الاستلام</Label><p className="font-bold text-slate-600">{getIntakeLabel(selectedTicket.intakeMethod)}</p></div>
                    <div className="text-right space-y-1"><Label className="text-[10px] text-slate-400 font-bold uppercase block">تصنيف الخدمة</Label><div className="mt-1"><Badge variant="outline" className="rounded-full border-primary/20 text-primary bg-primary/5">{selectedTicket.subIssue}</Badge></div></div>
                    <div className="text-right space-y-1"><Label className="text-[10px] text-slate-400 font-bold uppercase block">الجهة المعنية</Label><p className="font-bold text-secondary text-lg">{getEntityLabel(selectedTicket.serviceType)}</p></div>
                  </div>

                  {/* Problem Description */}
                  <div className="space-y-4">
                    <Label className="font-extrabold text-slate-700 flex items-center gap-2 justify-start"> <FileText className="w-5 h-5 text-primary" /> شرح المشكلة </Label>
                    <div className="bg-white border border-slate-100 p-8 rounded-[28px] text-base leading-relaxed whitespace-pre-wrap shadow-sm text-right text-slate-600">{selectedTicket.description}</div>
                  </div>

                  {/* Timeline Logs */}
                  <div className="space-y-4 pt-4">
                    <Label className="font-extrabold text-slate-700 flex items-center gap-2 justify-start"> <History className="w-5 h-5 text-primary" /> سجل الحركات (Timeline) </Label>
                    <div className="space-y-3 mr-2">
                      {selectedTicket.logs?.map((log: any, idx: number) => (
                        <div key={idx} className="relative pr-8 pb-4 border-r-2 border-slate-100 last:border-0 last:pb-0">
                          <div className="absolute top-0 -right-[9px] w-4 h-4 rounded-full bg-primary border-4 border-white shadow-sm"></div>
                          <div className="bg-slate-50 p-4 rounded-[20px] flex items-center justify-between shadow-sm">
                            <span className="font-bold text-slate-800 text-sm">{log.action} <span className="text-slate-400 font-medium">({log.userName})</span></span>
                            <span className="text-[10px] text-slate-400 font-bold">{new Date(log.timestamp).toLocaleString('ar-SA')}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Attachments Display */}
                  {selectedTicket.attachments?.length > 0 && (
                    <div className="space-y-4 pt-4">
                      <Label className="font-extrabold text-slate-700 block text-right">المرفقات التوضيحية</Label>
                      <div className="grid grid-cols-2 gap-6">
                        {selectedTicket.attachments.map((att: any, idx: number) => (
                          <div key={idx} className="banking-card overflow-hidden group">
                            <img src={att.url} className="aspect-video object-cover w-full group-hover:scale-105 transition-transform duration-500" />
                            <div className="p-4 bg-white flex justify-between items-center border-t border-slate-50">
                               <a href={att.url} target="_blank" rel="noreferrer" className="text-xs text-primary font-bold hover:underline flex items-center gap-2">
                                 <ExternalLink className="w-4 h-4" /> فتح الصورة
                               </a>
                               <span className="text-xs text-slate-400 font-medium">{att.description}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              <div className="p-8 border-t bg-slate-50/50 flex justify-between items-center">
                <Button variant="ghost" onClick={() => setSelectedTicket(null)} className="h-13 px-8 rounded-full font-bold">إغلاق النافذة</Button>
                <Button variant="destructive" size="sm" onClick={() => setIsDeleteDialogOpen(true)} className="rounded-full h-11 px-6 font-bold shadow-lg shadow-red-100">
                  <Trash2 className="w-4 h-4 ml-2" /> إلغاء البلاغ نهائياً
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent dir="rtl" className="text-right border-none rounded-[32px] p-8 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-right text-2xl font-bold text-slate-800">تأكيد إلغاء البلاغ</AlertDialogTitle>
            <AlertDialogDescription className="text-red-500 font-bold text-right mt-2">
              تحذير: سيتم حذف هذا البلاغ نهائياً من سجلات البنك. لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-4 mt-8">
            <AlertDialogAction onClick={handleDeleteTicket} className="bg-red-600 hover:bg-red-700 h-13 px-8 rounded-full font-bold">تأكيد الحذف</AlertDialogAction>
            <AlertDialogCancel className="h-13 px-8 rounded-full font-bold border-slate-100 hover:bg-slate-50">تراجع</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}