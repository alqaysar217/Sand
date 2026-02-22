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
  ArrowLeft,
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
      title: "Ticket Claimed",
      description: `Ownership has been assigned to ${user?.name}.`,
    });
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: `${label} copied to clipboard.` });
  };

  const handleAiSuggest = async () => {
    if (!selectedTicket) return;
    setIsGenerating(true);
    try {
      const result = await smartResponseAssistant({
        complaintDetails: `Customer: ${selectedTicket.customerName}, Issue: ${selectedTicket.subIssue}`,
        resolutionHistory: ["Customer needs PIN reset for credit card", "System updated to reflect new limits"]
      });
      setResponse(result.suggestedResponse);
    } catch (e) {
      toast({ variant: "destructive", title: "AI Error", description: "Failed to generate AI response." });
    } finally {
      setIsGenerating(false);
    }
  };

  if (selectedTicket) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <Button variant="ghost" onClick={() => setSelectedTicket(null)} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Worklist
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-l-4 border-l-primary">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">Ticket: {selectedTicket.ticketID}</CardTitle>
                    <p className="text-muted-foreground text-sm">Issue: {selectedTicket.subIssue}</p>
                  </div>
                  <Badge variant="outline" className="bg-blue-50">Dept: {selectedTicket.department}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg">
                  <div className="space-y-1">
                    <Label className="text-xs uppercase text-muted-foreground">Customer CIF</Label>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold">{selectedTicket.CIF}</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleCopy(selectedTicket.CIF, 'CIF')}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs uppercase text-muted-foreground">Phone Number</Label>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold">{selectedTicket.phoneNumber}</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleCopy(selectedTicket.phoneNumber, 'Phone')}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2 font-bold">
                      <MessageSquare className="w-4 h-4" /> Specialist Response
                    </Label>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-primary hover:bg-blue-50 border-primary/20"
                      onClick={handleAiSuggest}
                      disabled={isGenerating}
                    >
                      {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2 text-accent" />}
                      Smart Response Assistant
                    </Button>
                  </div>
                  <Textarea 
                    value={response} 
                    onChange={(e) => setResponse(e.target.value)}
                    placeholder="Provide professional technical feedback..." 
                    className="min-h-[200px]"
                  />
                  <div className="flex justify-end gap-3">
                    <Button variant="outline" className="text-red-600 border-red-200">Escalate</Button>
                    <Button className="bg-secondary text-white">
                      <CheckCircle2 className="w-4 h-4 mr-2" /> Resolve Ticket
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle className="text-sm">Ticket History</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="relative border-l-2 border-slate-200 pl-4 space-y-6">
                  <div className="relative">
                    <div className="absolute -left-5 top-1 w-2 h-2 rounded-full bg-blue-500"></div>
                    <p className="text-xs font-bold">Created by {selectedTicket.createdByName}</p>
                    <p className="text-[10px] text-muted-foreground">{new Date(selectedTicket.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="relative">
                    <div className="absolute -left-5 top-1 w-2 h-2 rounded-full bg-slate-300"></div>
                    <p className="text-xs font-medium">Status changed to {selectedTicket.status}</p>
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
        <h1 className="text-2xl font-bold text-primary">Specialist Workstation</h1>
        <p className="text-muted-foreground">Manage tickets for the <span className="font-bold text-secondary">{user?.department}</span> department</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Incoming Worklist</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead>Ticket ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>CIF</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {myDeptTickets.map((ticket) => (
                <TableRow key={ticket.id} className="cursor-pointer hover:bg-slate-50" onClick={() => setSelectedTicket(ticket)}>
                  <TableCell className="font-mono text-xs font-bold">{ticket.ticketID}</TableCell>
                  <TableCell className="font-medium">{ticket.customerName}</TableCell>
                  <TableCell className="text-xs">{ticket.CIF}</TableCell>
                  <TableCell><Badge variant="outline">{ticket.serviceType}</Badge></TableCell>
                  <TableCell>
                    <Badge className={
                      ticket.status === 'Pending' ? 'status-pending' : 
                      ticket.status === 'Resolved' ? 'status-resolved' : 
                      ticket.status === 'New' ? 'status-new' : ''
                    }>
                      {ticket.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {ticket.assignedName || 'Unassigned'}
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    {!ticket.assignedTo ? (
                      <Button size="sm" onClick={() => handleClaim(ticket.id)} className="bg-primary text-white">
                        <UserPlus className="w-4 h-4 mr-2" /> Claim
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => setSelectedTicket(ticket)}>
                        Details
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