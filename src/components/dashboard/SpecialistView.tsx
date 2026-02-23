
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
  Calendar,
  Inbox,
  Paperclip,
  ExternalLink,
  Eye,
  FileText
} from 'lucide-react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { smartResponseAssistant } from '@/ai/flows/smart-response-assistant';
import { useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { collection, query, where, doc, orderBy, arrayUnion } from 'firebase/firestore';

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
      where('serviceType', '==', user.department === 'Cards' ? 'إدارة البطائق' : user.department),
      orderBy('createdAt', 'desc')
    );
  }, [db, user?.department]);

  const { data: tickets, isLoading: isTicketsLoading } = useCollection(deptTicketsQuery);

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
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 text-right h-[calc(100vh-120px)] overflow-y-auto no-scrollbar pb-10" dir="rtl">
        <div className="flex items-center justify-between flex-row-reverse">
          <Button variant="ghost" onClick={() => setSelectedTicket(null)} className="rounded-full hover:bg-white text-slate-500 font-bold px-6">
            <ArrowRight className="w-5 h-5 ml-2" /> العودة لمحطة العمل
          </Button>
          <div className="flex items-center gap-3 flex-row-reverse">
            <span className="text-slate-400 font-bold text-xs text-right">حالة البلاغ الحالية:</span>
            {getStatusBadge(selectedTicket.status)}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8 text-right">
            <Card className="banking-card border-r-4 border-r-primary overflow-hidden shadow-xl">
              <CardHeader className="bg-slate-50/50 p-8 border-b">
                <div className="flex items-center gap-4 justify-start flex-row-reverse">
                  <div className="p-4 bg-primary/5 rounded-[20px] border border-primary/10">
                    <Inbox className="w-8 h-8 text-primary" />
                  </div>
                  <div className="text-right">
                    <CardTitle className="text-2xl font-black text-primary">
                      معالجة بلاغ رقم: {selectedTicket.ticketID}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-2 text-slate-400 text-xs font-bold justify-end">
                      <Calendar className="w-4 h-4" />
                      <span>تاريخ الورود: {new Date(selectedTicket.createdAt).toLocaleString('ar-SA')}</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="rounded-[24px] border-none shadow-sm bg-slate-50/50">
                    <CardContent className="p-6 flex items-center gap-4 justify-start flex-row-reverse">
                      <div className="p-3 bg-white rounded-full shadow-sm"><UserCircle className="w-6 h-6 text-primary/40" /></div>
                      <div className="text-right">
                        <Label className="text-[10px] text-slate-400 font-black uppercase tracking-widest block mb-1 text-right">اسم العميل</Label>
                        <p className="font-black text-slate-800 text-right">{selectedTicket.customerName}</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="rounded-[24px] border-none shadow-sm bg-slate-50/50">
                    <CardContent className="p-6 flex items-center gap-4 justify-start flex-row-reverse">
                      <div className="p-3 bg-white rounded-full shadow-sm"><Fingerprint className="w-6 h-6 text-primary/40" /></div>
                      <div className="text-right">
                        <Label className="text-[10px] text-slate-400 font-black uppercase tracking-widest block mb-1 text-right">رقم الحساب (CIF)</Label>
                        <p className="font-mono font-black text-primary text-right">{selectedTicket.cif}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-4">
                   <div className="flex items-center gap-3 px-2 justify-end">
                      <h3 className="font-black text-xl text-slate-900">وصف المشكلة الفنية</h3>
                      <MessageSquare className="w-6 h-6 text-primary" />
                   </div>
                   <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm text-lg leading-relaxed text-slate-700 font-medium whitespace-pre-wrap text-right">
                      <div className="flex justify-end mb-6">
                        <Badge className="bg-primary/5 border-primary/10 text-primary font-black px-6 py-2 rounded-full border shadow-sm">{selectedTicket.subIssue}</Badge>
                      </div>
                      <p className="text-right">{selectedTicket.description}</p>
                   </div>
                </div>

                {selectedTicket.attachments && selectedTicket.attachments.length > 0 && (
                  <div className="space-y-4 pt-4">
                    <div className="flex items-center gap-3 px-2 justify-end">
                      <h3 className="font-black text-xl text-slate-900">المرفقات المستلمة</h3>
                      <Paperclip className="w-6 h-6 text-primary" />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                      {selectedTicket.attachments.map((file: any, idx: number) => (
                        <div key={idx} className="bg-white p-4 rounded-[28px] border border-slate-100 shadow-sm group">
                          {file.url.startsWith('data:image/') ? (
                             <div className="relative aspect-video rounded-2xl overflow-hidden mb-4 shadow-inner">
                               <img src={file.url} alt={file.description} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                               <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <a href={file.url} target="_blank" rel="noopener noreferrer" className="p-3 bg-white rounded-full text-primary shadow-xl">
                                    <Eye className="w-6 h-6" />
                                  </a>
                               </div>
                             </div>
                          ) : (
                             <div className="aspect-video bg-slate-50 rounded-2xl flex items-center justify-center mb-4 border border-dashed">
                               <FileText className="w-10 h-10 text-slate-300" />
                             </div>
                          )}
                          <p className="text-[10px] font-black text-slate-400 truncate text-right px-2">{file.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-4 pt-10 border-t">
                   <div className="flex items-center justify-between px-2 flex-row-reverse">
                      <div className="flex items-center gap-3 flex-row-reverse">
                        <CheckCircle2 className="w-6 h-6 text-green-600" />
                        <h3 className="font-black text-xl text-slate-900">الرد الفني والحل المتخذ</h3>
                      </div>
                      <Button variant="outline" size="sm" onClick={handleAiSuggest} disabled={isGenerating} className="rounded-full border-accent/20 hover:bg-accent/5 text-accent font-black px-6 h-11 shadow-sm transition-all hover:scale-105">
                         {isGenerating ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Sparkles className="w-4 h-4 ml-2" />}
                         مساعد الرد الذكي (AI)
                      </Button>
                   </div>
                   <Textarea 
                      value={response} 
                      onChange={(e) => setResponse(e.target.value)} 
                      placeholder="يرجى كتابة التفاصيل التقنية للحل هنا..." 
                      className="banking-input min-h-[220px] p-8 text-lg border-slate-200 shadow-inner bg-slate-50/30 focus:bg-white text-right" 
                   />
                   <div className="flex justify-end pt-6">
                      <Button className="banking-button premium-gradient text-white h-16 px-16 text-xl shadow-2xl shadow-primary/20" onClick={handleResolve}>
                         اعتماد الحل وإغلاق البلاغ
                      </Button>
                   </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-8 text-right">
             <Card className="banking-card shadow-lg border-none overflow-hidden">
                <CardHeader className="p-6 border-b bg-slate-50/50 flex items-center gap-3 justify-start flex-row-reverse">
                   <History className="w-5 h-5 text-primary" />
                   <CardTitle className="text-lg font-black text-slate-800">سجل البلاغ</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                   <div className="space-y-6">
                      {selectedTicket.logs?.map((log: any, idx: number) => (
                        <div key={idx} className="relative pr-6 border-r-2 border-slate-100 last:border-0 pb-6 text-right">
                           <div className="absolute top-0 -right-[7px] w-3.5 h-3.5 rounded-full bg-primary shadow-md border-2 border-white"></div>
                           <div className="text-right">
                              <p className="font-black text-slate-800 text-xs">{log.action}</p>
                              <p className="text-[10px] text-slate-400 font-bold mt-1 tracking-wider text-right">{new Date(log.timestamp).toLocaleString('ar-SA')}</p>
                           </div>
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
      <div className="text-right">
        <h1 className="text-4xl font-black text-primary tracking-tight">محطة عمل الأخصائي</h1>
        <p className="text-slate-500 font-medium mt-2">إدارة البلاغات الفنية لقسم <span className="text-secondary font-black bg-secondary/5 px-3 py-1 rounded-full border border-secondary/10">{user?.department}</span></p>
      </div>

      <Card className="banking-card overflow-hidden shadow-2xl border-none">
        <CardHeader className="p-10 border-b border-slate-50 bg-white">
          <div className="flex items-center gap-4 justify-start flex-row-reverse">
            <div className="p-4 bg-primary/5 rounded-[22px]"><Clock className="w-8 h-8 text-primary" /></div>
            <div className="text-right">
              <CardTitle className="text-2xl text-primary font-black">المهام والعمليات الواردة</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isTicketsLoading ? (
            <div className="flex justify-center py-24"><Loader2 className="animate-spin text-primary h-14 w-14" /></div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="border-collapse">
                <TableHeader>
                  <TableRow className="bg-primary border-none hover:bg-primary">
                    <TableHead className="text-right h-18 font-black text-white pr-12">رقم البلاغ</TableHead>
                    <TableHead className="text-right h-18 font-black text-white">العميل</TableHead>
                    <TableHead className="text-right h-18 font-black text-white">نوع المشكلة</TableHead>
                    <TableHead className="text-right h-18 font-black text-white">الحالة</TableHead>
                    <TableHead className="text-center h-18 font-black text-white pl-12">الإجراء</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tickets?.map((t: any, index: number) => (
                    <TableRow 
                      key={t.id} 
                      className={`transition-all duration-200 border-b border-slate-100 cursor-pointer group ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
                      onClick={() => t.assignedToSpecialistId === user?.id && setSelectedTicket(t)}
                    >
                      <TableCell className="py-6 font-black text-primary pr-12 text-right">
                        <span className="bg-primary/5 px-5 py-2.5 rounded-full text-xs shadow-sm border border-primary/5">{t.ticketID}</span>
                      </TableCell>
                      <TableCell className="py-6 text-right">
                         <div className="font-black text-slate-800 text-sm text-right">{t.customerName}</div>
                         <div className="text-[10px] text-slate-400 font-black font-mono mt-1 tracking-wider uppercase text-right">{t.cif}</div>
                      </TableCell>
                      <TableCell className="py-6 text-right text-slate-600 font-bold text-sm">
                        <Badge variant="outline" className="rounded-full bg-slate-50 border-slate-200 text-slate-500 font-bold">{t.subIssue}</Badge>
                      </TableCell>
                      <TableCell className="py-6 text-right">
                         <div className="scale-95 origin-right">{getStatusBadge(t.status)}</div>
                      </TableCell>
                      <TableCell className="py-6 text-center pl-12">
                        {!t.assignedToSpecialistId ? (
                          <Button 
                             size="sm" 
                             onClick={(e) => { e.stopPropagation(); handleClaim(t); }} 
                             className="banking-button premium-gradient text-white h-11 px-8 font-black text-xs"
                          >
                             <div className="flex items-center gap-2">
                               <UserPlus className="w-4 h-4" />
                               <span>استلام المهمة</span>
                             </div>
                          </Button>
                        ) : t.assignedToSpecialistId === user?.id ? (
                          <Button variant="outline" size="sm" className="rounded-full h-11 px-8 border-primary/20 hover:bg-primary hover:text-white font-black text-xs">
                             <div className="flex items-center gap-2">
                               <ExternalLink className="w-4 h-4" />
                               <span>فتح ومعالجة</span>
                             </div>
                          </Button>
                        ) : (
                          <div className="flex items-center gap-2 text-slate-400 font-black text-[10px] bg-slate-100 px-4 py-2 rounded-full w-fit mx-auto border border-slate-200/50">
                             <span>مستلم بواسطة {t.assignedToSpecialistName}</span>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!tickets || tickets.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-32 bg-white">
                         <div className="flex flex-col items-center gap-6 text-slate-300">
                           <div className="p-8 bg-slate-50 rounded-full border border-slate-100"><Inbox className="w-20 h-20 opacity-30" /></div>
                           <div className="space-y-1">
                             <p className="font-black text-2xl text-slate-400">لا توجد مهام حالياً</p>
                             <p className="text-sm text-slate-300">صندوق الوارد نظيف، استمتع ببعض الراحة!</p>
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
