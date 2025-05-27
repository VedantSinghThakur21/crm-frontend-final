import { Lead, LeadStatus } from '../types/lead';
import { supabase } from '../lib/supabaseClient';

// Get all leads
export const getLeads = async (): Promise<Lead[]> => {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching leads:', error);
    throw error;
  }

  return data.map(lead => ({
    id: lead.id,
    customerName: lead.customer_name,
    serviceNeeded: lead.service_needed,
    siteLocation: lead.site_location,
    status: lead.status as LeadStatus,
    assignedTo: lead.assigned_to,
    priority: lead.priority || 'medium',
    source: lead.source,
    notes: lead.notes,
    createdAt: lead.created_at,
    updatedAt: lead.updated_at,
  }));
};

// Get lead by ID
export const getLeadById = async (id: string): Promise<Lead | null> => {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching lead:', error);
    throw error;
  }

  if (!data) return null;

  return {
    id: data.id,
    customerName: data.customer_name,
    serviceNeeded: data.service_needed,
    siteLocation: data.site_location,
    status: data.status as LeadStatus,
    assignedTo: data.assigned_to,
    priority: data.priority || 'medium',
    source: data.source,
    notes: data.notes,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
};

// Create lead
export const createLead = async (lead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>): Promise<Lead> => {
  const { data, error } = await supabase
    .from('leads')
    .insert([{
      customer_name: lead.customerName,
      service_needed: lead.serviceNeeded,
      site_location: lead.siteLocation,
      status: lead.status,
      assigned_to: lead.assignedTo,
      priority: lead.priority || 'medium',
      source: lead.source,
      notes: lead.notes,
    }])
    .select()
    .single();

  if (error) {
    console.error('Error creating lead:', error);
    throw error;
  }

  return {
    id: data.id,
    customerName: data.customer_name,
    serviceNeeded: data.service_needed,
    siteLocation: data.site_location,
    status: data.status as LeadStatus,
    assignedTo: data.assigned_to,
    priority: data.priority || 'medium',
    source: data.source,
    notes: data.notes,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
};

// Update lead
export const updateLead = async (id: string, updates: Partial<Lead>): Promise<Lead | null> => {
  const { data, error } = await supabase
    .from('leads')
    .update({
      customer_name: updates.customerName,
      service_needed: updates.serviceNeeded,
      site_location: updates.siteLocation,
      status: updates.status,
      assigned_to: updates.assignedTo,
      priority: updates.priority,
      source: updates.source,
      notes: updates.notes,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating lead:', error);
    throw error;
  }

  return {
    id: data.id,
    customerName: data.customer_name,
    serviceNeeded: data.service_needed,
    siteLocation: data.site_location,
    status: data.status as LeadStatus,
    assignedTo: data.assigned_to,
    priority: data.priority || 'medium',
    source: data.source,
    notes: data.notes,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
};

// Update lead status
export const updateLeadStatus = async (id: string, status: LeadStatus): Promise<Lead | null> => {
  return updateLead(id, { status });
};

// Get leads by status
export const getLeadsByStatus = async (status: LeadStatus): Promise<Lead[]> => {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('status', status)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching leads by status:', error);
    throw error;
  }

  return data.map(lead => ({
    id: lead.id,
    customerName: lead.customer_name,
    serviceNeeded: lead.service_needed,
    siteLocation: lead.site_location,
    status: lead.status as LeadStatus,
    assignedTo: lead.assigned_to,
    priority: lead.priority || 'medium',
    source: lead.source,
    notes: lead.notes,
    createdAt: lead.created_at,
    updatedAt: lead.updated_at,
  }));
};

// Delete lead
export const deleteLead = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('leads')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting lead:', error);
    throw error;
  }
};