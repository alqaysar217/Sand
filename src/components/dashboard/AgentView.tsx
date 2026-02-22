"use client"

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Send, Upload, FileText, Search } from 'lucide-react';
import { MOCK_TICKETS } from '@/lib/mock-data';
import { useToast } from '@/hooks/use-toast';

export function AgentView() {
  const [showNewForm, setShowNewForm] = useState(false);
  const { toast } = useToast();

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "نجاح",
      description: "تم إنشاء التذكرة TIC-1004 بنجاح.",
    });
    setShowNewForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-primary">بوابة الموظف</h1>
          <p className="text-muted-foreground">إدارة وتتبع شكاوى العملاء الخاصة بك</p>
        </div>
        <Button onClick={() => setShowNewForm(!showNewForm)} className="bg-accent hover:bg-accent/90 text-primary font-bold">
          {showNewForm ? 'العودة للجدول' : <><Plus className="w-4 h-4 ml-2" /> تسجيل شكوى جديدة</>}
        </Button>
      </div>

      {showNewForm ? (
        <Card className="max-w-3xl border-2 border-primary/10">
          <CardHeader className="bg-blue-50/50 text-right">
            <CardTitle>تسجيل شكوى جديدة</CardTitle>
            <CardDescription>أدخل تفاصيل العميل بدقة. لا يمكن تغيير هذه البيانات بعد الإرسال.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleCreateTicket} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 text-right">
                  <Label htmlFor="customerName">اسم العميل</Label>
                  <Input id="customerName" placeholder="الاسم القانوني الكامل" required className="text-right" />
                </div>
                <div className="space-y-2 text-right">
                  <Label htmlFor="cif">رقم العميل (CIF)</Label>
                  <Input id="cif" placeholder="رقم CIF المكون من 8 أرقام" required className="text-right" />
                </div>
                <div className="space-y-2 text-right">
                  <Label htmlFor="phone">رقم الهاتف</Label>
                  <Input id="phone" placeholder="+966..." required dir="ltr" className="text-right" />
                </div>
                <div className="space-y-2 text-right">
                  <Label htmlFor="service">نوع الخدمة</Label>
                  <Select required dir="rtl">
                    <SelectTrigger className="text-right">
                      <SelectValue placeholder="اختر الخدمة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cards">قسم البطاقات</SelectItem>
                      <SelectItem value="Digital">الخدمات الرقمية</SelectItem>
                      <SelectItem value="Support">الدعم العام</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2 text-right">
                <Label htmlFor="issue">وصف المشكلة</Label>
                <Input id="issue" placeholder="ملخص بسيط للمشكلة" required className="text-right" />
              </div>
              <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-muted-foreground hover:bg-slate-50 transition-colors cursor-pointer">
                <Upload className="w-8 h-8 mb-2" />
                <p className="text-sm font-medium">انقر أو اسحب الملفات لرفع المرفقات</p>
                <p className="text-xs">يدعم: JPG, PNG, PDF (بحد أقصى 5MB)</p>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t flex-row-reverse">
                <Button type="button" variant="outline" onClick={() => setShowNewForm(false)}>إلغاء</Button>
                <Button type="submit" className="bg-primary text-white">
                  <Send className="w-4 h-4 ml-2 rotate-180" /> إرسال التذكرة
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 flex-row-reverse">
            <CardTitle className="text-lg">تذاكري المرسلة</CardTitle>
            <div className="relative w-64">
              <Search className="absolute right-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="بحث برقم CIF أو التذكرة..." className="pr-8 text-right" />
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="text-right">رقم التذكرة</TableHead>
                  <TableHead className="text-right">تاريخ الإنشاء</TableHead>
                  <TableHead className="text-right">العميل</TableHead>
                  <TableHead className="text-right">CIF</TableHead>
                  <TableHead className="text-right">القسم</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-left">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MOCK_TICKETS.filter(t => t.createdBy === 'agent-1').map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell className="font-mono text-xs font-bold">{ticket.ticketID}</TableCell>
                    <TableCell className="text-xs">{new Date(ticket.createdAt).toLocaleDateString('ar-SA')}</TableCell>
                    <TableCell className="font-medium">{ticket.customerName}</TableCell>
                    <TableCell className="text-xs">{ticket.CIF}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{ticket.department === 'Cards' ? 'البطاقات' : ticket.department === 'App' ? 'التطبيق' : 'العمليات'}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={
                        ticket.status === 'Pending' ? 'status-pending' : 
                        ticket.status === 'Resolved' ? 'status-resolved' : 
                        ticket.status === 'New' ? 'status-new' : ''
                      }>
                        {ticket.status === 'New' ? 'جديد' : ticket.status === 'Pending' ? 'قيد الانتظار' : 'تم الحل'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-left">
                      <Button variant="ghost" size="sm">
                        <FileText className="w-4 h-4 ml-1" /> التفاصيل
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
