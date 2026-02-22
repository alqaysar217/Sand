
"use client"

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Plus, Send, Copy, Search, Loader2, FileText, Check, 
  ArrowRight, AlertCircle, RefreshCw, Image as ImageIcon, 
  MessageSquare, Phone, MapPin, ExternalLink
} from 'lucide-react';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, 
  DialogDescription, DialogFooter, DialogTrigger 
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { Textarea } from '@/components/ui/textarea';

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

export function AgentView() {
  const { user } = useAuth();
  const db = useFirestore();
  const { toast } = useToast();
  const [showNewForm, setShowNewForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);

  const [formData, setFormData] = useState({
    customerName: '',
    cif: '',
    phone: '',
    serviceType: '',
    intakeMethod: '',
    subIssue: '',
    description: '',
    attachmentUrl: '',
    attachmentDesc: ''
  });

  const agentTicketsQuery = useMemoFirebase(() => {
    if (!db || !user?.id) return null;
    return query(
      collection(db, 'tickets'),
      where('createdByAgentId', '==', user.id),
      orderBy('createdAt', 'desc')
    );
  }, [db, user?.id]);

  const { data: tickets, isLoading: isTicketsLoading, error: queryError } = useCollection(agentTicketsQuery);

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
      attachments: formData.attachmentUrl ? [
        { url: formData.attachmentUrl, description: formData.attachmentDesc }
      ] : []
    };

    addDocumentNonBlocking(collection(db, 'tickets'), newTicket)
      .then(() => {
        toast({ title: "تم الرفع بنجاح", description: `تم إنشاء البلاغ رقم ${ticketID}.` });
        setShowNewForm(false);
        setFormData({ 
          customerName: '', cif: '', phone: '', serviceType: '', 
          intakeMethod: '', subIssue: '', description: '', 
          attachmentUrl: '', attachmentDesc: '' 
        });
      })
      .catch(() => {
        toast({ variant: "destructive", title: "خطأ", description: "فشل إنشاء البلاغ." });
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
          <p className="text-muted-foreground">أهلاً بك، {user?.name} - سجل بلاغاتك المرفوعة</p>
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
              <CardDescription>يرجى تعبئة كافة الحقول المطلوبة بدقة</CardDescription>
            </div>
            <Button variant="ghost" onClick={() => setShowNewForm(false)} className="mr-4">
              <ArrowRight className="w-4 h-4 ml-2" /> العودة للسجل
            </Button>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleCreateTicket} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 text-right">
                  <Label>الجهة المعنية (إرسال البلاغ إلى)</Label>
                  <Select onValueChange={(v) => setFormData({...formData, serviceType: v})} required dir="rtl">
                    <SelectTrigger className="text-right"><SelectValue placeholder="اختر الجهة" /></SelectTrigger>
                    <SelectContent>
                      {SERVICE_ENTITIES.map(e => <SelectItem key={e.id} value={e.id}>{e.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 text-right">
                  <Label>وسيلة استلام البلاغ</Label>
                  <Select onValueChange={(v) => setFormData({...formData, intakeMethod: v})} required dir="rtl">
                    <SelectTrigger className="text-right"><SelectValue placeholder="اختر الوسيلة" /></SelectTrigger>
                    <SelectContent>
                      {INTAKE_METHODS.map(m => <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 text-right">
                  <Label>اسم العميل بالكامل</Label>
                  <Input placeholder="الاسم كما في الهوية" required value={formData.customerName} onChange={e => setFormData({...formData, customerName: e.target.value})} className="text-right" />
                </div>
                <div className="space-y-2 text-right">
                  <Label>رقم الحساب / CIF</Label>
                  <Input placeholder="0000000" required value={formData.cif} onChange={e => setFormData({...formData, cif: e.target.value})} className="text-right font-mono" />
                </div>
                <div className="space-y-2 text-right">
                  <Label>رقم هاتف العميل</Label>
                  <Input placeholder="+966..." required dir="ltr" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="text-right" />
                </div>
                <div className="space-y-2 text-right">
                  <Label>نوع الخدمة / المشكلة</Label>
                  <Select onValueChange={(v) => setFormData({...formData, subIssue: v})} required dir="rtl">
                    <SelectTrigger className="text-right"><SelectValue placeholder="اختر نوع المشكلة" /></SelectTrigger>
                    <SelectContent>
                      {ISSUE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2 text-right">
                <Label>تفاصيل المشكلة</Label>
                <Textarea placeholder="اشرح المشكلة بالتفصيل..." required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="text-right min-h-[100px]" />
              </div>

              <div className="space-y-4 border-t pt-4">
                <Label className="flex items-center gap-2 justify-end text-primary font-bold">إضافة مرفق (اختياري) <ImageIcon className="w-4 h-4" /></Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input placeholder="رابط الصورة (URL)" value={formData.attachmentUrl} onChange={e => setFormData({...formData, attachmentUrl: e.target.value})} className="text-right" />
                  <Input placeholder="وصف المرفق (مثلاً: لقطة شاشة للتطبيق)" value={formData.attachmentDesc} onChange={e => setFormData({...formData, attachmentDesc: e.target.value})} className="text-right" />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t flex-row-reverse">
                <Button type="button" variant="outline" onClick={() => setShowNewForm(false)}>إلغاء</Button>
                <Button type="submit" className="bg-primary text-white px-10" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4 ml-2 rotate-180" /> إرسال البلاغ</>}
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
              <Input placeholder="بحث برقم البلاغ..." className="pr-10 text-right h-9" />
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {isTicketsLoading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <Loader2 className="animate-spin text-primary h-8 w-8" />
                <p className="text-sm text-muted-foreground">جاري تحميل السجل...</p>
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
                      <TableHead className="text-right">الحالة</TableHead>
                      <TableHead className="text-center">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tickets && tickets.length > 0 ? (
                      tickets.map((ticket: any) => (
                        <TableRow key={ticket.id} className="hover:bg-slate-50/50 transition-colors">
                          <TableCell className="font-bold text-blue-600 text-right">{ticket.ticketID}</TableCell>
                          <TableCell className="text-xs text-right whitespace-nowrap">{new Date(ticket.createdAt).toLocaleDateString('ar-SA')}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant="outline" className="font-normal">{getEntityLabel(ticket.serviceType)}</Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium">{ticket.customerName}</TableCell>
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
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 hover:text-primary">
                                  <FileText className="w-3 h-3 ml-1" /> التفاصيل
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl text-right" dir="rtl">
                                <DialogHeader>
                                  <DialogTitle className="text-2xl text-primary flex items-center gap-2 justify-end">
                                    تفاصيل البلاغ {ticket.ticketID}
                                  </DialogTitle>
                                  <DialogDescription className="text-right">تم الرفع بواسطة: {ticket.createdByAgentName}</DialogDescription>
                                </DialogHeader>
                                <div className="grid grid-cols-2 gap-6 py-4 border-t border-b">
                                  <div className="space-y-1">
                                    <Label className="text-muted-foreground text-xs uppercase">اسم العميل</Label>
                                    <p className="font-bold">{ticket.customerName}</p>
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-muted-foreground text-xs uppercase">رقم الحساب (CIF)</Label>
                                    <p className="font-mono font-bold">{ticket.cif}</p>
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-muted-foreground text-xs uppercase">رقم الهاتف</Label>
                                    <p className="font-mono" dir="ltr">{ticket.phoneNumber}</p>
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-muted-foreground text-xs uppercase">وسيلة الاستلام</Label>
                                    <p className="font-bold">{getIntakeLabel(ticket.intakeMethod)}</p>
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-muted-foreground text-xs uppercase">الجهة المعنية</Label>
                                    <p className="font-bold text-blue-700">{getEntityLabel(ticket.serviceType)}</p>
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-muted-foreground text-xs uppercase">نوع المشكلة</Label>
                                    <p className="font-bold">{ticket.subIssue}</p>
                                  </div>
                                </div>
                                <div className="py-4">
                                  <Label className="text-muted-foreground text-xs uppercase block mb-2">تفاصيل المشكلة</Label>
                                  <div className="bg-slate-50 p-4 rounded-lg text-sm leading-relaxed">
                                    {ticket.description}
                                  </div>
                                </div>
                                {ticket.attachments && ticket.attachments.length > 0 && (
                                  <div className="py-4 border-t">
                                    <Label className="text-muted-foreground text-xs uppercase block mb-3">المرفقات</Label>
                                    <div className="space-y-2">
                                      {ticket.attachments.map((att: any, idx: number) => (
                                        <div key={idx} className="flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-100">
                                          <a href={att.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center gap-1 text-sm">
                                            عرض المرفق <ExternalLink className="w-3 h-3" />
                                          </a>
                                          <span className="text-xs font-medium">{att.description}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-20 text-muted-foreground">لا توجد بلاغات مرفوعة حالياً.</TableCell>
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
