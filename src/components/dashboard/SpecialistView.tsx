
"use client"

import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CheckCircle2, Sparkles, ArrowRight, Loader2, ImageIcon, AlertCircle, Send, XCircle, Clock, Filter, Layers, UserCheck, ShieldCheck, Inbox, MessageCircle, User, Phone, Share2, Wand2
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking, useDoc } from '@/firebase';
import { collection, query, doc, orderBy, arrayUnion } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { smartResponseAssistant } from '@/ai/flows/smart-response-assistant';

export function SpecialistView() {
  const { user } = useAuth();
  const db = useFirestore();
  const { toast } = useToast();
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [response, setResponse] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [activeStatusFilter, setActiveStatusFilter] = useState('all');
  const [activeDeptFilter, setActiveDeptFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'all-tickets' | 'my-tasks'>('all-tickets');
  const [claimDialogOpen, setClaimDialogOpen] = useState(false);
  const [ticketToClaim, setTicketToClaim] = useState<any | null>(null);

  const myDeptServiceType = useMemo(() => {
    if (user?.department === 'Cards') return 'إدارة البطائق';
    if (user?.department === 'App') return 'مشاكل التطبيق';
    return 'خدمة العملاء';
  }, [user?.department]);

  useEffect(() => {
    const handleSidebarNav = (e: any) => {
      const action = e.detail;
      if (action === 'my-tasks') {
        setViewMode('my-tasks');
        setActiveStatusFilter('all');
        setSelectedTicket(null);
      } else if (['all', 'New', 'Pending', 'Escalated', 'Rejected', 'Resolved'].includes(action)) {
        setViewMode('all-tickets');
        setActiveStatusFilter(action);
        setSelectedTicket(null);
      }
    };
    window.addEventListener('sidebar-nav', handleSidebarNav);
    return () => window.removeEventListener('sidebar-nav', handleSidebarNav);
  }, []);

  const configRef = useMemoFirebase(() => db ? doc(db, 'settings', 'system-config') : null, [db]);
  const { data: config } = useDoc(configRef);

  const allTicketsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'tickets'), orderBy('createdAt', 'desc'));
  }, [db]);

  const { data: tickets, isLoading } = useCollection(allTicketsQuery);

  const filteredTickets = useMemo(() => {
    if (!tickets || !user) return [];
    return tickets.filter(t => {
      const matchesView = viewMode === 'all-tickets' || t.assignedToSpecialistId === user.id;
      const matchesStatus = activeStatusFilter === 'all' || t.status === activeStatusFilter;
      const matchesDept = activeDeptFilter === 'all' || t.serviceType === activeDeptFilter;
      return matchesView && matchesStatus && matchesDept;
    });
  }, [tickets, activeStatusFilter, activeDeptFilter, viewMode, user]);

  const handleClaimConfirm = () => {
    if (!db || !user || !ticketToClaim) return;
    
    updateDocumentNonBlocking(doc(db, 'tickets', ticketToClaim.id), {
      assignedToSpecialistId: user.id,
      assignedToSpecialistName: user.name,
      status: 'Pending',
      logs: arrayUnion({ 
        action: `تم استلام البلاغ للمباشرة بالمعالجة الفنية`, 
        timestamp: new Date().toISOString(), 
        userName: user.name,
        type: 'specialist'
      })
    });
    
    toast({ title: "تم الاستلام", description: "تم بدء معالجة البلاغ بنجاح" });
    setClaimDialogOpen(false);
    setTicketToClaim(null);
  };

  const generateAiResponse = async () => {
    if (!selectedTicket) return;
    setIsGeneratingAi(true);
    try {
      const result = await smartResponseAssistant({
        complaintDetails: selectedTicket.description,
      });
      setResponse(result.suggestedResponse);
      toast({ title: "تم توليد الرد الذكي", description: "يمكنك الآن تعديل الرد قبل اعتماده." });
    } catch (error) {
      toast({ variant: "destructive", title: "فشل توليد الرد", description: "عذراً، تعذر الاتصال بمساعد الذكاء الاصطناعي حالياً." });
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleAction = async (actionType: 'Resolved' | 'Rejected' | 'Escalated') => {
    if (!db || !selectedTicket || !response.trim() || !user) {
       toast({ variant: "destructive", title: "تنبيه", description: "يرجى كتابة الرد الفني أو سبب الإجراء المتخذ." });
       return;
    }
    setIsProcessing(true);
    
    let actionLabel = '';
    switch(actionType) {
      case 'Resolved': actionLabel = 'اعتماد الحل النهائي'; break;
      case 'Rejected': actionLabel = 'رفض البلاغ'; break;
      case 'Escalated': actionLabel = 'إحالة للقسم المختص'; break;
    }

    const updateData: any = {
      status: actionType,
      logs: arrayUnion({ 
        action: `إجراء متخذ: ${actionLabel}`, 
        timestamp: new Date().toISOString(), 
        userName: user.name, 
        note: response,
        type: 'specialist'
      })
    };

    if (actionType === 'Resolved') {
      updateData.specialistResponse = response;
      updateData.resolvedAt = new Date().toISOString();
    } else if (actionType === 'Rejected') {
      updateData.rejectedAt = new Date().toISOString();
    }

    updateDocumentNonBlocking(doc(db, 'tickets', selectedTicket.id), updateData);
    toast({ title: "تم تنفيذ الإجراء", description: `تم تحديث حالة البلاغ إلى: ${actionLabel}` });
    setSelectedTicket(null);
    setResponse('');
    setIsProcessing(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending': return <Badge className="bg-amber-500 rounded-full font-black px-4 py-1">قيد المعالجة</Badge>;
      case 'Resolved': return <Badge className="bg-green-600 rounded-full font-black px-4 py-1">تم الحل</Badge>;
      case 'Rejected': return <Badge className="bg-slate-700 rounded-full font-black px-4 py-1">مرفوض</Badge>;
      case 'Escalated': return <Badge className="bg-red-600 rounded-full font-black px-4 py-1">محال</Badge>;
      default: return <Badge className="bg-blue-600 rounded-full font-black px-4 py-1">جديد</Badge>;
    }
  };

  if (selectedTicket) {
    return (
      <div className="space-y-8 text-right animate-in fade-in" dir="rtl">
        <Button variant="ghost" onClick={() => setSelectedTicket(null)} className="rounded-full font-black hover:bg-slate-100 h-12">
          <ArrowRight className="w-5 h-5 ml-2" /> العودة لمحطة العمل الفنية
        </Button>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <Card className="lg:col-span-2 banking-card overflow-hidden bg-slate-50/30">
              <CardHeader className="bg-white p-8 border-b">
                 <div className="flex justify-between items-center w-full">
                    <CardTitle className="text-2xl font-black text-primary flex items-center gap-3 justify-end">
                       ملف المعالجة: {selectedTicket.ticketID} <Clock className="w-6 h-6" />
                    </CardTitle>
                    {getStatusBadge(selectedTicket.status)}
                 </div>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                 <div className="space-y-6">
                    <h4 className="font-black text-slate-800 flex items-center gap-2 justify-end px-2">
                       <MessageCircle className="w-5 h-5 text-primary" /> تسلسل المحادثة والمتابعة الفنية
                    </h4>
                    
                    <div className="flex flex-col gap-6">
                       {selectedTicket.logs?.map((log: any, idx: number) => {
                          const isAgent = log.type === 'agent' || log.action.includes('رفع') || log.action.includes('متابعة');
                          
                          return (
                             <div key={idx} className={cn(
                               "flex flex-col max-w-[85%] animate-in fade-in slide-in-from-bottom-2 duration-300",
                               isAgent ? "self-end items-end" : "self-start items-start"
                             )}>
                                <div className={cn(
                                  "p-4 rounded-[24px] shadow-sm relative",
                                  isAgent ? "bg-primary text-white rounded-tr-none" : "bg-white border text-slate-800 rounded-tl-none"
                                )}>
                                   <div className="flex items-center gap-2 mb-2 flex-row-reverse opacity-80">
                                      {isAgent ? <User className="w-3 h-3" /> : <ShieldCheck className="w-3 h-3 text-green-600" />}
                                      <span className="text-[10px] font-black">{log.userName}</span>
                                      <span className="text-[9px]">• {new Date(log.timestamp).toLocaleString('ar-SA')}</span>
                                   </div>
                                   <p className="text-xs font-black mb-2 opacity-90">{log.action}</p>
                                   {log.note && (
                                     <div className={cn(
                                       "p-3 rounded-xl text-sm leading-relaxed whitespace-pre-wrap",
                                       isAgent ? "bg-white/10" : "bg-slate-50 border border-dashed"
                                     )}>
                                        {log.note}
                                     </div>
                                   )}
                                </div>
                             </div>
                          );
                       })}
                    </div>
                 </div>

                 {selectedTicket.serviceType === myDeptServiceType && selectedTicket.status === 'Pending' && selectedTicket.assignedToSpecialistId === user?.id && (
                   <div className="space-y-6 pt-8 border-t">
                      <div className="flex justify-between items-center flex-row-reverse">
                         <h4 className="font-black text-slate-800 flex items-center gap-2">
                            إضافة رد فني جديد <Sparkles className="w-4 h-4 text-accent" />
                         </h4>
                         <Button 
                            onClick={generateAiResponse} 
                            disabled={isGeneratingAi}
                            variant="outline" 
                            className="rounded-full font-black border-accent text-accent hover:bg-accent hover:text-white flex items-center gap-2"
                          >
                           {isGeneratingAi ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Wand2 className="w-4 h-4" /> صياغة رد ذكي</>}
                         </Button>
                      </div>
                      <Textarea 
                        value={response} 
                        onChange={e => setResponse(e.target.value)} 
                        placeholder="اكتب هنا الرد الفني التفصيلي أو استخدم المساعد الذكي..." 
                        className="banking-input min-h-[150px] text-right text-base leading-relaxed bg-white" 
                      />
                      
                      <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6">
                         <Button 
                           variant="outline" 
                           onClick={() => handleAction('Rejected')} 
                           className="text-red-600 rounded-full font-black border-red-100 hover:bg-red-50 h-14 px-8"
                           disabled={isProcessing}
                         >
                           <XCircle className="w-4 h-4 ml-2" /> رفض البلاغ
                         </Button>
                         <Button 
                           variant="outline" 
                           onClick={() => handleAction('Escalated')} 
                           className="text-amber-600 rounded-full font-black border-amber-100 hover:bg-amber-50 h-14 px-8"
                           disabled={isProcessing}
                         >
                           <Send className="w-4 h-4 ml-2" /> إحالة للقسم المختص
                         </Button>
                         <Button 
                           className="banking-button premium-gradient text-white h-14 px-12 rounded-full font-black shadow-xl" 
                           onClick={() => handleAction('Resolved')} 
                           disabled={isProcessing}
                         >
                           {isProcessing ? <Loader2 className="animate-spin" /> : <><CheckCircle2 className="w-4 h-4 ml-2" /> اعتماد الحل النهائي</>}
                         </Button>
                      </div>
                   </div>
                 )}
              </CardContent>
           </Card>

           <Card className="banking-card border-none shadow-xl h-fit sticky top-24">
              <CardHeader className="p-6 border-b bg-slate-50/50">
                <CardTitle className="text-lg font-black text-right">بيانات البلاغ الكاملة</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                 <div className="space-y-4">
                    <div className="space-y-1 text-right">
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">اسم العميل</p>
                      <p className="font-black text-slate-800">{selectedTicket.customerName}</p>
                    </div>
                    <div className="space-y-1 text-right">
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-1 justify-end">رقم CIF <User className="w-3 h-3" /></p>
                      <p className="font-mono font-bold text-slate-700">{selectedTicket.cif}</p>
                    </div>
                    <div className="space-y-1 text-right">
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-1 justify-end">رقم الهاتف <Phone className="w-3 h-3" /></p>
                      <p className="font-mono font-bold text-primary">{selectedTicket.phoneNumber}</p>
                    </div>
                    <div className="space-y-1 text-right">
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-1 justify-end">وسيلة الاستلام <Share2 className="w-3 h-3" /></p>
                      <p className="font-bold text-slate-700">{selectedTicket.intakeMethod}</p>
                    </div>
                    <div className="space-y-1 text-right">
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">نوع المشكلة</p>
                      <Badge variant="secondary" className="font-black">{selectedTicket.subIssue}</Badge>
                    </div>
                 </div>

                 {selectedTicket.attachments?.length > 0 && (
                   <div className="pt-6 border-t">
                      <h4 className="text-[10px] font-black mb-4 text-slate-400 uppercase tracking-widest text-right">المرفقات</h4>
                      <div className="grid grid-cols-2 gap-2">
                         {selectedTicket.attachments.map((at: any, i: number) => (
                           <img key={i} src={at.url} alt="at" className="w-full aspect-video object-cover rounded-lg border cursor-pointer shadow-sm hover:scale-105 transition-transform" onClick={() => window.open(at.url)} />
                         ))}
                      </div>
                   </div>
                 )}
              </CardContent>
           </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 text-right animate-in fade-in" dir="rtl">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-right">
            <h1 className="text-3xl font-black text-primary tracking-tight">
               {viewMode === 'my-tasks' ? "عملياتي الفنية" : "محطة العمل الفنية - رؤية شاملة"}
            </h1>
            <p className="text-slate-500 font-bold mt-1">
               {viewMode === 'my-tasks' 
                 ? "متابعة المهام التي قمت باستلامها ومعالجتها شخصياً" 
                 : "متابعة ومعالجة كافة البلاغات المصرفية في النظام"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4 bg-white p-2 rounded-[24px] shadow-sm border">
            <div className="flex items-center gap-2 px-3 border-l ml-2">
               <Filter className="w-4 h-4 text-primary" />
               <span className="text-xs font-black text-slate-400 uppercase">فرز الأقسام</span>
            </div>
            <Select value={activeDeptFilter} onValueChange={setActiveDeptFilter}>
               <SelectTrigger className="w-[180px] h-10 border-none bg-slate-50 rounded-full font-black focus:ring-0">
                  <SelectValue placeholder="اختر القسم" />
               </SelectTrigger>
               <SelectContent dir="rtl">
                  <SelectItem value="all">كل الأقسام</SelectItem>
                  <SelectItem value="إدارة البطائق">إدارة البطائق</SelectItem>
                  <SelectItem value="مشاكل التطبيق">مشاكل التطبيق</SelectItem>
                  <SelectItem value="خدمة العملاء">خدمة العملاء</SelectItem>
               </SelectContent>
            </Select>
          </div>
        </div>

        <Tabs value={activeStatusFilter} onValueChange={setActiveStatusFilter} className="bg-slate-100 p-1 rounded-full h-auto no-scrollbar overflow-x-auto">
          <TabsList className="bg-transparent flex-nowrap w-full md:w-auto">
            <TabsTrigger value="all" className="rounded-full flex-1 md:flex-none px-6 py-2 font-black data-[state=active]:bg-primary data-[state=active]:text-white transition-all">الكل</TabsTrigger>
            <TabsTrigger value="New" className="rounded-full flex-1 md:flex-none px-6 py-2 font-black data-[state=active]:bg-primary data-[state=active]:text-white transition-all">جديد</TabsTrigger>
            <TabsTrigger value="Pending" className="rounded-full flex-1 md:flex-none px-6 py-2 font-black data-[state=active]:bg-primary data-[state=active]:text-white transition-all">قيد المعالجة</TabsTrigger>
            <TabsTrigger value="Escalated" className="rounded-full flex-1 md:flex-none px-6 py-2 font-black data-[state=active]:bg-primary data-[state=active]:text-white transition-all">محال</TabsTrigger>
            <TabsTrigger value="Resolved" className="rounded-full flex-1 md:flex-none px-6 py-2 font-black data-[state=active]:bg-primary data-[state=active]:text-white transition-all">تم الحل</TabsTrigger>
            <TabsTrigger value="Rejected" className="rounded-full flex-1 md:flex-none px-6 py-2 font-black data-[state=active]:bg-primary data-[state=active]:text-white transition-all">مرفوض</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Card className="banking-card overflow-hidden shadow-2xl border-none">
        <CardContent className="p-0">
           {isLoading ? (
             <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="animate-spin text-primary h-12 w-12" />
                <p className="font-black text-slate-400">جاري مزامنة البلاغات...</p>
             </div>
           ) : (
             <Table>
                <TableHeader className="bg-primary text-white">
                  <TableRow className="border-none hover:bg-primary">
                    <TableHead className="text-right h-14 font-black text-white pr-8">رقم البلاغ</TableHead>
                    <TableHead className="text-right h-14 font-black text-white">العميل</TableHead>
                    <TableHead className="text-right h-14 font-black text-white">الجهة المعنية</TableHead>
                    <TableHead className="text-right h-14 font-black text-white">الحالة</TableHead>
                    <TableHead className="text-center h-14 font-black text-white pl-8">الإجراء</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTickets?.map((t: any, idx: number) => (
                    <TableRow key={t.id} className={`border-b transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} hover:bg-slate-100/50`}>
                      <TableCell className="py-5 font-black pr-8 text-right">
                        <div className="flex flex-col">
                          <Badge variant="outline" className="font-mono w-fit">{t.ticketID}</Badge>
                          <span className="text-[10px] text-slate-400 mt-1">{new Date(t.createdAt).toLocaleDateString('ar-SA')}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-5 text-right font-bold text-slate-700">{t.customerName}</TableCell>
                      <TableCell className="py-5 text-right">
                        <Badge className={`${t.serviceType === myDeptServiceType ? 'bg-blue-600' : 'bg-slate-200 text-slate-600'} rounded-full font-black`}>
                           {t.serviceType}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-5 text-right">{getStatusBadge(t.status)}</TableCell>
                      <TableCell className="py-5 text-center pl-8">
                        {t.serviceType === myDeptServiceType ? (
                          !t.assignedToSpecialistId ? (
                            <Button onClick={() => { setTicketToClaim(t); setClaimDialogOpen(true); }} className="banking-button premium-gradient text-white h-10 px-8 font-black shadow-md">استلام والبدء</Button>
                          ) : (
                            <Button variant="outline" onClick={() => setSelectedTicket(t)} className="rounded-full h-10 px-8 border-primary text-primary font-black hover:bg-primary hover:text-white transition-all">
                               {t.assignedToSpecialistId === user?.id ? "إكمال المعالجة" : "فتح المتابعة"}
                            </Button>
                          )
                        ) : (
                          <Button variant="ghost" onClick={() => setSelectedTicket(t)} className="rounded-full h-10 px-8 text-slate-400 font-black hover:bg-slate-100 transition-all">متابعة البلاغ</Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredTickets.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-28 flex flex-col items-center gap-4">
                         {viewMode === 'my-tasks' ? <UserCheck className="w-12 h-12 text-indigo-200" /> : <Inbox className="w-12 h-12 text-slate-200" />}
                         <span className="font-black text-slate-400 text-lg">
                            {viewMode === 'my-tasks' 
                               ? "لم تقم باستلام أي بلاغات بعد" 
                               : "لا توجد بلاغات مطابقة لهذه المعايير حالياً"}
                         </span>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
             </Table>
           )}
        </CardContent>
      </Card>

      <Dialog open={claimDialogOpen} onOpenChange={setClaimDialogOpen}>
         <DialogContent className="max-w-md text-right rounded-[32px] p-0 overflow-hidden shadow-2xl" dir="rtl">
            <DialogHeader className="p-8 bg-primary/5 border-b">
               <DialogTitle className="text-2xl font-black text-primary text-right flex items-center gap-2 justify-end">
                  <UserCheck className="w-6 h-6" /> تأكيد استلام البلاغ
               </DialogTitle>
            </DialogHeader>
            <div className="p-8 space-y-6">
               <div className="space-y-4 text-right">
                  <Label className="font-black text-sm text-slate-600 mr-1">الأخصائي القائم بالمعالجة</Label>
                  <div className="banking-input h-14 flex items-center justify-end px-6 bg-slate-50 border-slate-200 font-black text-primary">
                    {user?.name}
                    <ShieldCheck className="w-5 h-5 mr-3 text-primary" />
                  </div>
               </div>
               <p className="text-[12px] text-slate-500 font-bold leading-relaxed text-right">
                  أهلاً بك يا <strong>{user?.name}</strong>. بمجرد تأكيد الاستلام، سيتم ربط البلاغ رقم <strong>{ticketToClaim?.ticketID}</strong> بحسابك وسيتغير حالته إلى "قيد المعالجة" فوراً وسوف يظهر في قسم "عملياتي".
               </p>
            </div>
            <DialogFooter className="flex-row-reverse gap-3 p-8 border-t bg-slate-50">
               <Button variant="ghost" onClick={() => setClaimDialogOpen(false)} className="rounded-full font-black px-8">إلغاء</Button>
               <Button onClick={handleClaimConfirm} className="banking-button premium-gradient text-white px-10 rounded-full font-black h-12 shadow-lg">تأكيد الاستلام والبدء</Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>
    </div>
  );
}
