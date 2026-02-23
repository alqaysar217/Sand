
export type UserRole = 'Admin' | 'Agent' | 'Specialist';
export type Department = 'Cards' | 'App' | 'Operations' | 'Digital' | 'Support';
export type TicketStatus = 'New' | 'Pending' | 'Resolved' | 'Escalated' | 'Rejected';
export type ServiceType = 'كول سنتر' | 'إدارة البطائق' | 'مشاكل التطبيق' | string;
export type IntakeMethod = 'واتساب' | 'اتصال' | 'من خلال الفروع' | string;

export interface UserProfile {
  id: string;
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
  serviceType: ServiceType; // الجهه المعنية
  subIssue: string; // نوع المشكلة
  intakeMethod: IntakeMethod; // وسيلة استلام البلاغ
  description: string; // تفاصيل المشكلة
  createdByAgentId: string;
  createdByAgentName: string; // اسم الموظف الذي رفع البلاغ
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

// إعدادات النظام القابلة للإدارة من المدير
export interface SystemConfig {
  serviceTypes: string[];
  intakeMethods: string[];
  issueTypes: string[];
  staffNames: string[];
}
