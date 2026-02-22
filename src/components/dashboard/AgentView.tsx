
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
  Plus, Send, Search, Loader2, FileText, 
  ArrowRight, ImageIcon, 
  MessageSquare, Phone, MapPin, ExternalLink,
  Upload, User, X, Trash2, Filter, CheckCircle2, AlertCircle, Clock
} from 'lucide-react';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, 
  DialogDescription
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

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="text-right">
          <h1 className="text-2xl font-bold text-primary">متابعة بلاغات خدمة العملاء</h1>
          <p className="text-muted-foreground">تتبع حالة البلاغات، الردود، والأرشيف الفني</p>
        </div>
        {!showNewForm && (
          <Button onClick={() => setShowNewForm(true)} className="bg-accent hover:bg-accent/90 text-primary font-bold w-full md:w-auto">
            <Plus className="w-4 h-4 ml-2" /> بلاغ جديد
          </Button>
        )}
      </div>

      {showNewForm ? (
        <Card className="max-w-4xl border-2 border-primary/10 shadow-lg animate-in slide-in-from-top-4">
          <CardHeader className="bg-blue-50/50 text-right border-b flex flex-row items-center justify-between">
            <div className="text-right flex-1">
              <CardTitle className="text-primary text-xl">رفع بلاغ جديد إلى الجهات الفنية</CardTitle>
              <CardDescription>أدخل بيانات العميل والمشكلة بدقة لضمان سرعة الحل</CardDescription>
            </div>
            <Button variant="ghost" onClick={() => setShowNewForm(false)} className="mr-4">
              <ArrowRight className="w-4 h-4 ml-2" /> العودة للسجل
            </Button>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleCreateTicket} className="space-y-6">
              <div className="bg-amber-50 p-6 rounded-lg border-2 border-dashed border-accent/40 space-y-4">
                <div className="flex items-center gap-2 text-primary font-bold justify-end">
                   <span>اختيار الموظف القائم بالرفع</span>
                   <User className="w-5 h-5 text-accent" />
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
                  <Label className="font-bold">الجهة المعنية (إلى من يوجه البلاغ؟)</Label>
                  <Select onValueChange={(v) => setFormData({...formData, serviceType: v})} required dir="rtl">
                    <SelectTrigger className="text-right h-11"><SelectValue placeholder="اختر الجهة" /></SelectTrigger>
                    <SelectContent>
                      {SERVICE_ENTITIES.map(e => <SelectItem key={e.id} value={e.id}>{e.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 text-right">
                  <Label className="font-bold">اسم العميل</Label>
                  <Input placeholder="الاسم الكامل" required value={formData.customerName} onChange={e => setFormData({...formData, customerName: e.target.value})} className="text-right h-11" />
                </div>
                <div className="space-y-2 text-right">
                  <Label className="font-bold">رقم الحساب / CIF</Label>
                  <Input placeholder="أدخل الرقم" required value={formData.cif} onChange={e => setFormData({...formData, cif: e.target.value})} className="text-right font-mono h-11" />
                </div>
                <div className="space-y-2 text-right">
                  <Label className="font-bold">رقم الهاتف</Label>
                  <Input placeholder="+966..." required dir="ltr" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="text-right h-11" />
                </div>
                <div className="space-y-2 text-right">
                  <Label className="font-bold">وسيلة الاستلام</Label>
                  <Select onValueChange={(v) => setFormData({...formData, intakeMethod: v})} required dir="rtl">
                    <SelectTrigger className="text-right h-11"><SelectValue placeholder="اختر الوسيلة" /></SelectTrigger>
                    <SelectContent>
                      {INTAKE_METHODS.map(m => <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 text-right">
                  <Label className="font-bold">نوع الخدمة / المشكلة</Label>
                  <Select onValueChange={(v) => setFormData({...formData, subIssue: v})} required dir="rtl">
                    <SelectTrigger className="text-right h-11"><SelectValue placeholder="اختر المشكلة" /></SelectTrigger>
                    <SelectContent>
                      {ISSUE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2 text-right">
                <Label className="font-bold">شرح تفصيلي للمشكلة</Label>
                <Textarea placeholder="اكتب هنا..." required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="text-right min-h-[120px]" />
              </div>

              <div className="space-y-4 border-t pt-4">
                <Label className="flex items-center gap-2 font-bold text-primary justify-end">المرفقات التوضيحية <ImageIcon className="w-4 h-4" /></Label>
                <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                <Button type="button" variant="outline" className="border-dashed border-2 h-20 w-full bg-slate-50" onClick={() => fileInputRef.current?.click()} disabled={uploadingImage}>
                  {uploadingImage ? <Loader2 className="animate-spin" /> : <><Upload className="w-5 h-5 ml-2" /> إرفاق صورة (بحد أقصى 500 ك.ب)</>}
                </Button>
                <div className="grid grid-cols-4 gap-4">
                  {formData.attachments.map((att, i) => (
                    <div key={i} className="relative rounded border bg-white p-1">
                      <img src={att.url} className="h-16 w-full object-cover rounded" />
                      <Button size="icon" variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 rounded-full" onClick={() => removeAttachment(i)}><X className="h-3 w-3" /></Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t flex-row-reverse">
                <Button type="button" variant="outline" onClick={() => setShowNewForm(false)}>إلغاء</Button>
                <Button type="submit" className="bg-primary text-white font-bold" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : "إرسال البلاغ فوراً"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card className="shadow-sm">
            <CardHeader className="pb-4 border-b space-y-4">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 flex-row-reverse">
                <CardTitle className="text-lg text-right w-full flex items-center gap-2 justify-end">
                   سجل المتابعة <Filter className="w-4 h-4" />
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
              <Tabs defaultValue="all" onValueChange={setActiveTab} dir="rtl" className="w-full">
                <TabsList className="grid grid-cols-2 md:grid-cols-5 h-auto p-1 bg-slate-100">
                  <TabsTrigger value="all">الكل</TabsTrigger>
                  <TabsTrigger value="New">جديد</TabsTrigger>
                  <TabsTrigger value="Pending" className="text-amber-700">قيد المعالجة</TabsTrigger>
                  <TabsTrigger value="Escalated" className="text-red-700">المحالة</TabsTrigger>
                  <TabsTrigger value="Resolved" className="text-green-700">الأرشيف (تم الحل)</TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent className="pt-4">
              {isTicketsLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary h-8 w-8" /></div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead className="text-right">رقم البلاغ</TableHead>
                      <TableHead className="text-right">الجهة</TableHead>
                      <TableHead className="text-right">العميل</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                      <TableHead className="text-center">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTickets.map((t: any) => (
                      <TableRow key={t.id} className="hover:bg-slate-50/50">
                        <TableCell className="font-bold text-blue-600 text-right">{t.ticketID}</TableCell>
                        <TableCell className="text-right">{getEntityLabel(t.serviceType)}</TableCell>
                        <TableCell className="text-right">{t.customerName}</TableCell>
                        <TableCell className="text-right">
                          <Badge className={
                            t.status === 'Pending' ? 'status-pending' : 
                            t.status === 'Resolved' ? 'status-resolved' : 
                            t.status === 'Escalated' ? 'status-escalated' : 'status-new'
                          }>
                            {t.status === 'New' ? 'جديد' : t.status === 'Pending' ? 'قيد العمل' : t.status === 'Resolved' ? 'محلول' : 'محال'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                           <Button variant="ghost" size="sm" onClick={() => setSelectedTicket(t)} className="flex gap-1">
                             {t.status === 'Resolved' && <CheckCircle2 className="w-3 h-3 text-green-600" />}
                             التفاصيل
                           </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <Dialog open={!!selectedTicket} onOpenChange={(open) => !open && setSelectedTicket(null)}>
        <DialogContent className="max-w-3xl text-right p-0" dir="rtl">
          {selectedTicket && (
            <>
              <DialogHeader className="p-6 border-b bg-slate-50/50">
                <DialogTitle className="text-2xl text-primary flex items-center gap-2 justify-end">
                  مراجعة البلاغ {selectedTicket.ticketID}
                </DialogTitle>
                <div className="flex gap-2 justify-end mt-2">
                   <Badge variant="outline">{getEntityLabel(selectedTicket.serviceType)}</Badge>
                   <Badge className={selectedTicket.status === 'Resolved' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}>
                     {selectedTicket.status}
                   </Badge>
                </div>
              </DialogHeader>
              
              <ScrollArea className="max-h-[70vh]">
                <div className="p-6 space-y-6">
                  {/* قسم رد الأخصائي - يظهر فقط إذا كان هناك رد */}
                  {selectedTicket.specialistResponse && (
                    <div className="bg-green-50 border-2 border-green-200 p-5 rounded-xl space-y-3 animate-in zoom-in-95">
                      <div className="flex items-center gap-2 text-green-800 font-bold justify-end">
                        <span>رد القسم الفني (الحل)</span>
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <p className="text-sm leading-relaxed text-green-900 bg-white/50 p-3 rounded border border-green-100">
                        {selectedTicket.specialistResponse}
                      </p>
                      <div className="flex justify-between items-center text-[10px] text-green-700">
                         <span>بواسطة: {selectedTicket.assignedToSpecialistName || 'الأخصائي'}</span>
                         <span>تاريخ الحل: {new Date(selectedTicket.resolvedAt || '').toLocaleString('ar-SA')}</span>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6 bg-slate-50/50 p-4 rounded-lg border">
                    <div><Label className="text-[10px] text-muted-foreground block">العميل</Label><p className="font-bold">{selectedTicket.customerName}</p></div>
                    <div><Label className="text-[10px] text-muted-foreground block">الحساب (CIF)</Label><p className="font-mono font-bold">{selectedTicket.cif}</p></div>
                    <div><Label className="text-[10px] text-muted-foreground block">وسيلة الاستلام</Label><p className="font-bold">{getIntakeLabel(selectedTicket.intakeMethod)}</p></div>
                    <div><Label className="text-[10px] text-muted-foreground block">نوع المشكلة</Label><p className="font-bold text-blue-700">{selectedTicket.subIssue}</p></div>
                    <div><Label className="text-[10px] text-muted-foreground block">الموظف الرافع</Label><p className="font-bold">{selectedTicket.createdByAgentName}</p></div>
                    <div><Label className="text-[10px] text-muted-foreground block">تاريخ الرفع</Label><p className="text-xs">{new Date(selectedTicket.createdAt).toLocaleString('ar-SA')}</p></div>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-bold text-sm block">تفاصيل البلاغ الأصلي</Label>
                    <div className="bg-white border p-4 rounded-lg text-sm leading-relaxed whitespace-pre-wrap">{selectedTicket.description}</div>
                  </div>

                  {/* سجل الحركات */}
                  <div className="space-y-3 border-t pt-4">
                    <Label className="font-bold text-sm flex items-center gap-2 justify-end">تاريخ الإجراءات على البلاغ <Clock className="w-4 h-4" /></Label>
                    <div className="space-y-2">
                      {selectedTicket.logs?.map((log: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between text-xs bg-slate-50 p-2 rounded border-r-2 border-primary">
                          <span className="text-muted-foreground">{new Date(log.timestamp).toLocaleString('ar-SA')}</span>
                          <span className="font-bold text-primary">{log.action} - <span className="text-muted-foreground font-normal">({log.userName})</span></span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {selectedTicket.attachments?.length > 0 && (
                    <div className="space-y-3 border-t pt-4">
                      <Label className="font-bold text-sm block">المرفقات</Label>
                      <div className="grid grid-cols-2 gap-4">
                        {selectedTicket.attachments.map((att: any, idx: number) => (
                          <div key={idx} className="border rounded overflow-hidden">
                            <img src={att.url} className="aspect-video object-cover w-full" />
                            <a href={att.url} target="_blank" rel="noreferrer" className="flex items-center justify-center p-2 bg-slate-100 text-[10px] hover:bg-slate-200"><ExternalLink className="w-3 h-3 ml-1" /> عرض الصورة الأصلية</a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              <div className="p-6 border-t bg-slate-50/50 flex justify-between items-center flex-row-reverse">
                <Button variant="destructive" size="sm" onClick={() => setIsDeleteDialogOpen(true)} className="font-bold">
                  <Trash2 className="w-4 h-4 ml-2" /> إلغاء البلاغ نهائياً
                </Button>
                <Button variant="outline" onClick={() => setSelectedTicket(null)}>إغلاق النافذة</Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent dir="rtl" className="text-right">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد إلغاء البلاغ</AlertDialogTitle>
            <AlertDialogDescription>سيتم حذف البلاغ من قاعدة البيانات. لا يمكن التراجع عن هذا الإجراء.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2 mt-4">
            <AlertDialogAction onClick={handleDeleteTicket} className="bg-red-600">تأكيد الحذف</AlertDialogAction>
            <AlertDialogCancel>تراجع</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
