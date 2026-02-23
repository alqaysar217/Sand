
"use client"

import React, { useState, useMemo, useRef, useEffect } from 'react';
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
  Phone, Share2, MessageSquare, ImageIcon, User, Paperclip, X, Upload,
  Clock, CheckCircle2, AlertTriangle, FileText, UserCheck, MessageCircle,
  Trash2, ShieldCheck, Bell, Info
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, useDoc, deleteDocumentNonBlocking } from '@/firebase';
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
  });

  const [attachments, setAttachments] = useState<{url: string, description: string}[]>([]);

  useEffect(() => {
    const handleSidebarNav = (e: any) => {
      const action = e.detail;
      if (action === 'new-ticket') {
        setShowNewForm(true);
      } else if (['all', 'notifications', 'New', 'Pending', 'Escalated', 'Rejected', 'Resolved'].includes(action)) {
        setShowNewForm(false);
        setActiveTab(action);
      }
    };
    window.addEventListener('sidebar-nav', handleSidebarNav);
    return () => window.removeEventListener('sidebar-nav', handleSidebarNav);
  }, []);

  const allTicketsQuery = useMemoFirebase(() => {
    if (!db) return null;
    // عرض كافة البلاغات للجميع لضمان الشفافية
    return query(collection(db, 'tickets'), orderBy('createdAt', 'desc'));
  }, [db]);

  const { data: tickets } = useCollection(allTicketsQuery);

  const filteredTickets = useMemo(() => {
    if (!tickets || !user) return [];
    return tickets.filter(t => {
      const matchesSearch = (t.ticketID || '').includes(searchQuery) || (t.customerName || '').includes(searchQuery) || (t.cif || '').includes(searchQuery);
      
      let matchesTab = false;
      if (activeTab === 'all') {
        matchesTab = true;
      } else if (activeTab === 'notifications') {
        // الإشعارات تظهر فقط بلاغات المستخدم التي تم تحديثها
        matchesTab = t.createdByAgentId === user.id && t.status !== 'New';
      } else {
        matchesTab = t.status === activeTab;
      }
      
      return matchesSearch && matchesTab;
    });
  }, [tickets, searchQuery, activeTab, user]);

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
      createdByAgentName: user.name,
      attachments: attachments,
      logs: [{ 
        action: `تم رفع البلاغ وتوجيهه إلى ${formData.serviceType} بواسطة: ${user.name}`, 
        timestamp: new Date().toISOString(), 
        userName: user.name 
      }]
    };

    addDocumentNonBlocking(collection(db, 'tickets'), newTicket)
      .then(() => {
        toast({ title: "تم الرفع بنجاح", description: `رقم البلاغ: ${ticketID}` });
        setShowNewForm(false);
        setFormData({ customerName: '', cif: '', phone: '', serviceType: '', intakeMethod: '', subIssue: '', description: '' });
        setAttachments([]);
        setActiveTab('all');
      })
      .finally(() => setIsSubmitting(false));
  };

  const handleDeleteTicket = async (ticketId: string) => {
    if (!db) return;
    deleteDocumentNonBlocking(doc(db, 'tickets', ticketId));
    toast({ title: "تم الحذف", description: "تم حذف البلاغ بنجاح." });
    if (selectedTicket?.id === ticketId) setSelectedTicket(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending': return <Badge className="bg-amber-500 rounded-full font-black">قيد المعالجة</Badge>;
      case 'Resolved': return <Badge className="bg-green-600 rounded-full font-black">تم الحل</Badge>;
      case 'Rejected': return <Badge className="bg-slate-700 rounded-full font-black">مرفوض</Badge>;
      case 'Escalated': return <Badge className="bg-red-600 rounded-full font-black">محال</Badge>;
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
          <p className="text-slate-500 font-bold mt-1">
            {showNewForm ? "تعبئة بيانات البلاغ الجديد" : 
             activeTab === 'notifications' ? "إشعارات التحديثات على بلاغاتك" :
             `عرض البلاغات: ${activeTab === 'all' ? 'الكل' : getStatusBadge(activeTab).props.children}`}
          </p>
        </div>
        {!showNewForm && (
          <Button onClick={() => setShowNewForm(true)} className="banking-button premium-gradient text-white h-14 px-8 shadow-xl">
            <Plus className="w-5 h-5 ml-2" /> فتح بلاغ جديد
          </Button>
        )}
      </div>

      {showNewForm ? (
        <Card className="banking-card max-w-5xl shadow-2xl border-none mx-auto overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
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
                    موظف الرفع الحالي <User className="w-4 h-4" />
                  </Label>
                  <div className="banking-input h-14 flex items-center justify-end px-6 bg-white border-slate-200 font-black text-slate-700">
                    {user?.name} (BIM: {user?.username})
                    <ShieldCheck className="w-4 h-4 mr-2 text-green-600" />
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold mr-1">يتم تسجيل اسمك تلقائياً كمسؤول عن رفع هذا البلاغ</p>
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
                      <SelectValue placeholder="كيف تواصل العميل؟" />
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
                      <SelectValue placeholder="تصنيف المشكلة الفنية" />
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
        <Card className="banking-card overflow-hidden shadow-xl border-none animate-in fade-in duration-500">
          <CardHeader className="p-8 border-b bg-white">
            <div className="flex flex-col md:flex-row-reverse justify-between items-center gap-6">
              <CardTitle className="text-2xl font-black text-primary flex items-center gap-3">
                 {activeTab === 'notifications' ? <Bell className="w-6 h-6 text-red-500" /> : <Inbox className="w-6 h-6" />}
                 {activeTab === 'notifications' ? "إشعارات التحديثات" : "سجل كافة البلاغات"}
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
                    <TableCell className="text-right">
                      <div className="flex items-center gap-2 justify-end">
                        {t.createdByAgentId === user?.id && t.status !== 'New' && <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" title="تحديث جديد" />}
                        {getStatusBadge(t.status)}
                      </div>
                    </TableCell>
                    <TableCell className="text-center pl-8">
                      <div className="flex items-center justify-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => setSelectedTicket(t)} className="rounded-full font-black border-primary text-primary">عرض التفاصيل</Button>
                        {t.createdByAgentId === user?.id && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-50 rounded-full h-8 w-8">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent dir="rtl" className="text-right rounded-[32px]">
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="font-black text-right">تأكيد حذف البلاغ</AlertDialogTitle>
                                  <AlertDialogDescription className="text-right font-bold">
                                      هل أنت متأكد من رغبتك في حذف البلاغ رقم {t.ticketID}؟ لا يمكن التراجع عن هذا الإجراء.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter className="flex-row-reverse gap-3">
                                  <AlertDialogCancel className="rounded-full font-black">إلغاء</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteTicket(t.id)} className="bg-red-600 hover:bg-red-700 text-white rounded-full font-black">
                                      تأكيد الحذف
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredTickets?.length === 0 && (
                   <TableRow>
                      <TableCell colSpan={5} className="text-center py-20 font-black text-slate-400">
                        {activeTab === 'notifications' ? "لا توجد تحديثات جديدة على بلاغاتك" : "لا توجد بلاغات مطابقة لبحثك"}
                      </TableCell>
                   </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="max-w-4xl text-right rounded-[32px] p-0 overflow-hidden flex flex-col max-h-[90vh]" dir="rtl">
           {selectedTicket && (
             <>
                <DialogHeader className="p-8 border-b bg-primary/5 shrink-0">
                   <div className="flex justify-between items-center w-full">
                      <div className="text-right">
                        <DialogTitle className="text-2xl font-black text-primary">بلاغ رقم {selectedTicket.ticketID}</DialogTitle>
                        <DialogDescription className="font-bold text-slate-500 mt-1">
                          تاريخ الإنشاء: {new Date(selectedTicket.createdAt).toLocaleString('ar-SA')}
                        </DialogDescription>
                      </div>
                      <div className="flex items-center gap-3">
                        {getStatusBadge(selectedTicket.status)}
                        {selectedTicket.createdByAgentId === user?.id && (
                          <Button 
                            variant="destructive" 
                            size="icon" 
                            className="rounded-full h-9 w-9 shadow-lg" 
                            onClick={() => {
                              if(confirm(`هل أنت متأكد من حذف البلاغ ${selectedTicket.ticketID}؟`)) {
                                handleDeleteTicket(selectedTicket.id);
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                   </div>
                </DialogHeader>
                
                <div className="p-8 space-y-8 overflow-y-auto no-scrollbar flex-1 min-h-0">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card className="banking-card p-6 border-none shadow-md space-y-4">
                         <h4 className="font-black text-primary flex items-center gap-2 justify-end">
                            بيانات العميل <User className="w-4 h-4" />
                         </h4>
                         <div className="grid grid-cols-2 gap-4 text-right">
                            <div>
                               <span className="text-[10px] text-slate-400 font-black block">الاسم الكامل</span>
                               <p className="font-bold">{selectedTicket.customerName}</p>
                            </div>
                            <div>
                               <span className="text-[10px] text-slate-400 font-black block">رقم CIF</span>
                               <p className="font-mono font-bold">{selectedTicket.cif}</p>
                            </div>
                            <div className="col-span-2">
                               <span className="text-[10px] text-slate-400 font-black block">رقم الهاتف</span>
                               <p className="font-bold">{selectedTicket.phoneNumber}</p>
                            </div>
                         </div>
                      </Card>

                      <Card className="banking-card p-6 border-none shadow-md space-y-4">
                         <h4 className="font-black text-primary flex items-center gap-2 justify-end">
                            تفاصيل التوجيه <Share2 className="w-4 h-4" />
                         </h4>
                         <div className="grid grid-cols-2 gap-4 text-right">
                            <div>
                               <span className="text-[10px] text-slate-400 font-black block">الجهة المعنية</span>
                               <p className="font-bold text-accent">{selectedTicket.serviceType}</p>
                            </div>
                            <div>
                               <span className="text-[10px] text-slate-400 font-black block">وسيلة الاستلام</span>
                               <p className="font-bold">{selectedTicket.intakeMethod}</p>
                            </div>
                            <div>
                               <span className="text-[10px] text-slate-400 font-black block">نوع المشكلة</span>
                               <p className="font-bold">{selectedTicket.subIssue}</p>
                            </div>
                            <div>
                               <span className="text-[10px] text-slate-400 font-black block">موظف الرفع</span>
                               <p className="font-bold">{selectedTicket.createdByAgentName}</p>
                            </div>
                         </div>
                      </Card>
                   </div>

                   <div className="space-y-4">
                      <h4 className="font-black text-slate-800 flex items-center gap-2 justify-end">
                         وصف المشكلة الفنية <FileText className="w-4 h-4" />
                      </h4>
                      <div className="bg-slate-50 p-6 rounded-[24px] border border-slate-100 text-right">
                         <p className="leading-relaxed font-medium whitespace-pre-wrap">{selectedTicket.description}</p>
                      </div>

                      {selectedTicket.attachments?.length > 0 && (
                        <div className="space-y-3">
                           <h5 className="text-[10px] font-black text-slate-400 flex items-center gap-1 justify-end uppercase tracking-widest">المرفقات الفنية</h5>
                           <div className="grid grid-cols-3 gap-4">
                              {selectedTicket.attachments.map((at: any, i: number) => (
                                <div key={i} className="bg-white border p-2 rounded-2xl shadow-sm hover:shadow-md transition-shadow group relative">
                                   <img 
                                     src={at.url} 
                                     alt="attachment" 
                                     className="w-full aspect-video object-cover rounded-xl cursor-pointer" 
                                     onClick={() => window.open(at.url)} 
                                   />
                                   <div className="absolute inset-0 bg-primary/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center pointer-events-none">
                                      <ImageIcon className="text-white w-6 h-6" />
                                   </div>
                                </div>
                              ))}
                           </div>
                        </div>
                      )}
                   </div>

                   {/* حماية الردود الفنية: تظهر فقط لصاحب البلاغ */}
                   {selectedTicket.assignedToSpecialistName && (
                     <div className="space-y-4 pt-4 border-t border-slate-100">
                        <h4 className="font-black text-green-600 flex items-center gap-2 justify-end">
                           المعالجة والرد الفني <UserCheck className="w-4 h-4" />
                        </h4>
                        <div className="bg-green-50/50 p-6 rounded-[24px] border border-green-100 space-y-4">
                           <div className="flex justify-between items-center flex-row-reverse">
                              <div>
                                 <span className="text-[10px] text-slate-400 font-black block">الأخصائي المستلم</span>
                                 <p className="font-black text-slate-800">{selectedTicket.assignedToSpecialistName || 'لم يتم التحديد'}</p>
                              </div>
                              {selectedTicket.resolvedAt && (
                                <Badge className="bg-green-600">تم الحل في: {new Date(selectedTicket.resolvedAt).toLocaleDateString('ar-SA')}</Badge>
                              )}
                           </div>
                           
                           <div className="pt-4 border-t border-green-100">
                              <span className="text-[10px] text-slate-400 font-black block mb-2 uppercase flex items-center gap-1 justify-end">الرد والحل التقني <MessageCircle className="w-3 h-3" /></span>
                              {selectedTicket.createdByAgentId === user?.id ? (
                                <p className="font-bold text-slate-700 leading-relaxed italic">
                                   {selectedTicket.specialistResponse || 'جاري كتابة الرد الفني...'}
                                </p>
                              ) : (
                                <div className="flex items-center gap-2 justify-end text-slate-400 bg-white/50 p-3 rounded-xl border border-dashed">
                                  <p className="text-xs font-bold">تمت المعالجة من قبل القسم المختص (الرد التفصيلي متاح لرافع البلاغ فقط)</p>
                                  <Info className="w-4 h-4" />
                                </div>
                              )}
                           </div>
                        </div>
                     </div>
                   )}

                   <div className="space-y-4 pt-4 border-t border-slate-100 pb-8">
                      <h4 className="font-black text-slate-400 flex items-center gap-2 justify-end">
                         سجل تتبع العمليات <Clock className="w-4 h-4" />
                      </h4>
                      <div className="space-y-4">
                         {selectedTicket.logs?.map((log: any, idx: number) => (
                            <div key={idx} className="flex gap-4 flex-row-reverse items-start">
                               <div className="w-2 h-2 mt-2 rounded-full bg-slate-200 shrink-0" />
                               <div className="flex-1 text-right">
                                  <p className="text-sm font-bold text-slate-700">{log.action}</p>
                                  <p className="text-[10px] text-slate-400 mt-1">بواسطة: {log.userName} | {new Date(log.timestamp).toLocaleString('ar-SA')}</p>
                                  {/* الملاحظات في السجل تظهر فقط لصاحب البلاغ */}
                                  {log.note && selectedTicket.createdByAgentId === user?.id && (
                                    <p className="text-xs bg-white border p-3 rounded-xl mt-2 text-slate-500 font-medium">ملاحظة: {log.note}</p>
                                  )}
                               </div>
                            </div>
                         ))}
                      </div>
                   </div>
                </div>

                <div className="p-8 border-t bg-white flex justify-end shrink-0">
                   <Button onClick={() => setSelectedTicket(null)} className="banking-button premium-gradient text-white h-12 px-12 rounded-full font-black">إغلاق التفاصيل</Button>
                </div>
             </>
           )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
