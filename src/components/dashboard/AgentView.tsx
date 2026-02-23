
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
  Inbox, Calendar, Headset
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
    createdByAgentName: user?.name || '',
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
      logs: [{ action: 'تم إنشاء البلاغ من الكول سنتر', timestamp: new Date().toISOString(), userName: formData.createdByAgentName }]
    };

    addDocumentNonBlocking(collection(db, 'tickets'), newTicket)
      .then(() => {
        toast({ title: "تم الرفع بنجاح", description: `رقم البلاغ: ${ticketID}.` });
        setShowNewForm(false);
        setFormData({ customerName: '', cif: '', phone: '', serviceType: '', intakeMethod: '', subIssue: '', description: '', createdByAgentName: user.name, attachments: [] });
      })
      .finally(() => setIsSubmitting(false));
  };

  const getEntityLabel = (id: string) => SERVICE_ENTITIES.find(e => e.id === id)?.label || id;
  const getIntakeLabel = (id: string) => INTAKE_METHODS.find(m => m.id === id)?.label || id;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending': return <Badge className="status-pending rounded-full px-4 font-bold shadow-sm">قيد المعالجة</Badge>;
      case 'Resolved': return <Badge className="status-resolved rounded-full px-4 font-bold shadow-sm">تم الحل</Badge>;
      case 'Escalated': return <Badge className="status-escalated rounded-full px-4 font-bold shadow-sm">محال للإدارة</Badge>;
      case 'Rejected': return <Badge className="status-rejected rounded-full px-4 font-bold shadow-sm">مرفوض</Badge>;
      default: return <Badge className="status-new rounded-full px-4 font-bold shadow-sm">جديد</Badge>;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700" dir="rtl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="text-right">
          <h1 className="text-3xl font-extrabold text-primary tracking-tight">محطة عمل الكول سنتر</h1>
          <p className="text-slate-500 font-medium mt-1">إدارة البلاغات الهاتفية وحالات الدعم المباشر</p>
        </div>
        {!showNewForm && (
          <Button onClick={() => setShowNewForm(true)} className="banking-button premium-gradient text-white h-14 px-8 shadow-xl">
            <Plus className="w-5 h-5 ml-2" /> فتح تذكرة دعم جديدة
          </Button>
        )}
      </div>

      {showNewForm ? (
        <Card className="banking-card max-w-4xl animate-in slide-in-from-top-6 shadow-2xl">
          <CardHeader className="bg-slate-50/50 p-8 border-b border-slate-100 flex flex-row items-center justify-between">
            <div className="text-right flex-1">
              <CardTitle className="text-primary text-2xl flex items-center gap-3 justify-start">
                 <div className="p-3 bg-primary/10 rounded-[16px]"><Headset className="w-6 h-6 text-primary" /></div>
                 نموذج استلام بلاغ عميل
              </CardTitle>
              <CardDescription className="text-slate-500 mt-1">تأكد من تعبئة بيانات CIF والعميل بشكل صحيح من النظام البنكي</CardDescription>
            </div>
            <Button variant="ghost" onClick={() => setShowNewForm(false)} className="rounded-full hover:bg-white text-slate-500">
              <ArrowRight className="w-5 h-5 ml-2" /> رجوع للسجل
            </Button>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleCreateTicket} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3 text-right">
                  <Label className="font-bold text-slate-700 flex items-center gap-2 justify-start mr-1">
                    <UserCircle className="w-4 h-4 text-primary" /> اسم العميل الكامل
                  </Label>
                  <Input placeholder="أدخل اسم العميل" required value={formData.customerName} onChange={e => setFormData({...formData, customerName: e.target.value})} className="banking-input h-13 border-slate-200" />
                </div>
                <div className="space-y-3 text-right">
                  <Label className="font-bold text-slate-700 flex items-center gap-2 justify-start mr-1">
                    <Fingerprint className="w-4 h-4 text-primary" /> رقم الحساب / CIF
                  </Label>
                  <Input placeholder="أدخل الرقم" required value={formData.cif} onChange={e => setFormData({...formData, cif: e.target.value})} className="banking-input h-13 font-mono border-slate-200" />
                </div>
                <div className="space-y-3 text-right">
                  <Label className="font-bold text-slate-700 flex items-center gap-2 justify-start mr-1">
                    <Phone className="w-4 h-4 text-primary" /> رقم جوال العميل
                  </Label>
                  <Input placeholder="+966..." required dir="ltr" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="banking-input h-13 border-slate-200" />
                </div>
                <div className="space-y-3 text-right">
                  <Label className="font-bold text-slate-700 flex items-center gap-2 justify-start mr-1">
                    <Building2 className="w-4 h-4 text-primary" /> توجيه البلاغ لقسم
                  </Label>
                  <Select onValueChange={(v) => setFormData({...formData, serviceType: v})} required dir="rtl">
                    <SelectTrigger className="banking-input h-13 border-slate-200"><SelectValue placeholder="اختر القسم المختص" /></SelectTrigger>
                    <SelectContent>
                      {SERVICE_ENTITIES.map(e => <SelectItem key={e.id} value={e.id}>{e.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3 text-right">
                  <Label className="font-bold text-slate-700 flex items-center gap-2 justify-start mr-1">
                    <Share2 className="w-4 h-4 text-primary" /> قناة ورود البلاغ
                  </Label>
                  <Select onValueChange={(v) => setFormData({...formData, intakeMethod: v})} required dir="rtl">
                    <SelectTrigger className="banking-input h-13 border-slate-200"><SelectValue placeholder="اختر القناة" /></SelectTrigger>
                    <SelectContent>
                      {INTAKE_METHODS.map(m => <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3 text-right">
                  <Label className="font-bold text-slate-700 flex items-center gap-2 justify-start mr-1">
                    <Settings2 className="w-4 h-4 text-primary" /> نوع المشكلة
                  </Label>
                  <Select onValueChange={(v) => setFormData({...formData, subIssue: v})} required dir="rtl">
                    <SelectTrigger className="banking-input h-13 border-slate-200"><SelectValue placeholder="اختر التصنيف" /></SelectTrigger>
                    <SelectContent>
                      {ISSUE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3 text-right">
                <Label className="font-bold text-slate-700 flex items-center gap-2 justify-start mr-1">
                  <MessageSquare className="w-4 h-4 text-primary" /> ملاحظات وشرح المشكلة
                </Label>
                <Textarea placeholder="اكتب تفاصيل البلاغ هنا..." required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="banking-input min-h-[150px] p-5 border-slate-200" />
              </div>

              <div className="space-y-4 pt-4">
                <Label className="flex items-center gap-2 font-bold text-slate-700 justify-start mr-1">
                  <Paperclip className="w-4 h-4 text-primary" /> إرفاق وثائق (اختياري)
                </Label>
                <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                <Button type="button" variant="outline" className="border-dashed border-2 h-24 w-full bg-slate-50/50 hover:bg-primary/5 rounded-[20px] transition-all border-slate-200" onClick={() => fileInputRef.current?.click()} disabled={uploadingImage}>
                  {uploadingImage ? <Loader2 className="animate-spin text-primary" /> : "اضغط لرفع لقطة شاشة أو ملف"}
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

              <div className="flex justify-end gap-4 pt-8 border-t border-slate-100">
                <Button type="button" variant="ghost" onClick={() => setShowNewForm(false)} className="h-14 px-8 rounded-full font-bold">إلغاء</Button>
                <Button type="submit" className="banking-button premium-gradient text-white h-14 px-12" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin ml-2" /> : "اعتماد وإرسال التذكرة"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card className="banking-card overflow-hidden shadow-xl border-none">
            <CardHeader className="p-8 border-b border-slate-50 bg-white">
              <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
                <CardTitle className="text-2xl text-primary font-extrabold flex items-center gap-3 justify-start">
                   <div className="p-3 bg-primary/5 rounded-[16px]"><Inbox className="w-6 h-6 text-primary" /></div>
                   سجل البلاغات الواردة
                </CardTitle>
                <div className="relative w-full lg:w-[450px]">
                  <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input 
                    placeholder="بحث برقم التذكرة أو CIF..." 
                    className="banking-input pr-12 h-14 border-none bg-slate-100/50 shadow-inner" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl" className="w-full mt-8">
                <TabsList className="bg-slate-100/60 p-1.5 h-auto rounded-[24px] grid grid-cols-2 md:grid-cols-6 gap-1.5">
                  {[
                    { val: 'all', label: 'الكل', count: counters.all },
                    { val: 'New', label: 'جديد', count: counters.new, color: 'bg-blue-600' },
                    { val: 'Pending', label: 'تحت المعالجة', count: counters.pending, color: 'bg-amber-500' },
                    { val: 'Escalated', label: 'محال', count: counters.escalated, color: 'bg-red-600' },
                    { val: 'Resolved', label: 'تم الحل', count: counters.resolved, color: 'bg-green-600' },
                    { val: 'Rejected', label: 'مرفوض', count: counters.rejected, color: 'bg-slate-700' },
                  ].map(tab => (
                    <TabsTrigger 
                      key={tab.val} 
                      value={tab.val} 
                      className="relative rounded-[18px] py-3 font-bold data-[state=active]:bg-primary data-[state=active]:text-white shadow-none data-[state=active]:shadow-lg"
                    >
                      <span>{tab.label}</span>
                      {tab.count > 0 && (
                        <span className={`absolute -top-1 -left-1 ${tab.color || 'bg-slate-400'} text-white text-[9px] min-w-[18px] h-[18px] flex items-center justify-center rounded-full border-2 border-white`}>
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
                <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary h-12 w-12" /></div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-primary/5 hover:bg-primary/5 border-none">
                        <TableHead className="text-right h-16 font-black text-primary pr-10">رقم التذكرة</TableHead>
                        <TableHead className="text-right h-16 font-black text-primary">القسم الموجه له</TableHead>
                        <TableHead className="text-right h-16 font-black text-primary">العميل</TableHead>
                        <TableHead className="text-right h-16 font-black text-primary">الحالة</TableHead>
                        <TableHead className="text-center h-16 font-black text-primary pl-10">الإجراء</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTickets.map((t: any, index: number) => (
                        <TableRow 
                          key={t.id} 
                          className={`border-b border-slate-100 transition-colors group ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
                        >
                          <TableCell className="py-5 font-bold text-primary pr-10">
                             <div className="flex items-center gap-3">
                               <span className="bg-primary/5 px-4 py-1.5 rounded-full text-xs">{t.ticketID}</span>
                               {t.status === 'Resolved' && !t.acknowledged && (
                                 <BellRing className="w-4 h-4 text-red-500 animate-bounce" />
                               )}
                             </div>
                          </TableCell>
                          <TableCell className="py-5 text-right font-bold text-slate-600">{getEntityLabel(t.serviceType)}</TableCell>
                          <TableCell className="py-5 text-right">
                             <div className="font-extrabold text-slate-800">{t.customerName}</div>
                             <div className="text-[10px] text-slate-400 font-mono mt-1">{t.cif}</div>
                          </TableCell>
                          <TableCell className="py-5 text-right">
                            {getStatusBadge(t.status)}
                          </TableCell>
                          <TableCell className="py-5 text-center pl-10">
                             <Button variant="outline" size="sm" onClick={() => setSelectedTicket(t)} className="rounded-full hover:bg-primary hover:text-white font-bold h-10 px-6">
                               <ExternalLink className="w-4 h-4 ml-2" /> عرض التفاصيل
                             </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredTickets.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-32 bg-white">
                             <div className="flex flex-col items-center gap-4 text-slate-300">
                               <Inbox className="w-16 h-16 opacity-20" />
                               <p className="font-bold text-xl">لا توجد بلاغات مسجلة</p>
                             </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={(open) => !open && setSelectedTicket(null)}>
        <DialogContent className="max-w-4xl text-right p-0 border-none rounded-[32px] overflow-hidden bg-[#F6F9FA]" dir="rtl">
          {selectedTicket && (
            <div className="flex flex-col h-[85vh]">
              <DialogHeader className="p-8 border-b bg-white">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/5 rounded-[18px]">
                      <History className="w-6 h-6 text-primary" />
                    </div>
                    <div className="text-right">
                      <DialogTitle className="text-xl font-black">بلاغ رقم {selectedTicket.ticketID}</DialogTitle>
                      <p className="text-[10px] text-slate-400 font-bold mt-1">تاريخ الإنشاء: {new Date(selectedTicket.createdAt).toLocaleString('ar-SA')}</p>
                    </div>
                  </div>
                  {getStatusBadge(selectedTicket.status)}
                </div>
              </DialogHeader>
              
              <ScrollArea className="flex-1 px-8 py-6">
                <div className="space-y-6 pb-10">
                  {/* Important Status Message */}
                  {selectedTicket.status === 'Resolved' && (
                    <div className="bg-green-50 border border-green-100 p-6 rounded-[24px] space-y-3">
                      <div className="flex items-center gap-2 text-green-700 font-black justify-start">
                        <CheckCircle2 className="w-5 h-5" /> <span>تم الحل من القسم المختص</span>
                      </div>
                      <p className="bg-white p-4 rounded-[16px] text-slate-700 leading-relaxed font-medium">
                        {selectedTicket.specialistResponse}
                      </p>
                    </div>
                  )}

                  {/* Customer Information Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-5 rounded-[24px] shadow-sm flex items-center gap-4 justify-start">
                       <UserCircle className="w-6 h-6 text-primary/40" />
                       <div className="text-right">
                         <span className="text-[10px] text-slate-400 font-bold block">العميل</span>
                         <p className="font-bold text-slate-800">{selectedTicket.customerName}</p>
                       </div>
                    </div>
                    <div className="bg-white p-5 rounded-[24px] shadow-sm flex items-center gap-4 justify-start">
                       <Fingerprint className="w-6 h-6 text-primary/40" />
                       <div className="text-right">
                         <span className="text-[10px] text-slate-400 font-bold block">رقم CIF</span>
                         <p className="font-mono font-bold text-primary">{selectedTicket.cif}</p>
                       </div>
                    </div>
                    <div className="bg-white p-5 rounded-[24px] shadow-sm flex items-center gap-4 justify-start">
                       <Phone className="w-5 h-5 text-primary/40" />
                       <div className="text-right">
                         <span className="text-[10px] text-slate-400 font-bold block">رقم التواصل</span>
                         <p className="font-bold text-slate-800" dir="ltr">{selectedTicket.phoneNumber}</p>
                       </div>
                    </div>
                  </div>

                  {/* Content Area */}
                  <div className="bg-white p-8 rounded-[32px] shadow-sm space-y-4">
                     <div className="flex items-center gap-3 text-slate-800 font-black mb-4 justify-start">
                        <MessageSquare className="w-5 h-5 text-primary" /> <span>تفاصيل البلاغ</span>
                     </div>
                     <p className="text-lg leading-relaxed text-slate-600 whitespace-pre-wrap">{selectedTicket.description}</p>
                  </div>

                  {/* Timeline */}
                  <div className="space-y-4 pt-4">
                    <h3 className="font-black text-slate-800 mr-2 flex items-center gap-2 justify-start">
                       <Clock className="w-5 h-5 text-primary" /> سجل العمليات
                    </h3>
                    <div className="mr-6 space-y-4 border-r-2 border-slate-100 pr-6">
                      {selectedTicket.logs?.map((log: any, idx: number) => (
                        <div key={idx} className="relative pb-4">
                           <div className="absolute top-0 -right-[27px] w-4 h-4 rounded-full bg-white border-4 border-primary shadow-sm"></div>
                           <div className="bg-white p-4 rounded-[20px] shadow-sm">
                             <p className="font-bold text-slate-800 text-sm">{log.action}</p>
                             <div className="flex justify-between items-center mt-2">
                               <span className="text-[10px] text-slate-400">بواسطة: {log.userName}</span>
                               <span className="text-[10px] text-primary font-bold">{new Date(log.timestamp).toLocaleString('ar-SA')}</span>
                             </div>
                           </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </ScrollArea>

              <div className="p-8 border-t bg-white flex justify-between items-center">
                <Button variant="ghost" onClick={() => setSelectedTicket(null)} className="h-12 px-8 rounded-full font-bold">إغلاق</Button>
                <div className="flex gap-3">
                  <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)} className="rounded-full h-12 px-6 font-bold">
                    <Trash2 className="w-4 h-4 ml-2" /> حذف البلاغ
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent dir="rtl" className="text-right border-none rounded-[32px] p-8 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-right text-2xl font-black">هل أنت متأكد من الحذف؟</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 font-medium text-right mt-2">
              سيتم حذف هذا البلاغ نهائياً من سجلات النظام ولا يمكن التراجع عن هذه الخطوة.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-3 mt-6">
            <AlertDialogAction onClick={handleDeleteTicket} className="bg-red-600 hover:bg-red-700 h-12 px-8 rounded-full font-bold">تأكيد الحذف</AlertDialogAction>
            <AlertDialogCancel className="h-12 px-8 rounded-full font-bold">إلغاء</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
