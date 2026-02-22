import { UserProfile, Ticket } from './types';

export const MOCK_USERS: UserProfile[] = [
  {
    uid: 'agent-1',
    name: 'أحمد العميل',
    email: 'ahmed@bank.com',
    role: 'Agent',
    department: 'Operations',
  },
  {
    uid: 'specialist-cards',
    name: 'سارة الأخصائية',
    email: 'sarah@bank.com',
    role: 'Specialist',
    department: 'Cards',
  },
  {
    uid: 'specialist-app',
    name: 'عمر التقني',
    email: 'omar@bank.com',
    role: 'Specialist',
    department: 'App',
  },
  {
    uid: 'admin-1',
    name: 'خالد المدير',
    email: 'khalid@bank.com',
    role: 'Admin',
    department: 'Operations',
  }
];

export const MOCK_TICKETS: Ticket[] = [
  {
    id: 't-1',
    ticketID: 'TIC-1001',
    createdAt: Date.now() - 3600000 * 25, // 25 hours ago (overdue)
    status: 'Pending',
    customerName: 'محمد علي',
    CIF: '12345678',
    phoneNumber: '+966501234567',
    serviceType: 'Cards',
    subIssue: 'إعادة تعيين الرقم السري',
    createdBy: 'agent-1',
    createdByName: 'أحمد العميل',
    department: 'Cards',
    attachments: [],
    history: [],
  },
  {
    id: 't-2',
    ticketID: 'TIC-1002',
    createdAt: Date.now() - 3600000 * 2,
    status: 'New',
    customerName: 'فاطمة زيد',
    CIF: '87654321',
    phoneNumber: '+966509876543',
    serviceType: 'Digital',
    subIssue: 'مشكلة في تسجيل الدخول',
    createdBy: 'agent-1',
    createdByName: 'أحمد العميل',
    department: 'App',
    attachments: [],
    history: [],
  },
  {
    id: 't-3',
    ticketID: 'TIC-1003',
    createdAt: Date.now() - 3600000 * 48,
    status: 'Resolved',
    customerName: 'عبدالله محمد',
    CIF: '11223344',
    phoneNumber: '+966505555555',
    serviceType: 'Support',
    subIssue: 'تأخير في الحوالة الدولية',
    createdBy: 'agent-1',
    createdByName: 'أحمد العميل',
    department: 'Operations',
    assignedTo: 'specialist-app',
    assignedName: 'عمر التقني',
    attachments: [],
    history: [],
    specialistResponse: 'تمت معالجة الحوالة بعد التحقق الإضافي من البيانات.'
  }
];
