
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
  BellRing, FileText, Reply, History, Building2, UserCircle, Fingerprint, Share2, Settings2, Paperclip
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
import { Separator } from '@/components/ui/separator';

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

  useEffect(() => {
    if (!selectedTicket && !isDeleteDialogOpen) {
      document.body.style.pointerEvents = 'auto';
    }
  }, [selectedTicket, isDeleteDialogOpen]);

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
      case 'Pending': return <Badge className="status-pending">قيد المعالجة</Badge>;
      case 'Resolved': return <Badge className="status-resolved">تم الحل</Badge>;
      case 'Escalated': return <Badge className="status-escalated">محال للإدارة</Badge>;
      case 'Rejected': return <Badge className="status-rejected">مرفوض</Badge>;
      default: return <Badge className="status-new">جديد</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="text-right">
          <h1 className="text-2xl font-bold text-primary">سند | صندوق الوارد والمتابعة</h1>
          <p className="text-muted-foreground">متابعة حالة الطلبات والردود الفنية الواردة</p>
        </div>
        {!showNewForm && (
          <Button onClick={() => setShowNewForm(true)} className="bg-accent hover:bg-accent/90 text-primary font-bold w-full md:w-auto shadow-lg">
            <Plus className="w-4 h-4 ml-2" /> بلاغ جديد
          </Button>
        )}
      </div>

      {showNewForm ? (
        <Card className="max-w-4xl border-2 border-primary/10 shadow-xl animate-in slide-in-from-top-4">
          <CardHeader className="bg-slate-50 text-right border-b flex flex-row items-center justify-between">
            <div className="text-right flex-1">
              <CardTitle className="text-primary text-xl flex items-center gap-2 justify-start">
                 <FileText className="w-5 h-5 text-accent" /> رفع بلاغ فني جديد 
              </CardTitle>
              <CardDescription>أدخل بيانات العميل والمشكلة بدقة لضمان سرعة الحل</CardDescription>
            </div>
            <Button variant="ghost" onClick={() => setShowNewForm(false)} className="mr-4 hover:bg-white">
              <ArrowRight className="w-4 h-4 ml-2" /> العودة للسجل
            </Button>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleCreateTicket} className="space-y-6">
              <div className="bg-blue-50/50 p-6 rounded-lg border-2 border-dashed border-blue-200 space-y-4">
                <div className="flex items-center gap-2 text-primary font-bold">
                   <User className="w-5 h-5 text-primary" />
                   <span>اختيار الموظف القائم بالرفع</span>
                </div>
                <Select onValueChange={(v) => setFormData({...formData, createdByAgentName: v})} required dir="rtl">
                  <SelectTrigger className="text-right bg-white border-primary/30 h-12 text-lg">
                    <SelectValue placeholder="اختر اسم الموظف" />
                  </SelectTrigger>
                  <SelectContent>
                    {AGENT_NAMES.map(name => <SelectItem key={name} value={name}>{name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 text-right">
                  <Label className="font-bold flex items-center gap-2 justify-start">
                    <Building2 className="w-4 h-4 text-primary" /> الجهة المعنية
                  </Label>
                  <Select onValueChange={(v) => setFormData({...formData, serviceType: v})} required dir="rtl">
                    <SelectTrigger className="text-right h-11"><SelectValue placeholder="اختر الجهة" /></SelectTrigger>
                    <SelectContent>
                      {SERVICE_ENTITIES.map(e => <SelectItem key={e.id} value={e.id}>{e.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 text-right">
                  <Label className="font-bold flex items-center gap-2 justify-start">
                    <UserCircle className="w-4 h-4 text-primary" /> اسم العميل
                  </Label>
                  <Input placeholder="الاسم الكامل" required value={formData.customerName} onChange={e => setFormData({...formData, customerName: e.target.value})} className="text-right h-11" />
                </div>
                <div className="space-y-2 text-right">
                  <Label className="font-bold flex items-center gap-2 justify-start">
                    <Fingerprint className="w-4 h-4 text-primary" /> رقم الحساب / CIF
                  </Label>
                  <Input placeholder="أدخل الرقم" required value={formData.cif} onChange={e => setFormData({...formData, cif: e.target.value})} className="text-right font-mono h-11" />
                </div>
                <div className="space-y-2 text-right">
                  <Label className="font-bold flex items-center gap-2 justify-start">
                    <Phone className="w-4 h-4 text-primary" /> رقم الهاتف
                  </Label>
                  <Input placeholder="+966..." required dir="ltr" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="text-right h-11" />
                </div>
                <div className="space-y-2 text-right">
                  <Label className="font-bold flex items-center gap-2 justify-start">
                    <Share2 className="w-4 h-4 text-primary" /> وسيلة الاستلام
                  </Label>
                  <Select onValueChange={(v) => setFormData({...formData, intakeMethod: v})} required dir="rtl">
                    <SelectTrigger className="text-right h-11"><SelectValue placeholder="اختر الوسيلة" /></SelectTrigger>
                    <SelectContent>
                      {INTAKE_METHODS.map(m => <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 text-right">
                  <Label className="font-bold flex items-center gap-2 justify-start">
                    <Settings2 className="w-4 h-4 text-primary" /> نوع الخدمة / المشكلة
                  </Label>
                  <Select onValueChange={(v) => setFormData({...formData, subIssue: v})} required dir="rtl">
                    <SelectTrigger className="text-right h-11"><SelectValue placeholder="اختر المشكلة" /></SelectTrigger>
                    <SelectContent>
                      {ISSUE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2 text-right">
                <Label className="font-bold flex items-center gap-2 justify-start">
                  <FileText className="w-4 h-4 text-primary" /> شرح تفصيلي للمشكلة
                </Label>
                <Textarea placeholder="اكتب هنا..." required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="text-right min-h-[120px]" />
              </div>

              <div className="space-y-4 border-t pt-4">
                <Label className="flex items-center gap-2 font-bold text-primary justify-start">
                  <ImageIcon className="w-4 h-4" /> المرفقات التوضيحية
                </Label>
                <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                <Button type="button" variant="outline" className="border-dashed border-2 h-20 w-full bg-slate-50 hover:bg-blue-50" onClick={() => fileInputRef.current?.click()} disabled={uploadingImage}>
                  {uploadingImage ? <Loader2 className="animate-spin" /> : <><Paperclip className="w-5 h-5 ml-2" /> إرفاق صورة (بحد أقصى 500 ك.ب)</>}
                </Button>
                <div className="grid grid-cols-4 gap-4">
                  {formData.attachments.map((att, i) => (
                    <div key={i} className="relative rounded border bg-white p-1 group">
                      <img src={att.url} className="h-16 w-full object-cover rounded" />
                      <Button size="icon" variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeAttachment(i)}><X className="h-3 w-3" /></Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t flex-row-reverse">
                <Button type="button" variant="outline" onClick={() => setShowNewForm(false)}>إلغاء</Button>
                <Button type="submit" className="bg-primary text-white font-bold h-12 px-8" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : "إرسال البلاغ فوراً"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card className="shadow-sm border-2">
            <CardHeader className="pb-4 border-b space-y-4">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <CardTitle className="text-lg text-right w-full flex items-center gap-2 justify-start">
                   <History className="w-5 h-5 text-primary" /> سجل البلاغات والمتابعة
                </CardTitle>
                <div className="relative w-full md:w-96">
                  <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="بحث بالاسم، الهاتف، أو الحساب..." 
                    className="pr-10 text-right h-10 border-primary/20" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl" className="w-full">
                <TabsList className="grid grid-cols-2 md:grid-cols-6 h-auto p-1 bg-slate-100 gap-1">
                  <TabsTrigger value="all" className="relative">
                    <span>الكل</span>
                    {counters.all > 0 && <span className="absolute -top-1 -left-1 bg-slate-500 text-white text-[9px] min-w-[16px] h-[16px] flex items-center justify-center rounded-full px-1 border border-white shadow-sm font-bold">{counters.all}</span>}
                  </TabsTrigger>
                  <TabsTrigger value="New" className="relative">
                    <span>الجديدة</span>
                    {counters.new > 0 && <span className="absolute -top-1 -left-1 bg-blue-600 text-white text-[9px] min-w-[16px] h-[16px] flex items-center justify-center rounded-full px-1 border border-white shadow-sm font-bold">{counters.new}</span>}
                  </TabsTrigger>
                  <TabsTrigger value="Pending" className="relative data-[state=active]:bg-amber-100">
                    <span>قيد العمل</span>
                    {counters.pending > 0 && <span className="absolute -top-1 -left-1 bg-amber-500 text-black text-[9px] min-w-[16px] h-[16px] flex items-center justify-center rounded-full px-1 border border-white shadow-sm font-bold">{counters.pending}</span>}
                  </TabsTrigger>
                  <TabsTrigger value="Escalated" className="relative data-[state=active]:bg-red-100">
                    <span>المحالة</span>
                    {counters.escalated > 0 && <span className="absolute -top-1 -left-1 bg-red-600 text-white text-[9px] min-w-[16px] h-[16px] flex items-center justify-center rounded-full px-1 border border-white shadow-sm font-bold">{counters.escalated}</span>}
                  </TabsTrigger>
                  <TabsTrigger value="Resolved" className="relative data-[state=active]:bg-green-100">
                    <span>الأرشيف</span>
                    {counters.resolved > 0 && <span className="absolute -top-1 -left-1 bg-green-600 text-white text-[9px] min-w-[16px] h-[16px] flex items-center justify-center rounded-full px-1 border border-white shadow-sm font-bold">{counters.resolved}</span>}
                  </TabsTrigger>
                  <TabsTrigger value="Rejected" className="relative data-[state=active]:bg-gray-200">
                    <span>المرفوضة</span>
                    {counters.rejected > 0 && <span className="absolute -top-1 -left-1 bg-gray-600 text-white text-[9px] min-w-[16px] h-[16px] flex items-center justify-center rounded-full px-1 border border-white shadow-sm font-bold">{counters.rejected}</span>}
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent className="pt-4">
              {isTicketsLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary h-8 w-8" /></div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/80">
                      <TableHead className="text-right">رقم البلاغ</TableHead>
                      <TableHead className="text-right">الجهة المعنية</TableHead>
                      <TableHead className="text-right">بيانات العميل</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                      <TableHead className="text-center">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTickets.map((t: any) => (
                      <TableRow key={t.id} className="hover:bg-slate-50/50">
                        <TableCell className="font-bold text-blue-600 text-right">
                           <div className="flex items-center gap-2">
                             {t.ticketID}
                             {t.status === 'Resolved' && !t.acknowledged && (
                               <BellRing className="w-3 h-3 text-red-500 animate-bounce" />
                             )}
                           </div>
                        </TableCell>
                        <TableCell className="text-right">{getEntityLabel(t.serviceType)}</TableCell>
                        <TableCell className="text-right">
                           <div className="font-medium">{t.customerName}</div>
                           <div className="text-[10px] text-muted-foreground font-mono">{t.cif}</div>
                        </TableCell>
                        <TableCell className="text-right">
                          {getStatusBadge(t.status)}
                        </TableCell>
                        <TableCell className="text-center">
                           <Button variant="outline" size="sm" onClick={() => setSelectedTicket(t)} className="h-8">
                             <ExternalLink className="w-3 h-3 ml-1" /> التفاصيل
                           </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredTickets.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-12 text-muted-foreground italic">
                           لا توجد بلاغات في هذا القسم حالياً
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

      <Dialog open={!!selectedTicket} onOpenChange={(open) => !open && setSelectedTicket(null)}>
        <DialogContent className="max-w-3xl text-right p-0 border-2" dir="rtl">
          {selectedTicket && (
            <>
              <DialogHeader className="p-6 border-b bg-slate-50">
                <div className="flex justify-between items-start">
                  {getStatusBadge(selectedTicket.status)}
                  <DialogTitle className="text-2xl text-primary font-bold">
                    مراجعة البلاغ {selectedTicket.ticketID}
                  </DialogTitle>
                </div>
                <p className="text-xs text-muted-foreground mt-1 text-right">
                   أنشئ في: {new Date(selectedTicket.createdAt).toLocaleString('ar-SA')} بواسطة {selectedTicket.createdByAgentName}
                </p>
              </DialogHeader>
              
              <ScrollArea className="max-h-[75vh]">
                <div className="p-6 space-y-6">
                  {selectedTicket.status === 'Resolved' && (
                    <div className="bg-green-50 border-2 border-green-200 p-5 rounded-xl space-y-3 animate-in zoom-in-95">
                      <div className="flex items-center gap-2 text-green-800 font-bold">
                        <CheckCircle2 className="w-5 h-5" />
                        <span>رد القسم الفني والحل المعتمد</span>
                      </div>
                      <p className="text-sm leading-relaxed text-green-900 bg-white/80 p-4 rounded-lg border shadow-sm text-right">
                        {selectedTicket.specialistResponse}
                      </p>
                      <div className="flex justify-between items-center text-[10px] text-green-700 font-medium">
                         <span>بواسطة: {selectedTicket.assignedToSpecialistName}</span>
                         <span>تاريخ الحل: {new Date(selectedTicket.resolvedAt).toLocaleString('ar-SA')}</span>
                      </div>
                    </div>
                  )}

                  {selectedTicket.status === 'Rejected' && (
                    <div className="bg-gray-100 border-2 border-gray-300 p-5 rounded-xl space-y-3">
                      <div className="flex items-center gap-2 text-gray-800 font-bold">
                        <AlertCircle className="w-5 h-5" />
                        <span>سبب رفض البلاغ</span>
                      </div>
                      <p className="text-sm leading-relaxed text-gray-900 bg-white/80 p-4 rounded-lg border text-right">
                        {selectedTicket.rejectionReason || 'لم يتم ذكر سبب محدد'}
                      </p>
                      <div className="flex justify-between items-center text-[10px] text-gray-600">
                         <span>الموظف: {selectedTicket.rejectedBy || 'الأخصائي'}</span>
                         <span>تاريخ الرفض: {new Date(selectedTicket.rejectedAt || '').toLocaleString('ar-SA')}</span>
                      </div>
                    </div>
                  )}

                  {selectedTicket.status === 'Escalated' && (
                    <div className="bg-red-50 border-2 border-red-200 p-5 rounded-xl space-y-3">
                      <div className="flex items-center gap-2 text-red-800 font-bold">
                        <Reply className="w-5 h-5" />
                        <span>تقرير إحالة البلاغ للمتابعة الإدارية</span>
                      </div>
                      <p className="text-sm leading-relaxed text-red-900 bg-white/80 p-4 rounded-lg border text-right">
                        {selectedTicket.escalationNote || 'تمت الإحالة للمراجعة الدقيقة'}
                      </p>
                      <div className="flex justify-between items-center text-[10px] text-red-700">
                         <span>أحيل بواسطة: {selectedTicket.escalatedBy || 'إدارة القسم'}</span>
                         <span>تاريخ الإحالة: {new Date(selectedTicket.escalatedAt || selectedTicket.createdAt).toLocaleString('ar-SA')}</span>
                      </div>
                    </div>
                  )}

                  {selectedTicket.status === 'Pending' && selectedTicket.assignedToSpecialistName && (
                    <div className="bg-amber-50 border-2 border-amber-200 p-4 rounded-xl flex items-center justify-between flex-row-reverse">
                       <div className="flex items-center gap-2 text-amber-800 font-bold">
                         <span>قيد المعالجة حالياً</span>
                         <Clock className="w-5 h-5 animate-pulse" />
                       </div>
                       <span className="text-xs text-amber-700">الموظف المستلم: <b>{selectedTicket.assignedToSpecialistName}</b></span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6 bg-slate-50 p-5 rounded-xl border-2">
                    <div className="text-right"><Label className="text-[10px] text-muted-foreground block mb-1">العميل</Label><p className="font-bold text-slate-900">{selectedTicket.customerName}</p></div>
                    <div className="text-right"><Label className="text-[10px] text-muted-foreground block mb-1">الحساب (CIF)</Label><p className="font-mono font-bold text-slate-900">{selectedTicket.cif}</p></div>
                    <div className="text-right"><Label className="text-[10px] text-muted-foreground block mb-1">رقم الهاتف</Label><p className="font-bold text-slate-900" dir="ltr">{selectedTicket.phoneNumber}</p></div>
                    <div className="text-right"><Label className="text-[10px] text-muted-foreground block mb-1">وسيلة الاستلام</Label><p className="font-bold">{getIntakeLabel(selectedTicket.intakeMethod)}</p></div>
                    <div className="text-right"><Label className="text-[10px] text-muted-foreground block mb-1">نوع المشكلة</Label><Badge variant="outline" className="border-primary text-primary">{selectedTicket.subIssue}</Badge></div>
                    <div className="text-right"><Label className="text-[10px] text-muted-foreground block mb-1">الجهة المعنية</Label><p className="font-bold text-blue-700">{getEntityLabel(selectedTicket.serviceType)}</p></div>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-bold text-sm flex items-center gap-2 justify-start"> <FileText className="w-4 h-4" /> وصف المشكلة الأصلي</Label>
                    <div className="bg-white border-2 p-4 rounded-xl text-sm leading-relaxed whitespace-pre-wrap shadow-sm text-right">{selectedTicket.description}</div>
                  </div>

                  <div className="space-y-3 border-t pt-4">
                    <Label className="font-bold text-sm flex items-center gap-2 justify-start"> <History className="w-4 h-4" /> تاريخ الحركات (Timeline)</Label>
                    <div className="space-y-2">
                      {selectedTicket.logs?.map((log: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between text-[11px] bg-slate-50 p-2 rounded-lg border-r-4 border-primary shadow-sm">
                          <span className="text-muted-foreground">{new Date(log.timestamp).toLocaleString('ar-SA')}</span>
                          <span className="font-bold text-primary">{log.action} <span className="text-muted-foreground font-normal">({log.userName})</span></span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {selectedTicket.attachments?.length > 0 && (
                    <div className="space-y-3 border-t pt-4">
                      <Label className="font-bold text-sm block text-right">المرفقات والصور التوضيحية</Label>
                      <div className="grid grid-cols-2 gap-4">
                        {selectedTicket.attachments.map((att: any, idx: number) => (
                          <div key={idx} className="border-2 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                            <img src={att.url} className="aspect-video object-cover w-full" />
                            <div className="p-2 bg-slate-50 flex justify-between items-center border-t">
                               <a href={att.url} target="_blank" rel="noreferrer" className="text-[10px] text-blue-600 font-bold hover:underline flex items-center gap-1">
                                 <ExternalLink className="w-3 h-3" /> تكبير
                               </a>
                               <span className="text-[10px] text-muted-foreground">{att.description}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              <div className="p-6 border-t bg-slate-50 flex justify-between items-center">
                <Button variant="outline" onClick={() => setSelectedTicket(null)}>إغلاق النافذة</Button>
                <Button variant="destructive" size="sm" onClick={() => setIsDeleteDialogOpen(true)} className="font-bold">
                  <Trash2 className="w-4 h-4 ml-2" /> إلغاء البلاغ نهائياً
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent dir="rtl" className="text-right border-2">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-right">تأكيد إلغاء البلاغ</AlertDialogTitle>
            <AlertDialogDescription className="text-red-600 font-medium text-right">
              سيتم حذف البلاغ نهائياً من قاعدة بيانات "سند". لا يمكن التراجع عن هذا الإجراء بعد تنفيذه.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2 mt-4">
            <AlertDialogAction onClick={handleDeleteTicket} className="bg-red-600 hover:bg-red-700">تأكيد الحذف</AlertDialogAction>
            <AlertDialogCancel>تراجع عن الإجراء</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
