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
      title: "Success",
      description: "Ticket TIC-1004 has been created successfully.",
    });
    setShowNewForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-primary">Agent Portal</h1>
          <p className="text-muted-foreground">Manage and track your customer complaints</p>
        </div>
        <Button onClick={() => setShowNewForm(!showNewForm)} className="bg-accent hover:bg-accent/90 text-primary font-bold">
          {showNewForm ? 'Back to Table' : <><Plus className="w-4 h-4 mr-2" /> New Complaint</>}
        </Button>
      </div>

      {showNewForm ? (
        <Card className="max-w-3xl border-2 border-primary/10">
          <CardHeader className="bg-blue-50/50">
            <CardTitle>Register New Complaint</CardTitle>
            <CardDescription>Enter customer details accurately. These cannot be changed after submission.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleCreateTicket} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customerName">Customer Name</Label>
                  <Input id="customerName" placeholder="Full legal name" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cif">CIF Number</Label>
                  <Input id="cif" placeholder="8-digit CIF" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" placeholder="+966..." required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="service">Service Type</Label>
                  <Select required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Service" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cards">Cards Department</SelectItem>
                      <SelectItem value="Digital">Digital Banking</SelectItem>
                      <SelectItem value="Support">General Support</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="issue">Issue Description</Label>
                <Input id="issue" placeholder="Brief summary of the problem" required />
              </div>
              <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-muted-foreground hover:bg-slate-50 transition-colors cursor-pointer">
                <Upload className="w-8 h-8 mb-2" />
                <p className="text-sm font-medium">Click or drag files to upload attachments</p>
                <p className="text-xs">Supports: JPG, PNG, PDF (Max 5MB)</p>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setShowNewForm(false)}>Cancel</Button>
                <Button type="submit" className="bg-primary text-white">
                  <Send className="w-4 h-4 mr-2" /> Submit Ticket
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">My Submissions</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search CIF or ID..." className="pl-8" />
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead>Ticket ID</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>CIF</TableHead>
                  <TableHead>Dept</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MOCK_TICKETS.filter(t => t.createdBy === 'agent-1').map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell className="font-mono text-xs font-bold">{ticket.ticketID}</TableCell>
                    <TableCell className="text-xs">{new Date(ticket.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="font-medium">{ticket.customerName}</TableCell>
                    <TableCell className="text-xs">{ticket.CIF}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{ticket.department}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={
                        ticket.status === 'Pending' ? 'status-pending' : 
                        ticket.status === 'Resolved' ? 'status-resolved' : 
                        ticket.status === 'New' ? 'status-new' : ''
                      }>
                        {ticket.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        <FileText className="w-4 h-4 mr-1" /> Details
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