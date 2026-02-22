
"use client"

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CheckCircle2, UserPlus, Copy, MessageSquare, Sparkles, ArrowRight, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { smartResponseAssistant } from '@/ai/flows/smart-response-assistant';
import { useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase';
import { collection, query, where, doc, orderBy } from 'firebase/firestore';

export function SpecialistView() {
  const { user } = useAuth();
  const db = useFirestore();
  const { toast } = useToast();
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [response, setResponse] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // الاستعلام الذي يتطلب الفهرس الثاني: serviceType (Asc) + createdAt (Desc)
  const deptTicketsQuery = useMemoFirebase(() => {
    if (!db || !user?.department) return null;
    return query(
      collection(db, 'tickets'),
      where('serviceType', '==', user.department),
      orderBy('createdAt', 'desc')
    );
  }, [db, user?.department]);

  const { data: tickets, isLoading: isTicketsLoading, error: queryError } = useCollection(deptTicketsQuery);

  const handleClaim = (ticketId: string) => {
    if (!db || !user) return;
    const ticketRef = doc(db, 'tickets', ticketId);
    updateDocumentNonBlocking(ticketRef, {
      assignedToSpecialistId: user.id,
      status: 'Pending'
    });
    
    addDocumentNonBlocking(collection(db, `tickets/${ticketId}/logs`), {
      ticketId,
      changedByUserId: user.id,
      changedAt: new Date().toISOString(),
      oldStatus: 'New',
      newStatus: 'Pending',
      response: 'تم استلام التذكرة من قبل الأخصائي.',
      ticketServiceType: user.department,
      ticketCreatedByAgentId: '',
      ticketAssignedToSpecialistId: user.id
    });

    toast({ title: "تم الاستلام", description: `تم تعيين التذكرة لك بنجاح.` });
  };

  const handleResolve = () => {
    if (!db || !user || !selectedTicket) return;
    const ticketRef = doc(db, 'tickets', selectedTicket.id);
    updateDocumentNonBlocking(ticketRef, { status: 'Resolved' });

    addDocumentNonBlocking(collection(db, `tickets/${selectedTicket.id}/logs`), {
      ticketId: selectedTicket.id,
      changedByUserId: user.id,
      changedAt: new Date().toISOString(),
      oldStatus: selectedTicket.status,
      newStatus: 'Resolved',
      response: response || 'تم حل المشكلة.',
      ticketServiceType: selectedTicket.serviceType,
      ticketCreatedByAgentId: selectedTicket.createdByAgentId,
      ticketAssignedToSpecialistId: user.id
    });

    toast({ title: "تم الحل", description: "تم إغلاق التذكرة بنجاح." });
    setSelectedTicket(null);
    setResponse('');
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "تم النسخ", description: `تم نسخ ${label}.` });
  };

  const handleAiSuggest = async () => {
    if (!selectedTicket) return;
    setIsGenerating(true);
    try {
      const result = await smartResponseAssistant({
        complaintDetails: `العميل: ${selectedTicket.customerName}, المشكلة: ${selectedTicket.subIssue}`,
        resolutionHistory: ["إعادة تعيين كلمة السر", "تحديث حدود الائتمان"]
      });
      setResponse(result.suggestedResponse);
    } catch (e) {
      toast({ variant: "destructive", title: "خطأ AI", description: "فشل إنشاء رد." });
    } finally {
      setIsGenerating(false);
    }
  };

  if (selectedTicket) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <Button variant="ghost" onClick={() => setSelectedTicket(null)} className="mb-4">
          <ArrowRight className="w-4 h-4 ml-2" /> العودة لقائمة المهام
        </Button>
        <Card className="border-r-4 border-r-primary">
          <CardHeader className="text-right">
            <div className="flex justify-between items-start flex-row-reverse">
              <div>
                <CardTitle className="text-xl">تذكرة رقم: {selectedTicket.ticketID}</CardTitle>
                <p className="text-muted-foreground text-sm">المشكلة: {selectedTicket.subIssue}</p>
              </div>
              <Badge variant="outline" className="bg-blue-50">القسم: {selectedTicket.serviceType}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg">
              <div className="space-y-1 text-right">
                <Label className="text-xs uppercase text-muted-foreground">رقم العميل (CIF)</Label>
                <div className="flex items-center gap-2 justify-end">
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleCopy(selectedTicket.cif, 'رقم العميل')}>
                    <Copy className="h-3 w-3" />
                  </Button>
                  <span className="font-mono font-bold">{selectedTicket.cif}</span>
                </div>
              </div>
              <div className="space-y-1 text-right">
                <Label className="text-xs uppercase text-muted-foreground">رقم الهاتف</Label>
                <div className="flex items-center gap-2 justify-end">
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleCopy(selectedTicket.phoneNumber, 'رقم الهاتف')}>
                    <Copy className="h-3 w-3" />
                  </Button>
                  <span className="font-mono font-bold" dir="ltr">{selectedTicket.phoneNumber}</span>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-row-reverse">
                <Label className="flex items-center gap-2 font-bold">
                  <MessageSquare className="w-4 h-4" /> رد الأخصائي
                </Label>
                <Button variant="outline" size="sm" onClick={handleAiSuggest} disabled={isGenerating}>
                  {isGenerating ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Sparkles className="w-4 h-4 ml-2 text-accent" />}
                  مساعد الرد الذكي
                </Button>
              </div>
              <Textarea value={response} onChange={(e) => setResponse(e.target.value)} placeholder="أدخل الرد الفني هنا..." className="min-h-[200px] text-right" />
              <div className="flex justify-end gap-3 flex-row-reverse">
                <Button className="bg-secondary text-white" onClick={handleResolve}>
                  <CheckCircle2 className="w-4 h-4 ml-2" /> حل التذكرة
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
        <h1 className="text-2xl font-bold text-primary">محطة عمل الأخصائي</h1>
        <p className="text-muted-foreground">إدارة تذاكر قسم <span className="font-bold text-secondary">{user?.department}</span></p>
      </div>
      <Card>
        <CardHeader className="text-right">
          <CardTitle className="text-lg">قائمة المهام الواردة</CardTitle>
        </CardHeader>
        <CardContent>
          {isTicketsLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <Loader2 className="animate-spin text-primary h-8 w-8" />
              <p className="text-sm text-muted-foreground text-center">جاري تحميل المهام وبناء الفهارس...</p>
            </div>
          ) : queryError ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4 text-center bg-blue-50 rounded-xl border border-blue-200">
              <AlertCircle className="w-12 h-12 text-blue-600" />
              <div className="space-y-2 px-6">
                <h3 className="font-bold text-blue-900">جاري بناء الفهرس (Index)</h3>
                <p className="text-sm text-blue-800 max-w-md mx-auto leading-relaxed">
                  عملية بناء الفهرس لهذا الاستعلام لا تزال جارية (Building). <br/>
                  يرجى الانتظار دقيقتين ثم تحديث الصفحة.
                </p>
                <Button variant="outline" size="sm" onClick={() => window.location.reload()} className="mt-4">
                  <RefreshCw className="w-3 h-3 ml-2" /> تحديث الصفحة الآن
                </Button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="text-right">رقم التذكرة</TableHead>
                    <TableHead className="text-right">العميل</TableHead>
                    <TableHead className="text-right">CIF</TableHead>
                    <TableHead className="text-right">الخدمة</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                    <TableHead className="text-left">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tickets && tickets.length > 0 ? (
                    tickets.map((ticket: any) => (
                      <TableRow key={ticket.id} className="cursor-pointer hover:bg-slate-50" onClick={() => setSelectedTicket(ticket)}>
                        <TableCell className="font-mono text-xs font-bold text-right">{ticket.ticketID}</TableCell>
                        <TableCell className="font-medium text-right">{ticket.customerName}</TableCell>
                        <TableCell className="text-xs text-right">{ticket.cif}</TableCell>
                        <TableCell className="text-right"><Badge variant="outline">{ticket.serviceType}</Badge></TableCell>
                        <TableCell className="text-right">
                          <Badge className={ticket.status === 'Pending' ? 'status-pending' : ticket.status === 'Resolved' ? 'status-resolved' : 'status-new'}>
                            {ticket.status === 'New' ? 'جديد' : ticket.status === 'Pending' ? 'قيد المعالجة' : 'تم الحل'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-left" onClick={(e) => e.stopPropagation()}>
                          {!ticket.assignedToSpecialistId ? (
                            <Button size="sm" onClick={() => handleClaim(ticket.id)} className="bg-primary text-white">
                              <UserPlus className="w-4 h-4 ml-2" /> استلام
                            </Button>
                          ) : (
                            <Button variant="outline" size="sm" onClick={() => setSelectedTicket(ticket)}>التفاصيل</Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-20 text-muted-foreground">
                        لا توجد تذاكر واردة لهذا القسم حالياً.
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
