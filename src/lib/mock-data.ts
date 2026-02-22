import { UserProfile, Ticket } from './types';

export const MOCK_USERS: UserProfile[] = [
  {
    uid: 'agent-1',
    name: 'Ahmed Agent',
    email: 'ahmed@bank.com',
    role: 'Agent',
    department: 'Operations',
  },
  {
    uid: 'specialist-cards',
    name: 'Sarah Specialist',
    email: 'sarah@bank.com',
    role: 'Specialist',
    department: 'Cards',
  },
  {
    uid: 'specialist-app',
    name: 'Omar Tech',
    email: 'omar@bank.com',
    role: 'Specialist',
    department: 'App',
  },
  {
    uid: 'admin-1',
    name: 'Khalid Admin',
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
    customerName: 'Mohamed Ali',
    CIF: '12345678',
    phoneNumber: '+966501234567',
    serviceType: 'Cards',
    subIssue: 'PIN Reset',
    createdBy: 'agent-1',
    createdByName: 'Ahmed Agent',
    department: 'Cards',
    attachments: [],
    history: [],
  },
  {
    id: 't-2',
    ticketID: 'TIC-1002',
    createdAt: Date.now() - 3600000 * 2,
    status: 'New',
    customerName: 'Fatima Zaid',
    CIF: '87654321',
    phoneNumber: '+966509876543',
    serviceType: 'Digital',
    subIssue: 'Login Issue',
    createdBy: 'agent-1',
    createdByName: 'Ahmed Agent',
    department: 'App',
    attachments: [],
    history: [],
  },
  {
    id: 't-3',
    ticketID: 'TIC-1003',
    createdAt: Date.now() - 3600000 * 48,
    status: 'Resolved',
    customerName: 'John Doe',
    CIF: '11223344',
    phoneNumber: '+966505555555',
    serviceType: 'Support',
    subIssue: 'Delay in transfer',
    createdBy: 'agent-1',
    createdByName: 'Ahmed Agent',
    department: 'Operations',
    assignedTo: 'specialist-app',
    assignedName: 'Omar Tech',
    attachments: [],
    history: [],
    specialistResponse: 'Transfer processed after secondary verification.'
  }
];