
"use client"

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
  Share2,
  Calendar,
  Inbox,
  Paperclip,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { smartResponseAssistant } from '@/ai/flows/smart-response-assistant';
import { useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { collection, query, where, doc, orderBy, arrayUnion } from 'firebase/firestore';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

export function SpecialistView() {
  const { user } = useAuth();
  const db = useFirestore();
  const { toast } = useToast();
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [response, setResponse] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const deptTicketsQuery = useMemoFirebase(() => {
    if (!db || !user?.department) return null;
    return query(
      collection(db, 'tickets'),
      where('serviceType', '==', user.department),
      orderBy('createdAt', 'desc')
    );
  }, [db, user?.department]);

  const { data: tickets, isLoading: isTicketsLoading, error: queryError } = useCollection(deptTicketsQuery);

  const handleClaim = (ticket: any) => {
    if (!db || !user) return;
    const ticketRef = doc(db, 'tickets', ticket.id);
    updateDocumentNonBlocking(ticketRef, {
      assignedToSpecialistId: user.id,
      assignedToSpecialistName: user.name,
      status: 'Pending',
      logs: arrayUnion({
        action: 'تم استلام البلاغ من قبل الأخصائي',
        timestamp: new Date().toISOString(),
        userName: user.name
      })
    });
    toast({ title: "تم الاستلام بنجاح", description: `البلاغ ${ticket.ticketID} الآن تحت معالجتك.` });
  };

  const handleResolve = () => {
    if (!db || !user || !selectedTicket) return;
    if (!response.trim()) {
      toast({ variant: "destructive", title: "تنبيه", description: "يجب كتابة رد فني مفصل قبل إغلاق البلاغ." });
      return;
    }

    const ticketRef = doc(db, 'tickets', selectedTicket.id);
    updateDocumentNonBlocking(ticketRef, {
      status: 'Resolved',
      specialistResponse: response,
      resolvedAt: new Date().toISOString(),
      logs: arrayUnion({
        action: 'تم تقديم الحل الفني وإغلاق البلاغ',
        timestamp: new Date().toISOString(),
        userName: user.name,
        note: response
      })
    });

    toast({ title: "تم الحل والإغلاق", description: "تم إرسال الرد الفني للموظف بنجاح." });
    setSelectedTicket(null);
    setResponse('');
  };

  const handleAiSuggest = async () => {
    if (!selectedTicket) return;
    setIsGenerating(true);
    try {
      const result = await smartResponseAssistant({
        complaintDetails: `المشكلة: ${selectedTicket.subIssue}, التفاصيل: ${selectedTicket.description}`,
        resolutionHistory: ["إعادة تعيين الرقم السري للبطاقة", "تفعيل الحساب المجمد", "تحديث بيانات الهوية الشخصية"]
      });
      setResponse(result.suggestedResponse);
      toast({ title: "اقتراح ذكي", description: "تم توليد رد فني مقترح بناءً على تفاصيل البلاغ." });
    } catch (e) {
      toast({ variant: "destructive", title: "خطأ AI", description: "فشل مساعد الرد الذكي في معالجة الطلب." });
    } finally {
      setIsGenerating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending': return <Badge className="status-pending rounded-full px-4 font-bold shadow-sm">قيد العمل</Badge>;
      case 'Resolved': return <Badge className="status-resolved rounded-full px-4 font-bold shadow-sm">تم الحل</Badge>;
      default: return <Badge className="status-new rounded-full px-4 font-bold shadow-sm">بلاغ جديد</Badge>;
    }
  };

  if (selectedTicket) {
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4" dir="rtl">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => setSelectedTicket(null)} className="rounded-full hover:bg-white text-slate-500 font-bold px-6">
            <ArrowRight className="w-5 h-5 ml-2" /> العودة لمحطة العمل
          </Button>
          <div className="flex items-center gap-3">
            <span className="text-slate-400 font-bold text-xs">حالة البلاغ الحالية:</span>
            {getStatusBadge(selectedTicket.status)}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Ticket Info */}
          <div className="lg:col-span-2 space-y-8">
            <Card className="banking-card border-r-4 border-r-primary overflow-hidden shadow-xl">
              <CardHeader className="bg-slate-50/50 p-8 border-b">
                <div className="flex justify-between items-start">
                   <div className="text-right">
                      <CardTitle className="text-2xl font-black text-primary flex items-center gap-3">
                         <div className="p-3 bg-primary/10 rounded-[16px]"><Inbox className="w-6 h-6" /></div>
                         معالجة بلاغ رقم: {selectedTicket.ticketID}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-2 text-slate-400 text-xs font-bold">
                        <Calendar className="w-4 h-4" />
                        <span>تاريخ الورود: {new Date(selectedTicket.createdAt).toLocaleString('ar-SA')}</span>
                      </div>
                   </div>
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                {/* Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-[20px] flex items-center justify-between border border-slate-100">
                    <div className="text-right">
                       <Label className="text-[10px] text-slate-400 font-black uppercase tracking-wider block mb-1">اسم العميل</Label>
                       <p className="font-bold text-slate-800">{selectedTicket.customerName}</p>
                    </div>
                    <UserCircle className="w-5 h-5 text-slate-300" />
                  </div>
                  <div className="bg-slate-50 p-4 rounded-[20px] flex items-center justify-between border border-slate-100">
                    <div className="text-right">
                       <Label className="text-[10px] text-slate-400 font-black uppercase tracking-wider block mb-1">رقم الحساب (CIF)</Label>
                       <p className="font-mono font-bold text-primary">{selectedTicket.cif}</p>
                    </div>
                    <Fingerprint className="w-5 h-5 text-slate-300" />
                  </div>
                </div>

                {/* Problem Section */}
                <div className="space-y-4">
                   <div className="flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-primary" />
                      <h3 className="font-black text-lg text-slate-900">وصف المشكلة الفنية</h3>
                   </div>
                   <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm text-lg leading-relaxed text-slate-600 font-medium whitespace-pre-wrap">
                      <Badge variant="outline" className="mb-4 bg-primary/5 border-primary/10 text-primary font-black">{selectedTicket.subIssue}</Badge>
                      <p>{selectedTicket.description}</p>
                   </div>
                </div>

                {/* Response Section */}
                <div className="space-y-4 pt-4">
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        <h3 className="font-black text-lg text-slate-900">الرد الفني والحل المتخذ</h3>
                      </div>
                      <Button variant="outline" size="sm" onClick={handleAiSuggest} disabled={isGenerating} className="rounded-full border-accent/20 hover:bg-accent/5 text-accent font-bold px-5 h-10 shadow-sm">
                         {isGenerating ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Sparkles className="w-4 h-4 ml-2" />}
                         مساعد الرد الذكي (AI)
                      </Button>
                   </div>
                   <Textarea 
                      value={response} 
                      onChange={(e) => setResponse(e.target.value)} 
                      placeholder="يرجى كتابة التفاصيل التقنية للحل هنا ليتمكن الموظف من إبلاغ العميل..." 
                      className="banking-input min-h-[200px] p-6 text-lg border-slate-200" 
                   />
                   <div className="flex justify-end pt-4">
                      <Button className="banking-button premium-gradient text-white h-14 px-12 text-lg shadow-xl" onClick={handleResolve}>
                         اعتماد الحل وإغلاق البلاغ
                      </Button>
                   </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Timeline & Attachments */}
          <div className="space-y-8">
             <Card className="banking-card shadow-lg border-none">
                <CardHeader className="p-6 border-b bg-slate-50/50">
                   <CardTitle className="text-lg font-black text-slate-800 flex items-center gap-2">
                      <History className="w-5 h-5 text-primary" /> سجل البلاغ
                   </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                   <div className="space-y-6">
                      {selectedTicket.logs?.map((log: any, idx: number) => (
                        <div key={idx} className="relative pr-6 border-r-2 border-slate-100 last:border-0 pb-6">
                           <div className="absolute top-0 -right-[7px] w-3 h-3 rounded-full bg-primary shadow-sm"></div>
                           <div className="text-right">
                              <p className="font-bold text-slate-800 text-xs">{log.action}</p>
                              <p className="text-[10px] text-slate-400 font-bold mt-1">{new Date(log.timestamp).toLocaleString('ar-SA')}</p>
                           </div>
                        </div>
                      ))}
                   </div>
                </CardContent>
             </Card>

             {selectedTicket.attachments?.length > 0 && (
               <Card className="banking-card shadow-lg border-none">
                  <CardHeader className="p-6 border-b bg-slate-50/50">
                    <CardTitle className="text-lg font-black text-slate-800 flex items-center gap-2">
                       <Paperclip className="w-5 h-5 text-primary" /> المرفقات
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                     {selectedTicket.attachments.map((att: any, idx: number) => (
                       <div key={idx} className="group rounded-[20px] overflow-hidden border border-slate-100 bg-white">
                          <img src={att.url} className="w-full aspect-square object-cover" />
                          <div className="p-3 flex justify-between items-center bg-slate-50/50">
                             <a href={att.url} target="_blank" rel="noreferrer" className="text-[10px] text-primary font-black hover:underline flex items-center gap-1">
                                <ExternalLink className="w-3 h-3" /> فتح
                             </a>
                             <span className="text-[10px] text-slate-400 font-black">{att.description}</span>
                          </div>
                       </div>
                     ))}
                  </CardContent>
               </Card>
             )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700" dir="rtl">
      <div className="text-right">
        <h1 className="text-3xl font-extrabold text-primary tracking-tight">محطة عمل الأخصائي</h1>
        <p className="text-slate-500 font-medium mt-1">إدارة البلاغات الفنية الواردة لقسم <span className="text-secondary font-black">{user?.department}</span></p>
      </div>

      <Card className="banking-card overflow-hidden shadow-xl border-none">
        <CardHeader className="p-8 border-b border-slate-50 bg-white">
          <CardTitle className="text-2xl text-primary font-extrabold flex items-center gap-3">
             <div className="p-3 bg-primary/5 rounded-[16px]"><Clock className="w-6 h-6 text-primary" /></div>
             المهام والعمليات الواردة
          </CardTitle>
          <CardDescription className="text-slate-500 mt-1">مراقبة ومعالجة البلاغات المصعدة من خدمة العملاء</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isTicketsLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary h-12 w-12" /></div>
          ) : queryError ? (
            <div className="text-center py-20 bg-blue-50/50">
               <AlertCircle className="w-16 h-16 text-blue-400 mx-auto mb-6" />
               <h3 className="font-black text-xl text-blue-900">تنبيه تقني</h3>
               <p className="text-blue-700 mt-2">جاري مزامنة قواعد البيانات، يرجى تحديث الصفحة بعد قليل.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-primary hover:bg-primary border-none">
                    <TableHead className="text-right h-16 font-black text-white uppercase text-[11px] tracking-[0.1em] pr-10">رقم البلاغ</TableHead>
                    <TableHead className="text-right h-16 font-black text-white uppercase text-[11px] tracking-[0.1em]">العميل</TableHead>
                    <TableHead className="text-right h-16 font-black text-white uppercase text-[11px] tracking-[0.1em]">نوع المشكلة</TableHead>
                    <TableHead className="text-right h-16 font-black text-white uppercase text-[11px] tracking-[0.1em]">الحالة</TableHead>
                    <TableHead className="text-left h-16 font-black text-white uppercase text-[11px] tracking-[0.1em] pl-10">الإجراء الفني</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tickets?.map((t: any, index: number) => (
                    <TableRow 
                      key={t.id} 
                      className={`transition-all duration-200 border-b border-slate-50 hover:bg-primary/5 cursor-pointer ${index % 2 === 0 ? 'bg-white' : 'bg-slate-100/30'}`}
                      onClick={() => t.assignedToSpecialistId === user?.id && setSelectedTicket(t)}
                    >
                      <TableCell className="py-5 font-bold text-primary pr-10">
                        <span className="bg-primary/5 px-4 py-2 rounded-full text-xs shadow-sm border border-primary/5">{t.ticketID}</span>
                      </TableCell>
                      <TableCell className="py-5 text-right">
                         <div className="font-extrabold text-slate-800 text-sm">{t.customerName}</div>
                         <div className="text-[10px] text-slate-400 font-black font-mono mt-1 tracking-wider">{t.cif}</div>
                      </TableCell>
                      <TableCell className="py-5 text-right text-slate-600 font-bold text-sm">{t.subIssue}</TableCell>
                      <TableCell className="py-5 text-right">
                         <div className="scale-95 origin-right">{getStatusBadge(t.status)}</div>
                      </TableCell>
                      <TableCell className="py-5 text-left pl-10">
                        {!t.assignedToSpecialistId ? (
                          <Button 
                             size="sm" 
                             onClick={(e) => { e.stopPropagation(); handleClaim(t); }} 
                             className="banking-button premium-gradient text-white h-10 px-6 font-black text-xs"
                          >
                             استلام المهمة
                          </Button>
                        ) : t.assignedToSpecialistId === user?.id ? (
                          <Button 
                             variant="outline" 
                             size="sm" 
                             className="rounded-full h-10 px-6 border-primary/20 hover:bg-primary hover:text-white transition-all font-black text-xs"
                          >
                             فتح ومعالجة
                          </Button>
                        ) : (
                          <div className="flex items-center gap-2 text-slate-400 font-black text-[10px] bg-slate-100 px-3 py-1.5 rounded-full w-fit">
                             <UserPlus className="w-3.5 h-3.5" />
                             <span>مستلم بواسطة {t.assignedToSpecialistName}</span>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {tickets?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-32 bg-white">
                         <div className="flex flex-col items-center gap-6 text-slate-300">
                            <div className="p-8 bg-slate-50 rounded-full border border-slate-100"><Inbox className="w-20 h-20 opacity-30" /></div>
                            <div className="space-y-1">
                               <p className="font-black text-2xl text-slate-400">لا توجد مهام حالياً</p>
                               <p className="text-sm text-slate-300">صندوق الوارد فارغ، جميع البلاغات تمت معالجتها</p>
                            </div>
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
  );
}
