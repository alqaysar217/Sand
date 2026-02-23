
"use client"

import React, { useState, useMemo, useEffect } from 'react';
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
  Phone, Share2, MessageSquare
} from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, useDoc } from '@/firebase';
import { collection, query, where, orderBy, doc } from 'firebase/firestore';

export function AgentView() {
  const { user } = useAuth();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [showNewForm, setShowNewForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);

  // التأكد من أن الكول سنتر هو الوحيد الذي يمكنه الرفع
  const canRaiseTickets = user?.department === 'Support';

  useEffect(() => {
    const handleSync = (e: any) => {
      const action = e.detail;
      if (action === 'new-ticket' && canRaiseTickets) setShowNewForm(true);
      else if (['all', 'New', 'Pending', 'Escalated', 'Resolved', 'Rejected'].includes(action)) {
        setShowNewForm(false);
        setActiveTab(action);
      }
    };
    window.addEventListener('sidebar-nav', handleSync);
    return () => window.removeEventListener('sidebar-nav', handleSync);
  }, [canRaiseTickets]);

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
    createdByAgentName: '' 
  });

  const agentTicketsQuery = useMemoFirebase(() => {
    if (!db || !user?.id) return null;
    return query(collection(db, 'tickets'), where('createdByAgentId', '==', user.id), orderBy('createdAt', 'desc'));
  }, [db, user?.id]);

  const { data: tickets } = useCollection(agentTicketsQuery);

  const filteredTickets = useMemo(() => {
    if (!tickets) return [];
    return tickets.filter(t => {
      const matchesSearch = (t.ticketID || '').includes(searchQuery) || (t.customerName || '').includes(searchQuery) || (t.cif || '').includes(searchQuery);
      const matchesStatus = activeTab === 'all' || t.status === activeTab;
      return matchesSearch && matchesStatus;
    });
  }, [tickets, searchQuery, activeTab]);

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
      createdByAgentName: formData.createdByAgentName,
      attachments: [],
      logs: [{ action: `تم رفع البلاغ من الكول سنتر بواسطة: ${formData.createdByAgentName}`, timestamp: new Date().toISOString(), userName: formData.createdByAgentName }]
    };

    addDocumentNonBlocking(collection(db, 'tickets'), newTicket)
      .then(() => {
        toast({ title: "تم الرفع بنجاح", description: `رقم البلاغ: ${ticketID}` });
        setShowNewForm(false);
        setFormData({ customerName: '', cif: '', phone: '', serviceType: '', intakeMethod: '', subIssue: '', description: '', createdByAgentName: '' });
      })
      .finally(() => setIsSubmitting(false));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending': return <Badge className="bg-amber-500 rounded-full font-black">قيد المعالجة</Badge>;
      case 'Resolved': return <Badge className="bg-green-600 rounded-full font-black">تم الحل</Badge>;
      case 'Rejected': return <Badge className="bg-slate-700 rounded-full font-black">مرفوض</Badge>;
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
          <p className="text-slate-500 font-bold mt-1">توجيه بلاغات العملاء للأقسام الفنية المختصة</p>
        </div>
        {canRaiseTickets && !showNewForm && (
          <Button onClick={() => setShowNewForm(true)} className="banking-button premium-gradient text-white h-14 px-8 shadow-xl">
            <Plus className="w-5 h-5 ml-2" /> فتح بلاغ جديد
          </Button>
        )}
      </div>

      {showNewForm ? (
        <Card className="banking-card max-w-4xl shadow-2xl border-none mx-auto overflow-hidden">
          <CardHeader className="bg-slate-50 p-8 border-b">
            <CardTitle className="text-primary text-2xl font-black">نموذج استلام وبث بلاغ</CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleCreateTicket} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 text-right">
                  <Label className="font-black text-xs mr-1">موظف الكول سنتر (الرفع)</Label>
                  <Select onValueChange={(v) => setFormData({...formData, createdByAgentName: v})} required>
                    <SelectTrigger className="banking-input h-12 text-right"><SelectValue placeholder="اختر اسم الموظف" /></SelectTrigger>
                    <SelectContent dir="rtl">
                      {config?.agentNames?.map((n: string) => <SelectItem key={n} value={n}>{n}</SelectItem>) || <SelectItem value="dev">موظف تجريبي</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 text-right">
                  <Label className="font-black text-xs mr-1">توجيه البلاغ إلى القسم المختص</Label>
                  <Select onValueChange={(v) => setFormData({...formData, serviceType: v})} required>
                    <SelectTrigger className="banking-input h-12 text-right"><SelectValue placeholder="اختر القسم المستلم" /></SelectTrigger>
                    <SelectContent dir="rtl">
                      <SelectItem value="إدارة البطائق">قسم البطائق</SelectItem>
                      <SelectItem value="خدمة العملاء">قسم خدمة العملاء</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 text-right">
                  <Label className="font-black text-xs mr-1">اسم العميل</Label>
                  <Input required value={formData.customerName} onChange={e => setFormData({...formData, customerName: e.target.value})} className="banking-input h-12 text-right" />
                </div>
                <div className="space-y-2 text-right">
                  <Label className="font-black text-xs mr-1">رقم CIF</Label>
                  <Input required value={formData.cif} onChange={e => setFormData({...formData, cif: e.target.value})} className="banking-input h-12 font-mono text-right" />
                </div>
                <div className="space-y-2 text-right">
                  <Label className="font-black text-xs mr-1 flex items-center gap-1 justify-end"><Share2 className="w-3 h-3" /> وسيلة استلام الطلب</Label>
                  <Select onValueChange={(v) => setFormData({...formData, intakeMethod: v})} required>
                    <SelectTrigger className="banking-input h-12 text-right"><SelectValue placeholder="اختر الوسيلة" /></SelectTrigger>
                    <SelectContent dir="rtl">
                      {config?.intakeMethods?.map((m: string) => <SelectItem key={m} value={m}>{m}</SelectItem>) || <SelectItem value="dev">وسيلة تجريبية</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 text-right">
                  <Label className="font-black text-xs mr-1 flex items-center gap-1 justify-end"><MessageSquare className="w-3 h-3" /> نوع المشكلة</Label>
                  <Select onValueChange={(v) => setFormData({...formData, subIssue: v})} required>
                    <SelectTrigger className="banking-input h-12 text-right"><SelectValue placeholder="اختر نوع المشكلة" /></SelectTrigger>
                    <SelectContent dir="rtl">
                      {config?.issueTypes?.map((i: string) => <SelectItem key={i} value={i}>{i}</SelectItem>) || <SelectItem value="dev">مشكلة تجريبية</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 text-right">
                   <Label className="font-black text-xs mr-1 flex items-center gap-1 justify-end"><Phone className="w-3 h-3" /> رقم هاتف العميل</Label>
                   <Input required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="banking-input h-12 text-right" />
                </div>
              </div>
              <div className="space-y-2 text-right">
                <Label className="font-black text-xs mr-1">تفاصيل البلاغ كاملة</Label>
                <Textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="banking-input min-h-[120px] text-right" />
              </div>
              <div className="flex justify-end gap-3 pt-6 border-t">
                <Button type="button" variant="ghost" onClick={() => setShowNewForm(false)} className="rounded-full font-black">إلغاء</Button>
                <Button type="submit" className="banking-button premium-gradient text-white h-12 px-12" disabled={isSubmitting}>إرسال البلاغ فوراً</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card className="banking-card overflow-hidden shadow-xl border-none">
          <CardHeader className="p-8 border-b bg-white">
            <div className="flex flex-col md:flex-row-reverse justify-between items-center gap-6">
              <CardTitle className="text-2xl font-black text-primary flex items-center gap-3">
                 <Inbox className="w-6 h-6" /> سجل البلاغات الصادرة
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
                  <TableRow key={t.id} className={`border-b ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                    <TableCell className="font-black pr-8 text-right"><Badge variant="outline">{t.ticketID}</Badge></TableCell>
                    <TableCell className="text-right font-bold">{t.customerName}</TableCell>
                    <TableCell className="text-right font-bold text-slate-500">{t.serviceType}</TableCell>
                    <TableCell className="text-right">{getStatusBadge(t.status)}</TableCell>
                    <TableCell className="text-center pl-8">
                      <Button variant="outline" size="sm" onClick={() => setSelectedTicket(t)} className="rounded-full font-black">عرض التفاصيل</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* تفاصيل البلاغ */}
      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="max-w-3xl text-right rounded-[32px] p-0 overflow-hidden" dir="rtl">
           {selectedTicket && (
             <div className="p-8 space-y-6">
                <div className="flex justify-between items-center border-b pb-4">
                   <h3 className="text-2xl font-black text-primary">بلاغ رقم {selectedTicket.ticketID}</h3>
                   {getStatusBadge(selectedTicket.status)}
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="bg-slate-50 p-4 rounded-xl">
                      <span className="text-[10px] text-slate-400 block font-black">اسم العميل</span>
                      <p className="font-black">{selectedTicket.customerName}</p>
                   </div>
                   <div className="bg-slate-50 p-4 rounded-xl">
                      <span className="text-[10px] text-slate-400 block font-black">رقم CIF</span>
                      <p className="font-mono font-black">{selectedTicket.cif}</p>
                   </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="bg-slate-50 p-4 rounded-xl">
                      <span className="text-[10px] text-slate-400 block font-black">وسيلة الاستلام</span>
                      <p className="font-bold">{selectedTicket.intakeMethod}</p>
                   </div>
                   <div className="bg-slate-50 p-4 rounded-xl">
                      <span className="text-[10px] text-slate-400 block font-black">نوع المشكلة</span>
                      <p className="font-bold">{selectedTicket.subIssue}</p>
                   </div>
                </div>
                <div className="bg-slate-50 p-6 rounded-2xl">
                   <span className="text-[10px] text-slate-400 block font-black mb-2">تفاصيل المشكلة</span>
                   <p className="font-medium">{selectedTicket.description}</p>
                </div>
                {selectedTicket.specialistResponse && (
                  <div className="bg-green-50 border border-green-100 p-6 rounded-2xl">
                     <span className="text-[10px] text-green-600 block font-black mb-2">الرد الفني المعتمد</span>
                     <p className="font-bold text-green-800">{selectedTicket.specialistResponse}</p>
                  </div>
                )}
                <div className="flex justify-end">
                   <Button onClick={() => setSelectedTicket(null)} className="rounded-full font-black px-10">إغلاق</Button>
                </div>
             </div>
           )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
