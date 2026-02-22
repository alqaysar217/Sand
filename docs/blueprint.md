# **App Name**: ConnectResolve

## Core Features:

- Role-Based Access Control: Secure user authentication with distinct roles (Admin, Agent, Specialist) and granular permissions managed via Firebase Security Rules.
- Complaint Submission Portal: Agents can easily create new complaint tickets, entering customer details (CIF, Name, Phone), classifying service type and sub-issue, and uploading relevant attachments.
- Agent Dashboard & Tracking: Agents have a personalized view to track the status of their submitted complaints (pending, resolved, archived) and initiate new submissions.
- Specialist Workstation & Workflow: Specialists view complaints automatically routed to their department, claim tickets to take ownership, update ticket status, and provide technical responses.
- Smart Response Assistant: A generative AI tool that assists Specialists by suggesting appropriate, professionally worded technical responses based on the complaint's details and resolution history.
- Admin Control & Analytics Dashboard: Administrators gain a comprehensive overview of all system activity, manage user roles and departments, view key statistics (total tickets, average resolution time, issue distribution), and monitor overdue complaints.
- Audit Logging & Reporting: Automated logging of all status changes (who, when, what response), with functionality to export complaint data into an Excel report, sortable by date or department.

## Style Guidelines:

- The visual identity is anchored in professionalism and trust. The primary brand color is a deep navy blue, `#002D62`, representing reliability. It is informed by banking aesthetics and user preference.
- A clean and light background color, `#F6F9FA`, is chosen for enhanced readability and data clarity across dashboards. This very subtle cool white ensures focus on content.
- A vibrant gold-orange accent color, `#ECAC17`, is used for call-to-action buttons, key highlights, and interactive elements. It provides excellent contrast and dynamism against the blues.
- For status indicators, specific colors are applied: '#F9DD1D' (a bright yellow) for 'Pending' or 'In Progress' states, and '#2ECC71' (a fresh green) for 'Resolved' tickets.
- The font 'Inter' (sans-serif) is recommended for both headlines and body text. Its neutral, modern, and highly readable characteristics are ideal for data-heavy interfaces and a professional banking context.
- Utilize a consistent set of professional, minimalist line-art icons that enhance navigation and clearly communicate actions and statuses across all dashboards.
- Implement a clear and structured layout with responsive dashboards, organized forms, and easily digestible tables. Emphasize hierarchy for efficient data scanning, with a persistent sidebar for primary navigation.
- Incorporate subtle and smooth transitions for state changes (e.g., ticket status updates, claiming a ticket) and hover effects for interactive elements, contributing to a fluid user experience without distractions.