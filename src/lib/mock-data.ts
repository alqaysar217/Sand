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

export const MOCK_TICKETS: Ticket[] = [];
