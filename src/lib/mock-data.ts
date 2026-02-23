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

// تم تفريغ كافة البلاغات لضمان بداية اختبار نظيفة تماماً
export const MOCK_TICKETS: Ticket[] = [];
