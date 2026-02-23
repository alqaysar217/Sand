
"use client"

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CheckCircle2, Sparkles, ArrowRight, Loader2, ImageIcon
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
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
  const [claimDialogOpen, setClaimDialogOpen] = useState(false);
  const [ticketToClaim, setTicketToClaim] = useState<any | null>(null);
  const [selectedStaffName, setSelectedStaffName] = useState('');

  const myDeptServiceType = user?.department === 'Cards' ? 'إدارة البطائق' : 'خدمة العملاء';

  const configRef = useMemoFirebase(() => db ? doc(db, 'settings', 'system-config') : null, [db]);
  const { data: config } = useDoc(configRef);

  const myDeptTicketsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'tickets'), where('serviceType', '==', myDeptServiceType), orderBy('createdAt', 'desc'));
  }, [db, myDeptServiceType]);

  const { data: tickets, isLoading } = useCollection(myDeptTicketsQuery);

  const filteredTickets = useMemo(() => {
    if (!tickets) return [];
    return tickets.filter(t => activeStatusFilter === 'all' || t.status === activeStatusFilter);
  }, [tickets, activeStatusFilter]);

  const handleClaimConfirm = () => {
    if (!db || !user || !ticketToClaim || !selectedStaffName) return;
    updateDocumentNonBlocking(doc(db, 'tickets', ticketToClaim.id), {
      assignedToSpecialistId: user.id,
      assignedToSpecialistName: selectedStaffName,
      status: 'Pending',
      logs: arrayUnion({ action: `تم استلام البلاغ بواسطة الأخصائي: ${selectedStaffName}`, timestamp: new Date().toISOString(), userName: selectedStaffName })
    });
    toast({ title: "تم الاستلام", description: "تم بدء معالجة البلاغ" });
    setClaimDialogOpen(false);
    setTicketToClaim(null);
  };

  const handleAction = async (actionType: 'Resolved' | 'Rejected' | 'Escalated') => {
    if (!db || !selectedTicket || !response.trim()) {
       toast({ variant: "destructive", title: "تنبيه", description: "يجب كتابة رد فني." });
       return;
    }
    setIsProcessing(true);
    const updateData: any = {
      status: actionType,
      logs: arrayUnion({ action: `إجراء متخذ: ${actionType}`, timestamp: new Date().toISOString(), userName: selectedTicket.assignedToSpecialistName, note: response })
    };
    if (actionType === 'Resolved') updateData.specialistResponse = response;
    
    updateDocumentNonBlocking(doc(db, 'tickets', selectedTicket.id), updateData);
    toast({ title: "تم التحديث", description: "تم حفظ الإجراء بنجاح." });
    setSelectedTicket(null);
    setResponse('');
    setIsProcessing(false);
  };

  const handleAiSuggest = async () => {
    if (!selectedTicket) return;
    setIsGenerating(true);
    const result = await smartResponseAssistant({ complaintDetails: selectedTicket.description });
    setResponse(result.suggestedResponse);
    setIsGenerating(false);
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

  if (selectedTicket) {
    return (
      <div className="space-y-8 text-right animate-in fade-in" dir="rtl">
        <Button variant="ghost" onClick={() => setSelectedTicket(null)} className="rounded-full font-black"><ArrowRight className="w-5 h-5 ml-2" /> العودة لمحطة العمل</Button>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <Card className="lg:col-span-2 banking-card border-r-4 border-primary">
              <CardHeader className="bg-slate-50 p-8 border-b">
                 <CardTitle className="text-2xl font-black text-primary">معالجة بلاغ: {selectedTicket.ticketID}</CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                 <div className="bg-slate-50 p-6 rounded-2xl space-y-4">
                    <h4 className="font-black text-slate-800">تفاصيل بلاغ الكول سنتر:</h4>
                    <p className="font-medium text-slate-600">{selectedTicket.description}</p>
                    {selectedTicket.attachments?.length > 0 && (
                      <div className="grid grid-cols-3 gap-4 mt-4">
                        {selectedTicket.attachments.map((at: any, i: number) => (
                          <div key={i} className="bg-white border p-1 rounded-xl">
                            <img src={at.url} alt="attachment" className="w-full aspect-video object-cover rounded-lg" />
                          </div>
                        ))}
                      </div>
                    )}
                 </div>
                 <div className="space-y-4">
                    <div className="flex justify-between items-center flex-row-reverse">
                       <h4 className="font-black text-slate-800">الرد الفني والحل المتخذ:</h4>
                       <Button variant="outline" size="sm" onClick={handleAiSuggest} disabled={isGenerating} className="rounded-full text-accent font-black">
                          {isGenerating ? <Loader2 className="animate-spin ml-2" /> : <Sparkles className="ml-2" />} مساعد الرد الذكي
                       </Button>
                    </div>
                    <Textarea value={response} onChange={e => setResponse(e.target.value)} placeholder="اكتب الرد الفني هنا..." className="banking-input min-h-[150px] text-right" />
                    <div className="flex justify-end gap-3 pt-4">
                       <Button variant="outline" onClick={() => handleAction('Rejected')} className="text-red-600 rounded-full font-black">رفض</Button>
                       <Button className="banking-button premium-gradient text-white px-12 rounded-full font-black" onClick={() => handleAction('Resolved')} disabled={isProcessing}>اعتماد الحل</Button>
                    </div>
                 </div>
              </CardContent>
           </Card>
           <Card className="banking-card">
              <CardHeader className="p-6 border-b"><CardTitle className="text-lg font-black">بيانات العميل</CardTitle></CardHeader>
              <CardContent className="p-6 space-y-4">
                 <div className="space-y-1">
                   <p className="text-[10px] text-slate-400 font-bold uppercase">الاسم</p>
                   <p className="font-black">{selectedTicket.customerName}</p>
                 </div>
                 <div className="space-y-1">
                   <p className="text-[10px] text-slate-400 font-bold uppercase">رقم CIF</p>
                   <p className="font-mono font-bold">{selectedTicket.cif}</p>
                 </div>
                 <div className="pt-4 border-t">
                    <h4 className="text-xs font-black mb-3">سجل التتبع</h4>
                    {selectedTicket.logs?.map((log: any, idx: number) => (
                       <div key={idx} className="border-r-2 border-slate-100 pr-4 pb-4">
                          <p className="text-xs font-black text-slate-800">{log.action}</p>
                          <p className="text-[10px] text-slate-400 mt-1">{new Date(log.timestamp).toLocaleString('ar-SA')}</p>
                       </div>
                    ))}
                 </div>
              </CardContent>
           </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 text-right animate-in fade-in" dir="rtl">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="text-right">
          <h1 className="text-3xl font-black text-primary tracking-tight">محطة العمل الفنية - قسم {user?.department === 'Cards' ? 'البطائق' : 'خدمة العملاء'}</h1>
          <p className="text-slate-500 font-bold mt-1">معالجة البلاغات الواردة من الكول سنتر</p>
        </div>
        <Tabs value={activeStatusFilter} onValueChange={setActiveStatusFilter} className="bg-slate-100 p-1 rounded-full h-auto">
          <TabsList className="bg-transparent">
            <TabsTrigger value="all" className="rounded-full px-6 py-2 font-black">الكل</TabsTrigger>
            <TabsTrigger value="New" className="rounded-full px-6 py-2 font-black">جديد</TabsTrigger>
            <TabsTrigger value="Pending" className="rounded-full px-6 py-2 font-black">قيد المعالجة</TabsTrigger>
            <TabsTrigger value="Resolved" className="rounded-full px-6 py-2 font-black">تم الحل</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Card className="banking-card overflow-hidden shadow-xl border-none">
        <CardContent className="p-0">
           {isLoading ? (
             <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary h-12 w-12" /></div>
           ) : (
             <Table>
                <TableHeader className="bg-primary">
                  <TableRow className="border-none hover:bg-primary">
                    <TableHead className="text-right h-14 font-black text-white pr-8">رقم البلاغ</TableHead>
                    <TableHead className="text-right h-14 font-black text-white">العميل</TableHead>
                    <TableHead className="text-right h-14 font-black text-white">الحالة</TableHead>
                    <TableHead className="text-center h-14 font-black text-white pl-8">الإجراء</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTickets?.map((t: any, idx: number) => (
                    <TableRow key={t.id} className={`border-b ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                      <TableCell className="py-4 font-black pr-8 text-right"><Badge variant="outline">{t.ticketID}</Badge></TableCell>
                      <TableCell className="py-4 text-right font-bold">{t.customerName}</TableCell>
                      <TableCell className="py-4 text-right">{getStatusBadge(t.status)}</TableCell>
                      <TableCell className="py-4 text-center pl-8">
                        {!t.assignedToSpecialistId ? (
                          <Button onClick={() => { setTicketToClaim(t); setClaimDialogOpen(true); }} className="banking-button premium-gradient text-white h-10 px-8 font-black">استلام والعمل</Button>
                        ) : (
                          <Button variant="outline" onClick={() => setSelectedTicket(t)} className="rounded-full h-10 px-8 border-primary text-primary font-black">فتح المعالجة</Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredTickets.length === 0 && <TableRow><TableCell colSpan={4} className="text-center py-20 font-black text-slate-400">لا توجد بلاغات حالياً</TableCell></TableRow>}
                </TableBody>
             </Table>
           )}
        </CardContent>
      </Card>

      <Dialog open={claimDialogOpen} onOpenChange={setClaimDialogOpen}>
         <DialogContent className="max-w-md text-right rounded-[32px]" dir="rtl">
            <DialogHeader><DialogTitle className="text-2xl font-black text-primary text-right">تأكيد استلام البلاغ</DialogTitle></DialogHeader>
            <div className="py-6 space-y-4">
               <Label className="font-black text-xs">اسم الموظف القائم بالاستلام</Label>
               <Select value={selectedStaffName} onValueChange={setSelectedStaffName}>
                  <SelectTrigger className="banking-input h-14 text-right font-black">
                    <SelectValue placeholder={(user?.department === 'Cards' ? config?.specialistNames : config?.csNames)?.length ? "اختر اسمك من القائمة" : "ثم اضافة الموظفين من قبل في واجهه المدير، لم لا تظهر"} />
                  </SelectTrigger>
                  <SelectContent dir="rtl">
                     {(user?.department === 'Cards' ? config?.specialistNames : config?.csNames)?.map((n: string) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                  </SelectContent>
               </Select>
            </div>
            <DialogFooter className="flex-row-reverse gap-3">
               <Button variant="ghost" onClick={() => setClaimDialogOpen(false)} className="rounded-full font-black">إلغاء</Button>
               <Button onClick={handleClaimConfirm} disabled={!selectedStaffName} className="banking-button premium-gradient text-white px-10 rounded-full font-black h-12">تأكيد الاستلام</Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>
    </div>
  );
}
