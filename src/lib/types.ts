
export type UserRole = 'Admin' | 'Agent' | 'Specialist';
export type Department = 'Cards' | 'App' | 'Operations' | 'Digital' | 'Support';
export type TicketStatus = 'New' | 'Pending' | 'Resolved' | 'Escalated' | 'Rejected';
export type ServiceType = 'Cards' | 'Digital' | 'Support' | string;

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: Department;
}

export interface TicketLog {
  id: string;
  ticketId: string;
  changedByUserId: string;
  changedAt: string;
  oldStatus?: TicketStatus;
  newStatus: TicketStatus;
  response: string;
}

export interface Ticket {
  id: string;
  ticketID: string;
  createdAt: string;
  status: TicketStatus;
  customerName: string;
  cif: string;
  phoneNumber: string;
  serviceType: ServiceType;
  subIssue: string;
  createdByAgentId: string;
  assignedToSpecialistId?: string;
  attachments: string[];
}
