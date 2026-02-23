import { UserProfile, Ticket } from './types';

export const MOCK_USERS: UserProfile[] = [
  {
    id: 'dev-admin',
    name: 'المدير العام',
    email: 'admin.bank@bank.com',
    role: 'Admin',
    department: 'Operations',
  }
];

// تفريغ كافة البلاغات التجريبية لضمان بداية اختبار نظيفة
export const MOCK_TICKETS: Ticket[] = [];
