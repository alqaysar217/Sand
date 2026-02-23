
"use client"

import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  CheckCircle2, 
  UserPlus, 
  MessageSquare, 
  Sparkles, 
  ArrowRight, 
  Loader2, 
  AlertCircle, 
  Clock,
  History,
  UserCircle,
  Fingerprint,
  Phone,
  Building2,
  Calendar,
  Inbox,
  Paperclip,
  Eye,
  FileText,
  XCircle,
  Send,
  Filter
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { smartResponseAssistant } from '@/ai/flows/smart-response-assistant';
import { useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking, useDoc } from '@/firebase';
import { collection, query, where, doc, orderBy, arrayUnion } from 'firebase/firestore';

export function SpecialistView() {
  const { user } = useAuth();
  const db = useFirestore();
  const { toast } = useToast();
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [response, setResponse] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeStatusFilter, setActiveStatusFilter] = useState('all');
  const [activeDeptFilter, setActiveDeptFilter] = useState('all');
  
  // حالة نافذة اختيار الاسم عند الاستلام
  const [claimDialogOpen, setClaimDialogOpen] = useState(false);
  const [ticketToClaim, setTicketToClaim] = useState<any | null>(null);
  const [selectedStaffName, setSelectedStaffName] = useState('');

  // جلب إعدادات النظام للحصول على أسماء الموظفين
  const configRef = useMemoFirebase(() => db ? doc(db, 'settings', 'system-config') : null, [db]);
  const { data: config } = useDoc(configRef);

  // ربط التنقل من القائمة الجانبية
  useEffect(() => {
    const handleSync = (e: any) => {
      const action = e.detail;
      if (['all', 'Pending', 'Escalated', 'Resolved', 'Rejected'].includes(action)) {
        setActiveStatusFilter(action);
        setSelectedTicket(null);
      }
    };
    window.addEventListener('sidebar-nav', handleSync);
    return () => window.removeEventListener('sidebar-nav', handleSync);
  }, []);

  // جلب كافة البلاغات (ليتمكن الأخصائي من رؤية كل شيء والفلترة)
  const allTicketsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'tickets'), orderBy('createdAt', 'desc'));
  }, [db]);

  const { data: allTickets, isLoading: isTicketsLoading } = useCollection(allTicketsQuery);

  // الفلترة في الواجهة
  const filteredTickets = useMemo(() => {
    if (!allTickets) return [];
    return allTickets.filter(t => {
      const matchesStatus = activeStatusFilter === 'all' || t.status === activeStatusFilter;
      const matchesDept = activeDeptFilter === 'all' || t.serviceType === activeDeptFilter;
      return matchesStatus && matchesDept;
    });
  }, [allTickets, activeStatusFilter, activeDeptFilter]);

  const handleOpenClaimDialog = (ticket: any) => {
    setTicketToClaim(ticket);
    setClaimDialogOpen(true);
  };

  const handleClaimConfirm = () => {
    if (!db || !user || !ticketToClaim || !selectedStaffName) {
      toast({ variant: "destructive", title: "تنبيه", description: "يرجى اختيار اسمك من القائمة." });
      return;
    }

    const ticketRef = doc(db, 'tickets', ticketToClaim.id);
    updateDocumentNonBlocking(ticketRef, {
      assignedToSpecialistId: user.id,
      assignedToSpecialistName: selectedStaffName,
      status: 'Pending',
      logs: arrayUnion({
        action: `تم استلام البلاغ بواسطة الأخصائي: ${selectedStaffName}`,
        timestamp: new Date().toISOString(),
        userName: selectedStaffName
      })
    });

    toast({ title: "تم الاستلام", description: `تم تعيين البلاغ لـ ${selectedStaffName}` });
    setClaimDialogOpen(false);
    setTicketToClaim(null);
    setSelectedStaffName('');
  };

  const handleAction = async (actionType: 'Resolved' | 'Rejected' | 'Escalated') => {
    if (!db || !user || !selectedTicket) return;
    if (!response.trim()) {
      toast({ variant: "destructive", title: "تنبيه", description: "يجب كتابة رد فني يوضح الإجراء المتخذ." });
      return;
    }

    setIsProcessing(true);
    const ticketRef = doc(db, 'tickets', selectedTicket.id);
    
    let actionText = '';
    switch(actionType) {
      case 'Resolved': actionText = 'تم اعتماد الحل الفني وإغلاق البلاغ'; break;
      case 'Rejected': actionText = 'تم رفض البلاغ مع ذكر السبب'; break;
      case 'Escalated': actionText = 'تمت إحالة البلاغ للمستوى الأعلى'; break;
    }

    const updateData: any = {
      status: actionType,
      logs: arrayUnion({
        action: actionText,
        timestamp: new Date().toISOString(),
        userName: selectedTicket.assignedToSpecialistName || user.name,
        note: response
      })
    };

    if (actionType === 'Resolved') {
      updateData.specialistResponse = response;
      updateData.resolvedAt = new Date().toISOString();
    } else if (actionType === 'Rejected') {
      updateData.rejectionReason = response;
      updateData.rejectedAt = new Date().toISOString();
    }

    try {
      updateDocumentNonBlocking(ticketRef, updateData);
      toast({ title: "تم التحديث", description: "تم تحديث حالة البلاغ بنجاح." });
      setSelectedTicket(null);
      setResponse('');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAiSuggest = async () => {
    if (!selectedTicket) return;
    setIsGenerating(true);
    try {
      const result = await smartResponseAssistant({
        complaintDetails: `المشكلة: ${selectedTicket.subIssue}, التفاصيل: ${selectedTicket.description}`,
        resolutionHistory: ["تفعيل البطاقة المجمدة", "تغيير رمز PIN", "تحديث بيانات KYC"]
      });
      setResponse(result.suggestedResponse);
      toast({ title: "اقتراح ذكي", description: "تم توليد رد فني مقترح." });
    } finally {
      setIsGenerating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending': return <Badge className="bg-amber-500 text-white rounded-full px-4 font-black">قيد المعالجة</Badge>;
      case 'Resolved': return <Badge className="bg-green-600 text-white rounded-full px-4 font-black">تم الحل</Badge>;
      case 'Rejected': return <Badge className="bg-slate-800 text-white rounded-full px-4 font-black">مرفوض</Badge>;
      case 'Escalated': return <Badge className="bg-red-600 text-white rounded-full px-4 font-black">محال</Badge>;
      default: return <Badge className="bg-blue-600 text-white rounded-full px-4 font-black">جديد</Badge>;
    }
  };

  if (selectedTicket) {
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 text-right h-[calc(100vh-120px)] overflow-y-auto no-scrollbar pb-10" dir="rtl">
        <div className="flex items-center justify-between flex-row-reverse">
          <Button variant="ghost" onClick={() => setSelectedTicket(null)} className="rounded-full hover:bg-white text-slate-500 font-black px-6">
            <ArrowRight className="w-5 h-5 ml-2" /> العودة لمحطة العمل
          </Button>
          <div className="flex items-center gap-3 flex-row-reverse">
            <span className="text-slate-400 font-black text-xs">الحالة:</span>
            {getStatusBadge(selectedTicket.status)}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8 text-right">
            <Card className="banking-card border-r-4 border-r-primary shadow-xl">
              <CardHeader className="bg-slate-50/50 p-8 border-b">
                <div className="flex items-center gap-4 flex-row-reverse">
                  <div className="p-4 bg-primary/5 rounded-[20px] border border-primary/10">
                    <Inbox className="w-8 h-8 text-primary" />
                  </div>
                  <div className="text-right">
                    <CardTitle className="text-2xl font-black text-primary">معالجة بلاغ رقم: {selectedTicket.ticketID}</CardTitle>
                    <p className="text-xs text-slate-400 font-bold mt-1">تاريخ الورود: {new Date(selectedTicket.createdAt).toLocaleString('ar-SA')}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-[20px] flex items-center gap-3 flex-row-reverse border border-slate-100">
                    <UserCircle className="w-5 h-5 text-primary" />
                    <div className="text-right"><span className="text-[10px] text-slate-400 block font-black">اسم العميل</span><p className="font-black text-sm">{selectedTicket.customerName}</p></div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-[20px] flex items-center gap-3 flex-row-reverse border border-slate-100">
                    <Fingerprint className="w-5 h-5 text-primary" />
                    <div className="text-right"><span className="text-[10px] text-slate-400 block font-black">رقم CIF</span><p className="font-mono font-black text-sm">{selectedTicket.cif}</p></div>
                  </div>
                </div>

                <div className="space-y-4">
                   <div className="flex items-center gap-3 justify-end px-2">
                      <h3 className="font-black text-xl text-slate-900">تفاصيل المشكلة الفنية</h3>
                      <MessageSquare className="w-6 h-6 text-primary" />
                   </div>
                   <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm text-lg leading-relaxed text-slate-700 text-right relative">
                      <div className="flex justify-end mb-4">
                        <Badge className="bg-primary/5 border-primary/10 text-primary font-black px-6 py-2 rounded-full border">{selectedTicket.subIssue}</Badge>
                      </div>
                      <p>{selectedTicket.description}</p>
                   </div>
                </div>

                <div className="space-y-4 pt-10 border-t">
                   <div className="flex items-center justify-between px-2 flex-row-reverse">
                      <div className="flex items-center gap-3 flex-row-reverse">
                        <CheckCircle2 className="w-6 h-6 text-green-600" />
                        <h3 className="font-black text-xl text-slate-900">الرد الفني والحل المقترح</h3>
                      </div>
                      <Button variant="outline" size="sm" onClick={handleAiSuggest} disabled={isGenerating} className="rounded-full border-accent/20 hover:bg-accent/5 text-accent font-black h-11">
                         {isGenerating ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Sparkles className="w-4 h-4 ml-2" />}
                         مساعد الرد الذكي
                      </Button>
                   </div>
                   <Textarea 
                      value={response} 
                      onChange={(e) => setResponse(e.target.value)} 
                      placeholder="اكتب ردك الفني المفصل هنا..." 
                      className="banking-input min-h-[200px] p-8 text-lg text-right shadow-inner" 
                   />
                   
                   <div className="flex flex-wrap justify-end gap-4 pt-6">
                      <Button variant="outline" className="h-16 px-10 rounded-[28px] border-red-200 text-red-600 hover:bg-red-50 font-black text-lg" onClick={() => handleAction('Rejected')} disabled={isProcessing}>
                         <XCircle className="w-6 h-6 ml-2" /> رفض البلاغ
                      </Button>
                      <Button variant="outline" className="h-16 px-10 rounded-[28px] border-amber-200 text-amber-600 hover:bg-amber-50 font-black text-lg" onClick={() => handleAction('Escalated')} disabled={isProcessing}>
                         <Send className="w-6 h-6 ml-2" /> إحالة للمشرف
                      </Button>
                      <Button className="banking-button premium-gradient text-white h-16 px-16 text-xl shadow-2xl" onClick={() => handleAction('Resolved')} disabled={isProcessing}>
                         <CheckCircle2 className="w-6 h-6 ml-2" /> اعتماد الحل
                      </Button>
                   </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-8">
             <Card className="banking-card shadow-lg border-none overflow-hidden">
                <CardHeader className="p-6 border-b bg-slate-50/50 flex items-center gap-3 justify-start flex-row-reverse">
                   <History className="w-5 h-5 text-primary" />
                   <CardTitle className="text-lg font-black text-slate-800">تتبع البلاغ</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                   <div className="space-y-6">
                      {selectedTicket.logs?.map((log: any, idx: number) => (
                        <div key={idx} className="relative pr-6 border-r-2 border-slate-100 last:border-0 pb-6 text-right">
                           <div className="absolute top-0 -right-[7px] w-3.5 h-3.5 rounded-full bg-primary border-2 border-white shadow-sm"></div>
                           <p className="font-black text-slate-800 text-xs">{log.action}</p>
                           <p className="text-[10px] text-slate-400 font-black mt-1">{new Date(log.timestamp).toLocaleString('ar-SA')}</p>
                           {log.note && <p className="mt-2 text-[11px] bg-slate-50 p-2 rounded-lg border border-slate-100 font-bold text-slate-600">{log.note}</p>}
                        </div>
                      ))}
                   </div>
                </CardContent>
             </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 text-right" dir="rtl">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="text-right">
          <h1 className="text-4xl font-black text-primary tracking-tight">محطة العمل الفنية</h1>
          <p className="text-slate-500 font-bold mt-2">إدارة ومعالجة البلاغات المصرفية - قسم <span className="text-secondary">{user?.department}</span></p>
        </div>
        <div className="flex gap-4 items-center">
           <Label className="font-black text-slate-400 text-xs hidden md:block">فلترة حسب القسم:</Label>
           <Select value={activeDeptFilter} onValueChange={setActiveDeptFilter}>
              <SelectTrigger className="w-[200px] banking-input h-11 text-right font-black">
                <SelectValue placeholder="كل الأقسام" />
              </SelectTrigger>
              <SelectContent dir="rtl">
                 <SelectItem value="all">كل الأقسام</SelectItem>
                 {config?.serviceTypes?.map((s: string) => <SelectItem key={s} value={s}>{s}</SelectItem>) || (
                   ['كول سنتر', 'إدارة البطائق', 'مشاكل التطبيق'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)
                 )}
              </SelectContent>
           </Select>
        </div>
      </div>

      <Card className="banking-card overflow-hidden shadow-2xl border-none bg-white">
        <CardHeader className="p-8 border-b bg-slate-50/30">
          <div className="flex items-center gap-4 justify-start flex-row-reverse">
            <div className="p-4 bg-primary/5 rounded-[22px]"><Inbox className="w-8 h-8 text-primary" /></div>
            <div className="text-right">
              <CardTitle className="text-2xl text-primary font-black">
                {activeStatusFilter === 'all' ? 'صندوق المهام الواردة' : 
                 activeStatusFilter === 'Pending' ? 'بلاغات قيد المعالجة' :
                 activeStatusFilter === 'Resolved' ? 'بلاغات تم حلها' :
                 activeStatusFilter === 'Rejected' ? 'بلاغات مرفوضة' : 'بلاغات محالة'}
              </CardTitle>
              <p className="text-slate-400 font-bold mt-1">إجمالي المعروض: {filteredTickets.length} بلاغ</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isTicketsLoading ? (
            <div className="flex justify-center py-24"><Loader2 className="animate-spin text-primary h-14 w-14" /></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-primary">
                  <TableRow className="border-none hover:bg-primary">
                    <TableHead className="text-right h-18 font-black text-white pr-12">رقم البلاغ</TableHead>
                    <TableHead className="text-right h-18 font-black text-white">العميل</TableHead>
                    <TableHead className="text-right h-18 font-black text-white">نوع المشكلة</TableHead>
                    <TableHead className="text-right h-18 font-black text-white">القسم المعني</TableHead>
                    <TableHead className="text-right h-18 font-black text-white">الحالة</TableHead>
                    <TableHead className="text-center h-18 font-black text-white pl-12">الإجراء</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTickets?.map((t: any, index: number) => (
                    <TableRow key={t.id} className={`transition-colors border-b border-slate-100 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                      <TableCell className="py-6 font-black text-primary pr-12 text-right">
                        <span className="bg-primary/5 px-4 py-2 rounded-full text-xs">{t.ticketID}</span>
                      </TableCell>
                      <TableCell className="py-6 text-right">
                         <div className="font-black text-slate-800 text-sm">{t.customerName}</div>
                         <div className="text-[10px] text-slate-400 font-mono">{t.cif}</div>
                      </TableCell>
                      <TableCell className="py-6 text-right">
                        <Badge variant="outline" className="font-black border-slate-200 text-slate-500">{t.subIssue}</Badge>
                      </TableCell>
                      <TableCell className="py-6 text-right font-bold text-slate-500 text-xs">{t.serviceType}</TableCell>
                      <TableCell className="py-6 text-right">{getStatusBadge(t.status)}</TableCell>
                      <TableCell className="py-6 text-center pl-12">
                        {!t.assignedToSpecialistId ? (
                          <Button onClick={() => handleOpenClaimDialog(t)} className="banking-button premium-gradient text-white h-11 px-8 font-black">
                             <UserPlus className="w-4 h-4 ml-2" /> استلام البلاغ
                          </Button>
                        ) : (
                          <Button variant="outline" onClick={() => setSelectedTicket(t)} className="rounded-full h-11 px-8 border-primary text-primary hover:bg-primary hover:text-white font-black">
                             {t.assignedToSpecialistId === user?.id ? 'فتح المعالجة' : 'عرض التفاصيل'}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!filteredTickets || filteredTickets.length === 0) && (
                    <TableRow><TableCell colSpan={6} className="text-center py-32 font-black text-slate-400">لا توجد بلاغات حالياً ضمن هذه الفلترة</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* نافذة اختيار الاسم عند الاستلام */}
      <Dialog open={claimDialogOpen} onOpenChange={setClaimDialogOpen}>
         <DialogContent className="max-w-md text-right rounded-[32px] border-none" dir="rtl">
            <DialogHeader>
               <DialogTitle className="text-2xl font-black text-primary text-right">تأكيد استلام البلاغ</DialogTitle>
               <DialogDescription className="text-right font-bold text-slate-500">يرجى اختيار اسم الأخصائي القائم بالعمل لتوثيق المسؤولية الفنية.</DialogDescription>
            </DialogHeader>
            <div className="py-6 space-y-4">
               <Label className="font-black text-slate-700 text-xs mr-1">اسم الأخصائي المستلم</Label>
               <Select value={selectedStaffName} onValueChange={setSelectedStaffName}>
                  <SelectTrigger className="banking-input h-14 text-right font-black">
                     <SelectValue placeholder="اختر اسمك من القائمة" />
                  </SelectTrigger>
                  <SelectContent dir="rtl">
                     {config?.specialistNames?.map((name: string) => <SelectItem key={name} value={name}>{name}</SelectItem>) || (
                        ['علاء', 'محمود', 'عبدالله'].map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)
                     )}
                  </SelectContent>
               </Select>
            </div>
            <DialogFooter className="flex-row-reverse gap-3">
               <Button variant="ghost" onClick={() => setClaimDialogOpen(false)} className="rounded-full font-black px-8">إلغاء</Button>
               <Button onClick={handleClaimConfirm} disabled={!selectedStaffName} className="banking-button premium-gradient text-white px-10 rounded-full font-black h-12">تأكيد الاستلام والعمل</Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>
    </div>
  );
}
