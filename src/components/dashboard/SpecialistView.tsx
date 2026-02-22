"use client"

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  CheckCircle2, 
  UserPlus, 
  Copy, 
  MessageSquare, 
  Sparkles, 
  ArrowRight,
  Loader2
} from 'lucide-react';
import { MOCK_TICKETS } from '@/lib/mock-data';
import { useAuth } from '@/lib/contexts/AuthContext';
import { Ticket } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { smartResponseAssistant } from '@/ai/flows/smart-response-assistant';

export function SpecialistView() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [response, setResponse] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const myDeptTickets = MOCK_TICKETS.filter(t => t.department === user?.department);

  const handleClaim = (ticketId: string) => {
    toast({
      title: "تم الاستلام",
      description: `تم تعيين التذكرة لـ ${user?.name}.`,
    });
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "تم النسخ", description: `تم نسخ ${label} إلى الحافظة.` });
  };

  const handleAiSuggest = async () => {
    if (!selectedTicket) return;
    setIsGenerating(true);
    try {
      const result = await smartResponseAssistant({
        complaintDetails: `العميل: ${selectedTicket.customerName}, المشكلة: ${selectedTicket.subIssue}`,
        resolutionHistory: ["يحتاج العميل لإعادة تعيين كلمة السر للبطاقة الائتمانية", "تم تحديث النظام ليعكس الحدود الائتمانية الجديدة"]
      });
      setResponse(result.suggestedResponse);
    } catch (e) {
      toast({ variant: "destructive", title: "خطأ AI", description: "فشل في إنشاء رد ذكي." });
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-r-4 border-r-primary">
              <CardHeader className="text-right">
                <div className="flex justify-between items-start flex-row-reverse">
                  <div>
                    <CardTitle className="text-xl">تذكرة رقم: {selectedTicket.ticketID}</CardTitle>
                    <p className="text-muted-foreground text-sm">المشكلة: {selectedTicket.subIssue}</p>
                  </div>
                  <Badge variant="outline" className="bg-blue-50">القسم: {selectedTicket.department === 'Cards' ? 'البطاقات' : 'التطبيق'}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg">
                  <div className="space-y-1 text-right">
                    <Label className="text-xs uppercase text-muted-foreground">رقم العميل (CIF)</Label>
                    <div className="flex items-center gap-2 justify-end">
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleCopy(selectedTicket.CIF, 'رقم العميل')}>
                        <Copy className="h-3 w-3" />
                      </Button>
                      <span className="font-mono font-bold">{selectedTicket.CIF}</span>
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
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-primary hover:bg-blue-50 border-primary/20"
                      onClick={handleAiSuggest}
                      disabled={isGenerating}
                    >
                      {isGenerating ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Sparkles className="w-4 h-4 ml-2 text-accent" />}
                      مساعد الرد الذكي
                    </Button>
                  </div>
                  <Textarea 
                    value={response} 
                    onChange={(e) => setResponse(e.target.value)}
                    placeholder="أدخل الرد الفني المهني هنا..." 
                    className="min-h-[200px] text-right"
                  />
                  <div className="flex justify-end gap-3 flex-row-reverse">
                    <Button variant="outline" className="text-red-600 border-red-200">تصعيد</Button>
                    <Button className="bg-secondary text-white">
                      <CheckCircle2 className="w-4 h-4 ml-2" /> حل التذكرة
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader className="text-right"><CardTitle className="text-sm">سجل التذكرة</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="relative border-r-2 border-slate-200 pr-4 space-y-6 text-right">
                  <div className="relative">
                    <div className="absolute -right-5 top-1 w-2 h-2 rounded-full bg-blue-500"></div>
                    <p className="text-xs font-bold">تم الإنشاء بواسطة {selectedTicket.createdByName}</p>
                    <p className="text-[10px] text-muted-foreground">{new Date(selectedTicket.createdAt).toLocaleString('ar-SA')}</p>
                  </div>
                  <div className="relative">
                    <div className="absolute -right-5 top-1 w-2 h-2 rounded-full bg-slate-300"></div>
                    <p className="text-xs font-medium">تغيرت الحالة إلى {selectedTicket.status === 'New' ? 'جديد' : selectedTicket.status}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">محطة عمل الأخصائي</h1>
        <p className="text-muted-foreground">إدارة تذاكر قسم <span className="font-bold text-secondary">{user?.department === 'Cards' ? 'البطاقات' : 'التطبيق'}</span></p>
      </div>

      <Card>
        <CardHeader className="text-right">
          <CardTitle className="text-lg">قائمة المهام الواردة</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="text-right">رقم التذكرة</TableHead>
                <TableHead className="text-right">العميل</TableHead>
                <TableHead className="text-right">CIF</TableHead>
                <TableHead className="text-right">الخدمة</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead className="text-right">بواسطة</TableHead>
                <TableHead className="text-left">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {myDeptTickets.map((ticket) => (
                <TableRow key={ticket.id} className="cursor-pointer hover:bg-slate-50" onClick={() => setSelectedTicket(ticket)}>
                  <TableCell className="font-mono text-xs font-bold">{ticket.ticketID}</TableCell>
                  <TableCell className="font-medium">{ticket.customerName}</TableCell>
                  <TableCell className="text-xs">{ticket.CIF}</TableCell>
                  <TableCell><Badge variant="outline">{ticket.serviceType === 'Cards' ? 'بطاقات' : 'رقمي'}</Badge></TableCell>
                  <TableCell>
                    <Badge className={
                      ticket.status === 'Pending' ? 'status-pending' : 
                      ticket.status === 'Resolved' ? 'status-resolved' : 
                      ticket.status === 'New' ? 'status-new' : ''
                    }>
                      {ticket.status === 'New' ? 'جديد' : ticket.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {ticket.assignedName || 'غير معين'}
                  </TableCell>
                  <TableCell className="text-left" onClick={(e) => e.stopPropagation()}>
                    {!ticket.assignedTo ? (
                      <Button size="sm" onClick={() => handleClaim(ticket.id)} className="bg-primary text-white">
                        <UserPlus className="w-4 h-4 ml-2" /> استلام
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => setSelectedTicket(ticket)}>
                        التفاصيل
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
