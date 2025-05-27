export type LeadStatus = 'new' | 'negotiation' | 'won' | 'lost';
export type LeadPriority = 'low' | 'medium' | 'high';

export interface Lead {
  id: string;
  customerName: string;
  serviceNeeded: string;
  siteLocation: string;
  status: LeadStatus;
  assignedTo: string;
  priority?: LeadPriority;
  source?: string;
  createdAt: string;
  updatedAt: string;
  files?: string[];
  notes?: string;
}