"use client"

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Send, Copy, Search, Loader2, FileText, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';

export function AgentView() {
  const { user } = useAuth();
  const db = useFirestore();
  const { toast } = useToast();
  const [showNewForm, setShowNewForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    customerName: '',
    cif: '',
    phone: '',
    service: '',
    issue: ''
  });

  // الاستعلام المفلتر الخاص بالموظف - مطابق تماماً للقواعد الأمنية المبسطة
  const agentTicketsQuery = useMemoFirebase(() => {
    if (!db || !user?.id) return null;
    return query(
      collection(db, 'tickets'),
      where('createdByAgentId', '==', user.id),
      orderBy('createdAt', 'desc')
    );
  }, [db, user?.id]);

  const { data: tickets, isLoading: isTicketsLoading } = useCollection(agentTicketsQuery);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !db) return;

    setIsSubmitting(true);
    const ticketID = `TIC-${Math.floor(1000 + Math.random() * 9000)}`;
    
    const newTicket = {
      ticketID,
      createdAt: new Date().toISOString(),
      status: 'New',
      customerName: formData.customerName,
      cif: formData.cif,
      phoneNumber: formData.phone,
      serviceType: formData.service,
      subIssue: formData.issue,
      createdByAgentId: user.id,
      attachments: []
    };

    addDocumentNonBlocking(collection(db, 'tickets'), newTicket)
      .then(() => {
        toast({ title: "تم الرفع بنجاح", description: `تم إنشاء البلاغ رقم ${ticketID}.` });
        setShowNewForm(false);
        setFormData({ customerName: '', cif: '', phone: '', service: '', issue: '' });
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({ title: "تم النسخ", description: "تم نسخ البيانات." });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">واجهة رفع البلاغات</h1>
          <p className="text-muted-foreground">نظام {user?.department === 'Support' ? 'الكول سنتر' : 'خدمة العملاء'} - الرفع والمتابعة</p>
        </div>
        <Button onClick={() => setShowNewForm(!showNewForm)} className="bg-accent hover:bg-accent/90 text-primary font-bold w-full md:w-auto">
          {showNewForm ? 'العودة للقائمة' : <><Plus className="w-4 h-4 ml-2" /> إنشاء بلاغ جديد</>}
        </Button>
      </div>

      {showNewForm ? (
        <Card className="max-w-3xl border-2 border-primary/10 shadow-lg">
          <CardHeader className="bg-blue-50/50 text-right border-b">
            <CardTitle className="text-primary">بيانات البلاغ الجديد</CardTitle>
            <CardDescription>يرجى إرفاق تفاصيل العميل والشكوى بدقة عالية</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleCreateTicket} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 text-right">
                  <Label htmlFor="customerName">اسم العميل بالكامل</Label>
                  <Input 
                    id="customerName" 
                    placeholder="الاسم الرباعي" 
                    required 
                    className="text-right"
                    value={formData.customerName}
                    onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                  />
                </div>
                <div className="space-y-2 text-right">
                  <Label htmlFor="cif">رقم الهوية / CIF</Label>
                  <Input 
                    id="cif" 
                    placeholder="8 أرقام" 
                    required 
                    className="text-right font-mono"
                    value={formData.cif}
                    onChange={(e) => setFormData({...formData, cif: e.target.value})}
                  />
                </div>
                <div className="space-y-2 text-right">
                  <Label htmlFor="phone">رقم الاتصال</Label>
                  <Input 
                    id="phone" 
                    placeholder="966..." 
                    required 
                    dir="ltr" 
                    className="text-right"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
                <div className="space-y-2 text-right">
                  <Label htmlFor="service">القسم المعني بالمعالجة</Label>
                  <Select 
                    required 
                    dir="rtl"
                    onValueChange={(val) => setFormData({...formData, service: val})}
                  >
                    <SelectTrigger className="text-right">
                      <SelectValue placeholder="اختر القسم" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cards">قسم البطائق</SelectItem>
                      <SelectItem value="Digital">خدمات الأونلاين</SelectItem>
                      <SelectItem value="Support">الدعم الفني العام</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2 text-right">
                <Label htmlFor="issue">تفاصيل الشكوى أو الطلب</Label>
                <textarea 
                  id="issue" 
                  placeholder="يرجى كتابة شرح وافٍ للمشكلة..." 
                  required 
                  className="w-full min-h-[100px] p-3 rounded-md border text-right focus:ring-2 focus:ring-primary outline-none"
                  value={formData.issue}
                  onChange={(e) => setFormData({...formData, issue: e.target.value})}
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t flex-row-reverse">
                <Button type="button" variant="outline" onClick={() => setShowNewForm(false)}>إلغاء العملية</Button>
                <Button type="submit" className="bg-primary text-white px-8" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Send className="w-4 h-4 ml-2 rotate-180" />} 
                  إرسال البلاغ فوراً
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-md">
          <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between pb-2 gap-4 flex-row-reverse">
            <CardTitle className="text-lg text-right w-full">سجل البلاغات المرفوعة</CardTitle>
          </CardHeader>
          <CardContent>
            {isTicketsLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="animate-spin text-primary" /></div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead className="text-right">التذكرة</TableHead>
                      <TableHead className="text-right">التاريخ</TableHead>
                      <TableHead className="text-right">العميل</TableHead>
                      <TableHead className="text-right">القسم المعني</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                      <TableHead className="text-left">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tickets?.map((ticket: any) => (
                      <TableRow key={ticket.id} className="hover:bg-slate-50/50">
                        <TableCell className="font-mono text-xs font-bold text-blue-600">{ticket.ticketID}</TableCell>
                        <TableCell className="text-xs whitespace-nowrap">{new Date(ticket.createdAt).toLocaleDateString('ar-SA')}</TableCell>
                        <TableCell>
                          <div className="flex flex-col text-right">
                            <span className="font-medium text-sm">{ticket.customerName}</span>
                            <div className="flex items-center justify-end gap-1 text-[10px] text-muted-foreground">
                              {ticket.cif}
                              <Button variant="ghost" size="icon" className="h-4 w-4" onClick={() => copyToClipboard(ticket.cif, ticket.id)}>
                                {copiedId === ticket.id ? <Check className="h-2 w-2 text-green-600" /> : <Copy className="h-2 w-2" />}
                              </Button>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline" className="text-[10px] whitespace-nowrap">
                            {ticket.serviceType === 'Cards' ? 'قسم البطائق' : ticket.serviceType === 'Digital' ? 'خدمة العملاء' : 'الكول سنتر'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge className={
                            ticket.status === 'Pending' ? 'status-pending' : 
                            ticket.status === 'Resolved' ? 'status-resolved' : 
                            ticket.status === 'New' ? 'status-new' : ''
                          }>
                            {ticket.status === 'New' ? 'جديد' : ticket.status === 'Pending' ? 'قيد المعالجة' : 'تم الحل'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-left">
                          <Button variant="ghost" size="sm" className="h-8">
                            <FileText className="w-3 h-3 ml-1" /> التفاصيل
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {tickets?.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">لا توجد بلاغات مرفوعة حالياً</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}