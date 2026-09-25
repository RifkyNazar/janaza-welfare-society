export type EmailMessage = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export type EmployeeRegistrationNotification = {
  employeeId: number;
  fullName: string;
  email: string;
  employeeCode?: string | null;
  registeredAt: Date;
};

export type ServiceRequestNotification = {
  requestId: number;
  requestCode: string;
  category: string;
  services: string[];
  area: string;
  submittedAt: Date;
};

export type TaskAssignmentNotification = {
  requestCode: string;
  category: string;
  services: string[];
  area: string;
};
