import type { ClientLead } from '../types/meeting';
import { normalizeLead } from '../utils/leads';
import { supabase } from './supabase';

// Reads and writes the `leads` table (see supabase/leads.sql)

interface LeadRow {
  id: string;
  name: string;
  data: Partial<ClientLead>;
}

const toRow = (lead: ClientLead) => ({
  id: lead.id,
  name: lead.name,
  phone: lead.phone || null,
  email: lead.email || null,
  stage: lead.stage || null,
  procedure_name: lead.procedureName || null,
  // NaN (no estimate yet) is not valid JSON, so it is stored as null
  data: JSON.parse(JSON.stringify(lead)),
});

const fromRow = (row: LeadRow): ClientLead =>
  normalizeLead({
    ...row.data,
    id: row.id,
    name: row.name,
    recordingIds: row.data.recordingIds || [],
    conversionIssues: row.data.conversionIssues || [],
    conversionChance: typeof row.data.conversionChance === 'number' ? row.data.conversionChance : NaN,
  } as ClientLead);

const db = () => {
  if (!supabase) throw new Error('Supabase is not configured.');
  return supabase;
};

export async function fetchLeads(): Promise<ClientLead[]> {
  const { data, error } = await db().from('leads').select('id, name, data').order('created_at', { ascending: false });
  if (error) throw error;
  return (data as LeadRow[]).map(fromRow);
}

export async function saveLeads(leads: ClientLead[]): Promise<void> {
  if (leads.length === 0) return;
  const { error } = await db().from('leads').upsert(leads.map(toRow));
  if (error) throw error;
}

export async function deleteLeads(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const { error } = await db().from('leads').delete().in('id', ids);
  if (error) throw error;
}
