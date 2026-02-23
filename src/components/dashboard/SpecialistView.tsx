
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
  FileText,
  XCircle,
  Send,
  AlertTriangle
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
  const [isProcessing, setIsProcessing] = useState(false);

  // جلب البلاغات الموجهة لقسم الأخصائي
  const deptTicketsQuery = useMemoFirebase(() => {
    if (!db || !user?.department) return null;
    const deptName = user.department === 'Cards' ? 'إدارة البطائق' : 
                   user.department === 'Support' ? 'كول سنتر' : 
                   user.department === 'App' ? 'مشاكل التطبيق' : user.department;
    
    return query(
      collection(db, 'tickets'),
      where('serviceType', '==', deptName),
      orderBy('createdAt', 'desc')
    );
  }, [db, user?.department]);

  const { data: tickets, isLoading: isTicketsLoading } = useCollection(deptTicketsQuery);

  // استلام البلاغ للعمل عليه
  const handleClaim = (ticket: any) => {
    if (!db || !user) return;
    const ticketRef = doc(db, 'tickets', ticket.id);
    updateDocumentNonBlocking(ticketRef, {
      assignedToSpecialistId: user.id,
      assignedToSpecialistName: user.name,
      status: 'Pending',
      logs: arrayUnion({
        action: `تم استلام البلاغ بواسطة الأخصائي: ${user.name}`,
        timestamp: new Date().toISOString(),
        userName: user.name
      })
    });
    toast({ title: "تم الاستلام", description: "البلاغ الآن في قائمة مهامك." });
  };

  // معالجة البلاغ (حل، رفض، إحالة)
  const handleAction = async (actionType: 'Resolved' | 'Rejected' | 'Escalated') => {
    if (!db || !user || !selectedTicket) return;
    if (!response.trim()) {
      toast({ variant: "destructive", title: "تنبيه", description: "يجب كتابة تعليق أو رد فني يوضح الإجراء المتخذ." });
      return;
    }

    setIsProcessing(true);
    const ticketRef = doc(db, 'tickets', selectedTicket.id);
    
    let actionText = '';
    switch(actionType) {
      case 'Resolved': actionText = 'تم تقديم الحل الفني وإغلاق البلاغ'; break;
      case 'Rejected': actionText = 'تم رفض البلاغ مع ذكر الأسباب'; break;
      case 'Escalated': actionText = 'تمت إحالة البلاغ للمستوى الأعلى'; break;
    }

    const updateData: any = {
      status: actionType,
      logs: arrayUnion({
        action: actionText,
        timestamp: new Date().toISOString(),
        userName: user.name,
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
      toast({ title: "تم تحديث الحالة", description: `تم تغيير حالة البلاغ إلى ${actionType === 'Resolved' ? 'تم الحل' : actionType === 'Rejected' ? 'مرفوض' : 'محال'}.` });
      setSelectedTicket(null);
      setResponse('');
    } catch (err) {
      toast({ variant: "destructive", title: "خطأ", description: "فشل تحديث حالة البلاغ." });
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
      toast({ title: "اقتراح ذكي", description: "تم توليد رد فني مقترح بناءً على تفاصيل البلاغ." });
    } catch (e) {
      toast({ variant: "destructive", title: "خطأ AI", description: "فشل مساعد الرد الذكي." });
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
            <span className="text-slate-400 font-black text-xs text-right">الحالة الحالية:</span>
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
                    <CardTitle className="text-2xl font-black text-primary">معالجة بلاغ رقم: {selectedTicket.ticketID}</CardTitle>
                    <div className="flex items-center gap-2 mt-2 text-slate-400 text-xs font-bold justify-end">
                      <Calendar className="w-4 h-4" />
                      <span>تاريخ الورود: {new Date(selectedTicket.createdAt).toLocaleString('ar-SA')}</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                {/* بيانات العميل */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-[20px] flex items-center gap-3 flex-row-reverse border border-slate-100">
                    <div className="p-2 bg-white rounded-lg shadow-sm"><UserCircle className="w-5 h-5 text-primary" /></div>
                    <div className="text-right"><span className="text-[10px] text-slate-400 block font-black text-right">اسم العميل</span><p className="font-black text-sm text-right">{selectedTicket.customerName}</p></div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-[20px] flex items-center gap-3 flex-row-reverse border border-slate-100">
                    <div className="p-2 bg-white rounded-lg shadow-sm"><Fingerprint className="w-5 h-5 text-primary" /></div>
                    <div className="text-right"><span className="text-[10px] text-slate-400 block font-black text-right">رقم CIF</span><p className="font-mono font-black text-sm text-right">{selectedTicket.cif}</p></div>
                  </div>
                </div>

                {/* تفاصيل المشكلة */}
                <div className="space-y-4">
                   <div className="flex items-center gap-3 px-2 justify-end">
                      <h3 className="font-black text-xl text-slate-900">وصف المشكلة الفنية</h3>
                      <MessageSquare className="w-6 h-6 text-primary" />
                   </div>
                   <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm text-lg leading-relaxed text-slate-700 font-medium text-right">
                      <div className="flex justify-end mb-4">
                        <Badge className="bg-primary/5 border-primary/10 text-primary font-black px-6 py-2 rounded-full border">{selectedTicket.subIssue}</Badge>
                      </div>
                      <p>{selectedTicket.description}</p>
                   </div>
                </div>

                {/* المرفقات */}
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
                             <div className="relative aspect-video rounded-2xl overflow-hidden mb-2">
                               <img src={file.url} alt={file.description} className="w-full h-full object-cover" />
                               <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <a href={file.url} target="_blank" rel="noopener noreferrer" className="p-2 bg-white rounded-full text-primary"><Eye className="w-5 h-5" /></a>
                               </div>
                             </div>
                          ) : (
                             <div className="aspect-video bg-slate-50 rounded-2xl flex items-center justify-center mb-2"><FileText className="w-8 h-8 text-slate-300" /></div>
                          )}
                          <p className="text-[10px] font-black text-slate-400 truncate text-right">{file.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* اتخاذ إجراء */}
                <div className="space-y-4 pt-10 border-t">
                   <div className="flex items-center justify-between px-2 flex-row-reverse">
                      <div className="flex items-center gap-3 flex-row-reverse">
                        <CheckCircle2 className="w-6 h-6 text-green-600" />
                        <h3 className="font-black text-xl text-slate-900">الرد الفني والتعليق</h3>
                      </div>
                      <Button variant="outline" size="sm" onClick={handleAiSuggest} disabled={isGenerating} className="rounded-full border-accent/20 hover:bg-accent/5 text-accent font-black h-11">
                         {isGenerating ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Sparkles className="w-4 h-4 ml-2" />}
                         اقتراح ذكي (AI)
                      </Button>
                   </div>
                   <Textarea 
                      value={response} 
                      onChange={(e) => setResponse(e.target.value)} 
                      placeholder="اكتب ردك الفني أو سبب الرفض/الإحالة هنا..." 
                      className="banking-input min-h-[200px] p-8 text-lg text-right" 
                   />
                   
                   <div className="flex flex-wrap justify-end gap-4 pt-6">
                      <Button variant="outline" className="h-16 px-10 rounded-[28px] border-red-200 text-red-600 hover:bg-red-50 font-black text-lg" onClick={() => handleAction('Rejected')} disabled={isProcessing}>
                         <XCircle className="w-6 h-6 ml-2" /> رفض البلاغ
                      </Button>
                      <Button variant="outline" className="h-16 px-10 rounded-[28px] border-amber-200 text-amber-600 hover:bg-amber-50 font-black text-lg" onClick={() => handleAction('Escalated')} disabled={isProcessing}>
                         <Send className="w-6 h-6 ml-2" /> إحالة للمشرف
                      </Button>
                      <Button className="banking-button premium-gradient text-white h-16 px-16 text-xl shadow-2xl" onClick={() => handleAction('Resolved')} disabled={isProcessing}>
                         <CheckCircle2 className="w-6 h-6 ml-2" /> اعتماد الحل والإغلاق
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
                   <CardTitle className="text-lg font-black text-slate-800">سجل تتبع البلاغ</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                   <div className="space-y-6">
                      {selectedTicket.logs?.map((log: any, idx: number) => (
                        <div key={idx} className="relative pr-6 border-r-2 border-slate-100 last:border-0 pb-6 text-right">
                           <div className="absolute top-0 -right-[7px] w-3.5 h-3.5 rounded-full bg-primary border-2 border-white"></div>
                           <div className="text-right">
                              <p className="font-black text-slate-800 text-xs">{log.action}</p>
                              <p className="text-[10px] text-slate-400 font-black mt-1">{new Date(log.timestamp).toLocaleString('ar-SA')}</p>
                              {log.note && <p className="mt-2 text-[11px] bg-slate-50 p-2 rounded-lg border border-slate-100 font-bold text-slate-600">{log.note}</p>}
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
            <div className="p-4 bg-primary/5 rounded-[22px]"><Inbox className="w-8 h-8 text-primary" /></div>
            <div className="text-right">
              <CardTitle className="text-2xl text-primary font-black">صندوق المهام الواردة</CardTitle>
              <p className="text-slate-400 font-bold mt-1">البلاغات الموجهة لقسمك بانتظار المعالجة</p>
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
                    <TableHead className="text-right h-18 font-black text-white">الحالة</TableHead>
                    <TableHead className="text-center h-18 font-black text-white pl-12">الإجراء</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tickets?.map((t: any, index: number) => (
                    <TableRow 
                      key={t.id} 
                      className={`transition-colors border-b border-slate-100 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
                    >
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
                      <TableCell className="py-6 text-right">{getStatusBadge(t.status)}</TableCell>
                      <TableCell className="py-6 text-center pl-12">
                        {!t.assignedToSpecialistId ? (
                          <Button 
                             onClick={() => handleClaim(t)} 
                             className="banking-button premium-gradient text-white h-11 px-8 font-black"
                          >
                             <UserPlus className="w-4 h-4 ml-2" /> استلام البلاغ
                          </Button>
                        ) : t.assignedToSpecialistId === user?.id ? (
                          <Button variant="outline" onClick={() => setSelectedTicket(t)} className="rounded-full h-11 px-8 border-primary text-primary hover:bg-primary hover:text-white font-black">
                             معالجة الآن
                          </Button>
                        ) : (
                          <span className="text-slate-400 font-black text-[10px] bg-slate-100 px-4 py-2 rounded-full">مستلم بواسطة {t.assignedToSpecialistName}</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!tickets || tickets.length === 0) && (
                    <TableRow><TableCell colSpan={5} className="text-center py-32 font-black text-slate-400">لا توجد مهام حالياً في قسمك</TableCell></TableRow>
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
