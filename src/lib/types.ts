export type UserRole = 'Admin' | 'Agent' | 'Specialist';
export type Department = 'Cards' | 'App' | 'Operations';
export type TicketStatus = 'New' | 'Pending' | 'Resolved' | 'Escalated' | 'Rejected';
export type ServiceType = 'Cards' | 'Digital' | 'Support';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  department: Department;
}

export interface TicketLog {
  timestamp: number;
  updatedBy: string;
  previousStatus: TicketStatus;
  newStatus: TicketStatus;
  comment?: string;
}

export interface Ticket {
  id: string;
  ticketID: string;
  createdAt: number;
  status: TicketStatus;
  customerName: string;
  CIF: string;
  phoneNumber: string;
  serviceType: ServiceType;
  subIssue: string;
  createdBy: string;
  createdByName: string;
  assignedTo?: string;
  assignedName?: string;
  attachments: string[];
  department: Department;
  history: TicketLog[];
  specialistResponse?: string;
}