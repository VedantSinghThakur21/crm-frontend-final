import { Job, JobStatus, Equipment, Operator } from '../types/job';
import { supabase } from '../lib/supabaseClient';

// Get all jobs
export const getJobs = async (): Promise<Job[]> => {
  const { data, error } = await supabase
    .from('jobs')
    .select(`
      *,
      equipment:equipment_id (*),
      operator:operator_id (*)
    `)
    .order('start_date', { ascending: true });

  if (error) {
    console.error('Error fetching jobs:', error);
    throw error;
  }

  return data.map(job => ({
    id: job.id,
    leadId: job.lead_id,
    customerName: job.customer_name,
    equipmentId: job.equipment_id,
    operatorId: job.operator_id,
    startDate: job.start_date,
    endDate: job.end_date,
    location: job.location,
    status: job.status,
    notes: job.notes,
    createdAt: job.created_at,
    updatedAt: job.updated_at,
  }));
};

// Get job by ID
export const getJobById = async (id: string): Promise<Job | null> => {
  const { data, error } = await supabase
    .from('jobs')
    .select(`
      *,
      equipment:equipment_id (*),
      operator:operator_id (*)
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching job:', error);
    throw error;
  }

  if (!data) return null;

  return {
    id: data.id,
    leadId: data.lead_id,
    customerName: data.customer_name,
    equipmentId: data.equipment_id,
    operatorId: data.operator_id,
    startDate: data.start_date,
    endDate: data.end_date,
    location: data.location,
    status: data.status,
    notes: data.notes,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
};

// Get jobs for an operator
export const getJobsByOperator = async (operatorId: string): Promise<Job[]> => {
  const { data, error } = await supabase
    .from('jobs')
    .select(`
      *,
      equipment:equipment_id (*),
      operator:operator_id (*)
    `)
    .eq('operator_id', operatorId)
    .order('start_date', { ascending: true });

  if (error) {
    console.error('Error fetching operator jobs:', error);
    throw error;
  }

  return data.map(job => ({
    id: job.id,
    leadId: job.lead_id,
    customerName: job.customer_name,
    equipmentId: job.equipment_id,
    operatorId: job.operator_id,
    startDate: job.start_date,
    endDate: job.end_date,
    location: job.location,
    status: job.status,
    notes: job.notes,
    createdAt: job.created_at,
    updatedAt: job.updated_at,
  }));
};

// Create job
export const createJob = async (jobData: Omit<Job, 'id' | 'createdAt' | 'updatedAt'>): Promise<Job> => {
  const { data, error } = await supabase
    .from('jobs')
    .insert([{
      lead_id: jobData.leadId,
      customer_name: jobData.customerName,
      equipment_id: jobData.equipmentId,
      operator_id: jobData.operatorId,
      start_date: jobData.startDate,
      end_date: jobData.endDate,
      location: jobData.location,
      status: jobData.status,
      notes: jobData.notes,
    }])
    .select()
    .single();

  if (error) {
    console.error('Error creating job:', error);
    throw error;
  }

  return {
    id: data.id,
    leadId: data.lead_id,
    customerName: data.customer_name,
    equipmentId: data.equipment_id,
    operatorId: data.operator_id,
    startDate: data.start_date,
    endDate: data.end_date,
    location: data.location,
    status: data.status,
    notes: data.notes,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
};

// Update job
export const updateJob = async (id: string, updates: Partial<Job>): Promise<Job | null> => {
  const { data, error } = await supabase
    .from('jobs')
    .update({
      lead_id: updates.leadId,
      customer_name: updates.customerName,
      equipment_id: updates.equipmentId,
      operator_id: updates.operatorId,
      start_date: updates.startDate,
      end_date: updates.endDate,
      location: updates.location,
      status: updates.status,
      notes: updates.notes,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating job:', error);
    throw error;
  }

  return {
    id: data.id,
    leadId: data.lead_id,
    customerName: data.customer_name,
    equipmentId: data.equipment_id,
    operatorId: data.operator_id,
    startDate: data.start_date,
    endDate: data.end_date,
    location: data.location,
    status: data.status,
    notes: data.notes,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
};

// Update job status
export const updateJobStatus = async (id: string, status: JobStatus): Promise<Job | null> => {
  return updateJob(id, { status });
};

// Get equipment by ID
export const getEquipmentById = async (id: string): Promise<Equipment | null> => {
  const { data, error } = await supabase
    .from('equipment')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching equipment:', error);
    throw error;
  }

  if (!data) return null;

  return {
    id: data.id,
    name: data.name,
    type: data.type,
    description: data.description,
    baseRate: data.base_rate,
  };
};

// Get operator by ID
export const getOperatorById = async (id: string): Promise<Operator | null> => {
  const { data, error } = await supabase
    .from('operators')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching operator:', error);
    throw error;
  }

  if (!data) return null;

  return {
    id: data.id,
    name: data.name,
    email: data.email,
    phone: data.phone,
    specialization: data.specialization,
  };
};

// Get all equipment
export const getAllEquipment = async (): Promise<Equipment[]> => {
  const { data, error } = await supabase
    .from('equipment')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching equipment:', error);
    throw error;
  }

  return data.map(item => ({
    id: item.id,
    name: item.name,
    type: item.type,
    description: item.description,
    baseRate: item.base_rate,
  }));
};

// Get all operators
export const getAllOperators = async (): Promise<Operator[]> => {
  const { data, error } = await supabase
    .from('operators')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching operators:', error);
    throw error;
  }

  return data.map(operator => ({
    id: operator.id,
    name: operator.name,
    email: operator.email,
    phone: operator.phone,
    specialization: operator.specialization,
  }));
};

// Delete job
export const deleteJob = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('jobs')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting job:', error);
    throw error;
  }
};