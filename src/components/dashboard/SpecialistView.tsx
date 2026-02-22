
"use client"

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CheckCircle2, UserPlus, Copy, MessageSquare, Sparkles, ArrowRight, Loader2, AlertCircle, RefreshCw, Clock } from 'lucide-react';
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
    toast({ title: "تم الاستلام", description: `تم تعيين التذكرة لك.` });
  };

  const handleResolve = () => {
    if (!db || !user || !selectedTicket) return;
    if (!response) {
      toast({ variant: "destructive", title: "تنبيه", description: "يجب كتابة رد فني قبل إغلاق البلاغ." });
      return;
    }

    const ticketRef = doc(db, 'tickets', selectedTicket.id);
    updateDocumentNonBlocking(ticketRef, {
      status: 'Resolved',
      specialistResponse: response,
      resolvedAt: new Date().toISOString(),
      logs: arrayUnion({
        action: 'تم حل البلاغ وإغلاقه',
        timestamp: new Date().toISOString(),
        userName: user.name,
        note: response
      })
    });

    toast({ title: "تم الحل بنجاح", description: "تم إرسال الرد للموظف وإغلاق البلاغ." });
    setSelectedTicket(null);
    setResponse('');
  };

  const handleAiSuggest = async () => {
    if (!selectedTicket) return;
    setIsGenerating(true);
    try {
      const result = await smartResponseAssistant({
        complaintDetails: `المشكلة: ${selectedTicket.subIssue}, التفاصيل: ${selectedTicket.description}`,
        resolutionHistory: ["إعادة تعيين الرقم السري للبطاقة", "تفعيل الحساب المجمد"]
      });
      setResponse(result.suggestedResponse);
    } catch (e) {
      toast({ variant: "destructive", title: "خطأ AI", description: "فشل استخراج الرد." });
    } finally {
      setIsGenerating(false);
    }
  };

  if (selectedTicket) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
        <Button variant="ghost" onClick={() => setSelectedTicket(null)} className="mb-4">
          <ArrowRight className="w-4 h-4 ml-2" /> قائمة المهام
        </Button>
        <Card className="border-r-4 border-r-primary shadow-lg">
          <CardHeader className="text-right border-b bg-slate-50/50">
            <div className="flex justify-between items-start flex-row-reverse">
              <div>
                <CardTitle className="text-xl">معالجة بلاغ رقم: {selectedTicket.ticketID}</CardTitle>
                <p className="text-muted-foreground text-sm">تاريخ البلاغ: {new Date(selectedTicket.createdAt).toLocaleString('ar-SA')}</p>
              </div>
              <Badge variant="outline" className="bg-blue-50 text-blue-700">العميل: {selectedTicket.customerName}</Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="bg-slate-50 p-4 rounded-lg space-y-4">
              <div className="grid grid-cols-2 gap-4">
                 <div className="text-right"><Label className="text-[10px] text-muted-foreground block">نوع المشكلة</Label><p className="font-bold">{selectedTicket.subIssue}</p></div>
                 <div className="text-right"><Label className="text-[10px] text-muted-foreground block">الحساب (CIF)</Label><p className="font-mono font-bold">{selectedTicket.cif}</p></div>
              </div>
              <Separator />
              <div className="text-right">
                <Label className="text-[10px] text-muted-foreground block">شرح الموظف للمشكلة</Label>
                <p className="text-sm bg-white p-3 rounded border mt-1 leading-relaxed">{selectedTicket.description}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between flex-row-reverse">
                <Label className="flex items-center gap-2 font-bold text-primary">
                  <MessageSquare className="w-4 h-4" /> الرد الفني والحل المقترح
                </Label>
                <Button variant="outline" size="sm" onClick={handleAiSuggest} disabled={isGenerating}>
                  {isGenerating ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Sparkles className="w-4 h-4 ml-2 text-accent" />}
                  مساعد الرد الذكي
                </Button>
              </div>
              <Textarea value={response} onChange={(e) => setResponse(e.target.value)} placeholder="اكتب هنا الإجراء الذي تم اتخاذه لحل المشكلة..." className="min-h-[150px] text-right" />
              <div className="flex justify-end gap-3 flex-row-reverse">
                <Button className="bg-green-600 hover:bg-green-700 text-white font-bold h-12 px-10" onClick={handleResolve}>
                  <CheckCircle2 className="w-4 h-4 ml-2" /> إرسال الحل وإغلاق البلاغ
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-right">
        <h1 className="text-2xl font-bold text-primary">محطة عمل الأخصائي الفني</h1>
        <p className="text-muted-foreground">بلاغات قسم <span className="font-bold text-secondary">{user?.department}</span></p>
      </div>
      <Card className="shadow-sm">
        <CardHeader className="text-right border-b pb-4">
          <CardTitle className="text-lg flex items-center gap-2 justify-end">المهام الواردة للمعالجة <Clock className="w-5 h-5 text-accent" /></CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {isTicketsLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary h-8 w-8" /></div>
          ) : queryError ? (
            <div className="text-center py-12 bg-blue-50 rounded-xl">
               <AlertCircle className="w-12 h-12 text-blue-600 mx-auto mb-4" />
               <h3 className="font-bold">جاري تحديث الفهارس</h3>
               <p className="text-sm text-blue-800">يرجى الانتظار دقيقة ثم تحديث الصفحة.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="text-right">رقم البلاغ</TableHead>
                  <TableHead className="text-right">العميل</TableHead>
                  <TableHead className="text-right">المشكلة</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-left">إجراء</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets?.map((t: any) => (
                  <TableRow key={t.id} className="hover:bg-slate-50/50 cursor-pointer" onClick={() => t.assignedToSpecialistId === user?.id && setSelectedTicket(t)}>
                    <TableCell className="font-bold text-blue-600 text-right">{t.ticketID}</TableCell>
                    <TableCell className="text-right">{t.customerName}</TableCell>
                    <TableCell className="text-right">{t.subIssue}</TableCell>
                    <TableCell className="text-right">
                      <Badge className={t.status === 'Pending' ? 'status-pending' : t.status === 'Resolved' ? 'status-resolved' : 'status-new'}>
                        {t.status === 'New' ? 'جديد' : t.status === 'Pending' ? 'قيد العمل' : 'محلول'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-left">
                      {!t.assignedToSpecialistId ? (
                        <Button size="sm" onClick={(e) => { e.stopPropagation(); handleClaim(t); }} className="bg-primary">استلام</Button>
                      ) : t.assignedToSpecialistId === user?.id ? (
                        <Button variant="outline" size="sm">فتح ومعالجة</Button>
                      ) : (
                        <Badge variant="secondary">مستلم</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
