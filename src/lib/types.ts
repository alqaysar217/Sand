
export type UserRole = 'Admin' | 'Agent' | 'Specialist';
export type Department = 'Cards' | 'App' | 'Operations' | 'Digital' | 'Support';
export type TicketStatus = 'New' | 'Pending' | 'Resolved' | 'Escalated' | 'Rejected';
export type ServiceType = 'إدارة البطائق' | 'مشاكل التطبيق' | 'خدمة العملاء' | string;
export type IntakeMethod = 'واتساب' | 'اتصال' | 'من خلال الفروع' | string;

export interface UserProfile {
  id: string;
  username: string; // BIM ID
  name: string;
  email: string;
  role: UserRole;
  department: Department;
}

export interface Attachment {
  url: string;
  description: string;
}

export interface TicketLog {
  action: string;
  timestamp: string;
  userName: string;
  note?: string;
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
  intakeMethod: IntakeMethod;
  description: string;
  createdByAgentId: string;
  createdByAgentName: string;
  assignedToSpecialistId?: string;
  assignedToSpecialistName?: string;
  specialistResponse?: string;
  rejectionReason?: string;
  resolvedAt?: string;
  rejectedAt?: string;
  escalatedBy?: string;
  escalationNote?: string;
  acknowledged?: boolean;
  attachments: Attachment[];
  logs?: TicketLog[];
}

export interface SystemConfig {
  specialistNames: string[];
  csNames: string[];
  agentNames: string[];
  appSpecialistNames: string[];
  intakeMethods: string[];
  issueTypes: string[];
}
