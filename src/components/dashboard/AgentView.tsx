
"use client"

import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Plus, Send, Search, Loader2, FileText, 
  ArrowRight, ImageIcon, 
  MessageSquare, Phone, MapPin, ExternalLink,
  Upload, User, X, CheckCircle2, AlertCircle, Trash2
} from 'lucide-react';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, 
  DialogDescription, DialogTrigger, DialogFooter
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
  AlertDialogTrigger,
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

  const filteredTickets = tickets?.filter(t => 
    t.ticketID.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.cif.includes(searchQuery)
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 500 * 1024) {
      toast({ 
        variant: "destructive", 
        title: "حجم الملف كبير جداً", 
        description: "يرجى اختيار صورة بحجم أقل من 500 كيلوبايت لضمان حفظ البلاغ بنجاح." 
      });
      return;
    }

    setUploadingImage(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setFormData(prev => ({
        ...prev,
        attachments: [...prev.attachments, { url: base64String, description: 'لقطة شاشة مرفقة' }]
      }));
      setUploadingImage(false);
      toast({ title: "تم رفع الصورة", description: "تمت إضافة المرفق بنجاح." });
    };
    reader.onerror = () => {
      setUploadingImage(false);
      toast({ variant: "destructive", title: "خطأ", description: "فشل في قراءة ملف الصورة." });
    };
    reader.readAsDataURL(file);
  };

  const removeAttachment = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const handleDeleteTicket = (ticketId: string) => {
    if (!db) return;
    deleteDocumentNonBlocking(doc(db, 'tickets', ticketId));
    toast({
      title: "تم إلغاء البلاغ",
      description: "تم حذف البلاغ من النظام بنجاح.",
    });
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !db) return;

    if (!formData.createdByAgentName) {
      toast({ variant: "destructive", title: "تنبيه", description: "يرجى اختيار اسم الموظف الرافع للبلاغ من القائمة." });
      return;
    }

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
      attachments: formData.attachments
    };

    addDocumentNonBlocking(collection(db, 'tickets'), newTicket)
      .then(() => {
        toast({ title: "تم الرفع بنجاح", description: `تم إنشاء البلاغ رقم ${ticketID}.` });
        setShowNewForm(false);
        setFormData({ 
          customerName: '', cif: '', phone: '', serviceType: '', 
          intakeMethod: '', subIssue: '', description: '', 
          createdByAgentName: '',
          attachments: []
        });
      })
      .catch((err) => {
        console.error(err);
        toast({ 
          variant: "destructive", 
          title: "فشل الحفظ", 
          description: "تأكد من أن حجم الصور المرفقة صغير جداً." 
        });
      })
      .finally(() => setIsSubmitting(false));
  };

  const getEntityLabel = (id: string) => SERVICE_ENTITIES.find(e => e.id === id)?.label || id;
  const getIntakeLabel = (id: string) => INTAKE_METHODS.find(m => m.id === id)?.label || id;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="text-right">
          <h1 className="text-2xl font-bold text-primary">واجهة موظف خدمة العملاء</h1>
          <p className="text-muted-foreground">سجل البلاغات المرفوعة - النظام المصرفي المتكامل</p>
        </div>
        {!showNewForm && (
          <Button onClick={() => setShowNewForm(true)} className="bg-accent hover:bg-accent/90 text-primary font-bold w-full md:w-auto">
            <Plus className="w-4 h-4 ml-2" /> إنشاء بلاغ جديد
          </Button>
        )}
      </div>

      {showNewForm ? (
        <Card className="max-w-4xl border-2 border-primary/10 shadow-lg">
          <CardHeader className="bg-blue-50/50 text-right border-b flex flex-row items-center justify-between">
            <div className="text-right flex-1">
              <CardTitle className="text-primary">بيانات البلاغ الجديد</CardTitle>
              <CardDescription>يرجى تعبئة الحقول المطلوبة واختيار اسم الموظف</CardDescription>
            </div>
            <Button variant="ghost" onClick={() => setShowNewForm(false)} className="mr-4">
              <ArrowRight className="w-4 h-4 ml-2" /> العودة للسجل
            </Button>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleCreateTicket} className="space-y-6">
              <div className="bg-amber-50 p-6 rounded-lg border-2 border-dashed border-accent/40 space-y-4">
                <div className="flex items-center gap-2 text-primary font-bold justify-end">
                   <span>اسم الموظف الرافع للبلاغ</span>
                   <User className="w-5 h-5 text-accent" />
                </div>
                <Select onValueChange={(v) => setFormData({...formData, createdByAgentName: v})} required dir="rtl">
                  <SelectTrigger className="text-right bg-white border-primary/30 h-12 text-lg">
                    <SelectValue placeholder="اختر اسمك من القائمة" />
                  </SelectTrigger>
                  <SelectContent>
                    {AGENT_NAMES.map(name => <SelectItem key={name} value={name}>{name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                <div className="space-y-2 text-right">
                  <Label className="font-bold">الجهة المعنية (إرسال البلاغ إلى)</Label>
                  <Select onValueChange={(v) => setFormData({...formData, serviceType: v})} required dir="rtl">
                    <SelectTrigger className="text-right h-11"><SelectValue placeholder="اختر الجهة المعنية" /></SelectTrigger>
                    <SelectContent>
                      {SERVICE_ENTITIES.map(e => <SelectItem key={e.id} value={e.id}>{e.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2 text-right">
                  <Label className="font-bold">اسم العميل بالكامل</Label>
                  <Input placeholder="الاسم كما في الهوية" required value={formData.customerName} onChange={e => setFormData({...formData, customerName: e.target.value})} className="text-right h-11" />
                </div>

                <div className="space-y-2 text-right">
                  <Label className="font-bold">رقم الحساب / CIF</Label>
                  <Input placeholder="0000000" required value={formData.cif} onChange={e => setFormData({...formData, cif: e.target.value})} className="text-right font-mono h-11" />
                </div>

                <div className="space-y-2 text-right">
                  <Label className="font-bold">رقم هاتف العميل</Label>
                  <Input placeholder="+966..." required dir="ltr" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="text-right h-11" />
                </div>

                <div className="space-y-2 text-right">
                  <Label className="font-bold">وسيلة استلام البلاغ</Label>
                  <Select onValueChange={(v) => setFormData({...formData, intakeMethod: v})} required dir="rtl">
                    <SelectTrigger className="text-right h-11"><SelectValue placeholder="اختر وسيلة الاستلام" /></SelectTrigger>
                    <SelectContent>
                      {INTAKE_METHODS.map(m => <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 text-right">
                  <Label className="font-bold">نوع الخدمة / المشكلة</Label>
                  <Select onValueChange={(v) => setFormData({...formData, subIssue: v})} required dir="rtl">
                    <SelectTrigger className="text-right h-11"><SelectValue placeholder="اختر نوع المشكلة" /></SelectTrigger>
                    <SelectContent>
                      {ISSUE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2 text-right">
                <Label className="font-bold">تفاصيل المشكلة</Label>
                <Textarea placeholder="اشرح المشكلة بالتفصيل..." required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="text-right min-h-[120px]" />
              </div>

              <div className="space-y-4 border-t pt-4">
                <div className="flex items-center justify-between flex-row-reverse">
                  <Label className="flex items-center gap-2 font-bold text-primary">إرفاق صور توضيحية (لقطة شاشة) <ImageIcon className="w-4 h-4" /></Label>
                  <span className="text-[10px] text-red-600 font-bold">الحجم الأقصى للصورة: 500 كيلوبايت</span>
                </div>
                
                <div className="flex justify-end">
                   <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={handleFileChange}
                   />
                   <Button 
                    type="button" 
                    variant="outline" 
                    className="border-dashed border-2 h-24 w-full bg-slate-50 hover:bg-slate-100 flex flex-col gap-2"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                   >
                     {uploadingImage ? <Loader2 className="animate-spin" /> : (
                       <>
                        <Upload className="w-6 h-6 text-primary/40" />
                        <span>اضغط هنا لاختيار صورة من جهازك</span>
                       </>
                     )}
                   </Button>
                </div>

                {formData.attachments.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    {formData.attachments.map((att, index) => (
                      <div key={index} className="relative group rounded-md overflow-hidden border-2 border-primary/10">
                        <img src={att.url} alt="مرفق" className="w-full h-24 object-cover" />
                        <button 
                          type="button"
                          onClick={() => removeAttachment(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t flex-row-reverse">
                <Button type="button" variant="outline" onClick={() => setShowNewForm(false)} className="px-8">إلغاء</Button>
                <Button type="submit" className="bg-primary text-white px-12 h-12 text-lg font-bold" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <><Send className="w-4 h-4 ml-2 rotate-180" /> إرسال البلاغ الآن</>}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-md">
          <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 gap-4 flex-row-reverse border-b">
            <CardTitle className="text-lg text-right w-full">سجل البلاغات الأخير</CardTitle>
            <div className="relative w-full md:w-64">
              <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="بحث..." 
                className="pr-10 text-right h-9" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {isTicketsLoading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <Loader2 className="animate-spin text-primary h-8 w-8" />
                <p className="text-sm text-muted-foreground">جاري تحميل سجل البلاغات...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/50">
                      <TableHead className="text-right">رقم البلاغ</TableHead>
                      <TableHead className="text-right">التاريخ</TableHead>
                      <TableHead className="text-right">الجهة المعنية</TableHead>
                      <TableHead className="text-right">اسم العميل</TableHead>
                      <TableHead className="text-right">CIF</TableHead>
                      <TableHead className="text-right">الموظف</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                      <TableHead className="text-center">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTickets && filteredTickets.length > 0 ? (
                      filteredTickets.map((ticket: any) => (
                        <TableRow key={ticket.id} className="hover:bg-slate-50/50 transition-colors">
                          <TableCell className="font-bold text-blue-600 text-right">{ticket.ticketID}</TableCell>
                          <TableCell className="text-xs text-right whitespace-nowrap">{new Date(ticket.createdAt).toLocaleDateString('ar-SA')}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant="outline" className="font-normal bg-blue-50/50">{getEntityLabel(ticket.serviceType)}</Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium">{ticket.customerName}</TableCell>
                          <TableCell className="text-right font-mono text-xs">{ticket.cif}</TableCell>
                          <TableCell className="text-right text-xs font-bold text-slate-600">{ticket.createdByAgentName}</TableCell>
                          <TableCell className="text-right">
                            <Badge className={
                              ticket.status === 'Pending' ? 'status-pending' : 
                              ticket.status === 'Resolved' ? 'status-resolved' : 
                              ticket.status === 'New' ? 'status-new' : ''
                            }>
                              {ticket.status === 'New' ? 'جديد' : ticket.status === 'Pending' ? 'قيد المعالجة' : 'تم الحل'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 hover:text-primary">
                                    <FileText className="w-3 h-3 ml-1" /> التفاصيل
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-3xl text-right p-0" dir="rtl">
                                  <ScrollArea className="max-h-[85vh]">
                                    <div className="p-6">
                                      <DialogHeader className="mb-6">
                                        <DialogTitle className="text-2xl text-primary flex items-center gap-2 justify-end">
                                          تفاصيل البلاغ {ticket.ticketID}
                                        </DialogTitle>
                                        <DialogDescription className="text-right font-bold text-secondary">بواسطة الموظف: {ticket.createdByAgentName}</DialogDescription>
                                      </DialogHeader>
                                      
                                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-4 border-t border-b bg-slate-50/50 rounded-lg p-4">
                                        <div className="space-y-1">
                                          <Label className="text-muted-foreground text-[10px] uppercase">اسم العميل</Label>
                                          <p className="font-bold">{ticket.customerName}</p>
                                        </div>
                                        <div className="space-y-1">
                                          <Label className="text-muted-foreground text-[10px] uppercase">رقم الحساب (CIF)</Label>
                                          <p className="font-mono font-bold text-blue-700">{ticket.cif}</p>
                                        </div>
                                        <div className="space-y-1">
                                          <Label className="text-muted-foreground text-[10px] uppercase">رقم الهاتف</Label>
                                          <p className="font-mono" dir="ltr">{ticket.phoneNumber}</p>
                                        </div>
                                        <div className="space-y-1">
                                          <Label className="text-muted-foreground text-[10px] uppercase">وسيلة الاستلام</Label>
                                          <p className="font-bold">{getIntakeLabel(ticket.intakeMethod)}</p>
                                        </div>
                                        <div className="space-y-1">
                                          <Label className="text-muted-foreground text-[10px] uppercase">الجهة المعنية</Label>
                                          <p className="font-bold text-blue-700">{getEntityLabel(ticket.serviceType)}</p>
                                        </div>
                                        <div className="space-y-1">
                                          <Label className="text-muted-foreground text-[10px] uppercase">نوع الخدمة</Label>
                                          <p className="font-bold">{ticket.subIssue}</p>
                                        </div>
                                      </div>

                                      <div className="py-6">
                                        <Label className="text-muted-foreground text-[10px] uppercase block mb-2 font-bold">تفاصيل المشكلة المشروحة</Label>
                                        <div className="bg-white border-2 border-slate-100 p-4 rounded-lg text-sm leading-relaxed whitespace-pre-wrap shadow-inner">
                                          {ticket.description}
                                        </div>
                                      </div>

                                      {ticket.attachments && ticket.attachments.length > 0 && (
                                        <div className="py-4 border-t">
                                          <Label className="text-muted-foreground text-[10px] uppercase block mb-3 font-bold">المرفقات التوضيحية</Label>
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {ticket.attachments.map((att: any, idx: number) => (
                                              <div key={idx} className="space-y-2 border-2 border-slate-100 rounded-lg p-2 bg-white group shadow-sm">
                                                <div className="relative aspect-video rounded-md overflow-hidden bg-black flex items-center justify-center">
                                                  <img src={att.url} alt="مرفق" className="max-w-full max-h-full object-contain" />
                                                  <a 
                                                    href={att.url} 
                                                    target="_blank" 
                                                    rel="noreferrer" 
                                                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-2"
                                                  >
                                                    <ExternalLink className="w-5 h-5" /> تكبير الصورة
                                                  </a>
                                                </div>
                                                <p className="text-[10px] text-center text-muted-foreground font-bold">{att.description}</p>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}

                                      <div className="mt-8 pt-4 border-t flex justify-between items-center flex-row-reverse">
                                        <div className="flex items-center gap-2">
                                          <Badge variant="outline" className="bg-slate-100">{new Date(ticket.createdAt).toLocaleString('ar-SA')}</Badge>
                                          <Label className="text-[10px] text-muted-foreground">تاريخ الإنشاء:</Label>
                                        </div>
                                        <AlertDialog>
                                          <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50">
                                              <Trash2 className="w-4 h-4 ml-2" /> إلغاء (حذف) البلاغ
                                            </Button>
                                          </AlertDialogTrigger>
                                          <AlertDialogContent dir="rtl" className="text-right">
                                            <AlertDialogHeader>
                                              <AlertDialogTitle>هل أنت متأكد من إلغاء البلاغ؟</AlertDialogTitle>
                                              <AlertDialogDescription>
                                                سيتم حذف هذا البلاغ بشكل نهائي من النظام ولا يمكن استرجاعه.
                                              </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter className="flex-row-reverse gap-2">
                                              <AlertDialogAction onClick={() => handleDeleteTicket(ticket.id)} className="bg-red-600 hover:bg-red-700">تأكيد الإلغاء</AlertDialogAction>
                                              <AlertDialogCancel>تراجع</AlertDialogCancel>
                                            </AlertDialogFooter>
                                          </AlertDialogContent>
                                        </AlertDialog>
                                      </div>
                                    </div>
                                  </ScrollArea>
                                </DialogContent>
                              </Dialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-20 text-muted-foreground">لا توجد بلاغات مطابقة لبحثك حالياً.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
