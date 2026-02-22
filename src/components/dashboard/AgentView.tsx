"use client"

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Send, Copy, Search, Loader2, FileText, Check, ArrowRight, AlertCircle, RefreshCw } from 'lucide-react';
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

  // الاستعلام المحدث: يتطلب فهرس (Index) ليعمل مع orderBy
  const agentTicketsQuery = useMemoFirebase(() => {
    if (!db || !user?.id) return null;
    return query(
      collection(db, 'tickets'),
      where('createdByAgentId', '==', user.id),
      orderBy('createdAt', 'desc')
    );
  }, [db, user?.id]);

  const { data: tickets, isLoading: isTicketsLoading, error: queryError } = useCollection(agentTicketsQuery);

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
        toast({ 
          title: "تم الرفع بنجاح", 
          description: `تم إنشاء البلاغ رقم ${ticketID} بنجاح.` 
        });
        setShowNewForm(false);
        setFormData({ customerName: '', cif: '', phone: '', service: '', issue: '' });
      })
      .catch((err) => {
        toast({ 
          variant: "destructive",
          title: "خطأ في الإرسال", 
          description: "حدث خطأ أثناء محاولة إنشاء البلاغ." 
        });
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({ title: "تم النسخ", description: "تم نسخ البيانات إلى الحافظة." });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">واجهة موظف خدمة العملاء</h1>
          <p className="text-muted-foreground">قسم {user?.department} - إدارة ورفع البلاغات</p>
        </div>
        {!showNewForm && (
          <Button onClick={() => setShowNewForm(true)} className="bg-accent hover:bg-accent/90 text-primary font-bold w-full md:w-auto">
            <Plus className="w-4 h-4 ml-2" /> إنشاء بلاغ جديد
          </Button>
        )}
      </div>

      {showNewForm ? (
        <Card className="max-w-4xl border-2 border-primary/10 shadow-lg">
          <CardHeader className="bg-blue-50/50 text-right border-b flex flex-row items-center justify-between">
            <div className="text-right flex-1">
              <CardTitle className="text-primary">بيانات البلاغ الجديد</CardTitle>
              <CardDescription>يرجى إدخال تفاصيل العميل والشكوى بدقة</CardDescription>
            </div>
            <Button variant="ghost" onClick={() => setShowNewForm(false)} className="mr-4">
              <ArrowRight className="w-4 h-4 ml-2" /> العودة للسجل
            </Button>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleCreateTicket} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 text-right">
                  <Label htmlFor="customerName">اسم العميل بالكامل</Label>
                  <Input 
                    id="customerName" 
                    placeholder="أدخل الاسم الثلاثي أو الرباعي" 
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
                    placeholder="رقم العميل الموحد" 
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
                    placeholder="+966..." 
                    required 
                    dir="ltr" 
                    className="text-right"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
                <div className="space-y-2 text-right">
                  <Label htmlFor="service">نوع الخدمة / القسم المعني</Label>
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
                <Label htmlFor="issue">تفاصيل الشكوى</Label>
                <textarea 
                  id="issue" 
                  placeholder="اشرح المشكلة التي يواجهها العميل بالتفصيل..." 
                  required 
                  className="w-full min-h-[120px] p-3 rounded-md border text-right focus:ring-2 focus:ring-primary outline-none transition-all"
                  value={formData.issue}
                  onChange={(e) => setFormData({...formData, issue: e.target.value})}
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t flex-row-reverse">
                <Button type="button" variant="outline" onClick={() => setShowNewForm(false)}>إلغاء</Button>
                <Button type="submit" className="bg-primary text-white px-10" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <><Loader2 className="w-4 h-4 animate-spin ml-2" /> جاري الإرسال...</>
                  ) : (
                    <><Send className="w-4 h-4 ml-2 rotate-180" /> إرسال البلاغ</>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-md">
          <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 gap-4 flex-row-reverse border-b">
            <CardTitle className="text-lg text-right w-full">سجل بلاغاتك الأخيرة</CardTitle>
            <div className="relative w-full md:w-64">
              <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="بحث برقم البلاغ..." className="pr-10 text-right h-9" />
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {isTicketsLoading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <Loader2 className="animate-spin text-primary h-8 w-8" />
                <p className="text-sm text-muted-foreground">جاري تحميل السجل...</p>
              </div>
            ) : queryError ? (
               <div className="flex flex-col items-center justify-center py-12 gap-4 text-center bg-red-50 rounded-xl border border-red-200">
                <AlertCircle className="w-12 h-12 text-red-600" />
                <div className="space-y-2">
                  <h3 className="font-bold text-red-900">خطأ في عرض البيانات</h3>
                  <p className="text-sm text-red-800 max-w-md mx-auto">
                    إذا ظهر هذا الخطأ، يرجى التأكد من أن الفهرس (Index) في Firebase Console قد اكتمل إنشاؤه.
                  </p>
                  <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                    <RefreshCw className="w-3 h-3 ml-2" /> تحديث الصفحة
                  </Button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/50">
                      <TableHead className="text-right">رقم البلاغ</TableHead>
                      <TableHead className="text-right">التاريخ</TableHead>
                      <TableHead className="text-right">اسم العميل</TableHead>
                      <TableHead className="text-right">القسم</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                      <TableHead className="text-center">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tickets && tickets.length > 0 ? (
                      tickets.map((ticket: any) => (
                        <TableRow key={ticket.id} className="hover:bg-slate-50/50 transition-colors">
                          <TableCell className="font-mono text-xs font-bold text-blue-600">{ticket.ticketID}</TableCell>
                          <TableCell className="text-xs whitespace-nowrap">{new Date(ticket.createdAt).toLocaleDateString('ar-SA')}</TableCell>
                          <TableCell>
                            <div className="flex flex-col text-right">
                              <span className="font-medium text-sm">{ticket.customerName}</span>
                              <div className="flex items-center justify-end gap-1 text-[10px] text-muted-foreground font-mono">
                                {ticket.cif}
                                <Button variant="ghost" size="icon" className="h-4 w-4" onClick={() => copyToClipboard(ticket.cif, ticket.id)}>
                                  {copiedId === ticket.id ? <Check className="h-2 w-2 text-green-600" /> : <Copy className="h-2 w-2" />}
                                </Button>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant="outline" className="text-[10px] whitespace-nowrap font-normal">
                              {ticket.serviceType === 'Cards' ? 'قسم البطائق' : ticket.serviceType === 'Digital' ? 'خدمات الأونلاين' : 'الدعم الفني'}
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
                          <TableCell className="text-center">
                            <Button variant="ghost" size="sm" className="h-8 hover:text-primary">
                              <FileText className="w-3 h-3 ml-1" /> تفاصيل
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-20">
                          <div className="flex flex-col items-center gap-2 opacity-50">
                            <FileText className="h-10 w-10" />
                            <p>لا توجد بلاغات مرفوعة حالياً.</p>
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
      )}
    </div>
  );
}