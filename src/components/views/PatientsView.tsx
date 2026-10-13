import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Users } from 'lucide-react';
import { ClientLead, MeetingRecording } from '../../types/meeting';
import { Button, Card, Dropdown, EmptyState, muted, PageHeader, SearchInput } from '../ui';
import { LEAD_FLAGS, LEAD_STAGES } from '../../utils/leads';
import { suggestLostReason } from '../../utils/lostReasons';
import { PatientFormModal } from '../patients/PatientFormModal';
import { PatientProfile } from '../patients/PatientProfile';
import { PatientsTable, SortDirection, SortField } from '../patients/PatientsTable';

interface PatientsViewProps {
  clients: ClientLead[];
  recordings: MeetingRecording[];
  initialClientId?: string | null;
  openNewPatient?: boolean; // open the "new patient" form straight away
  onNewPatientOpened?: () => void;
  onClearInitialClientId?: () => void;
  onSelectRecording: (recordingId: string) => void;
  onUploadForClient: (client: ClientLead) => void;
  onAddClient: (newClient: ClientLead) => void;
  onUpdateClient: (updatedClient: ClientLead) => void;
  onDeleteClient: (clientId: string) => void;
  onToggleTaskStatus?: (taskId: string) => void;
}

const PAGE_SIZE = 10;

// The patient form is closed, registering a new patient, or editing an existing one
type FormState = { mode: 'closed' } | { mode: 'new' } | { mode: 'edit'; client: ClientLead };

export const PatientsView: React.FC<PatientsViewProps> = ({
  clients,
  recordings,
  initialClientId,
  openNewPatient,
  onNewPatientOpened,
  onClearInitialClientId,
  onSelectRecording,
  onUploadForClient,
  onAddClient,
  onUpdateClient,
  onDeleteClient,
  onToggleTaskStatus,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('lastVisitDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedClientId, setSelectedClientId] = useState<string | null>(initialClientId || null);
  const [form, setForm] = useState<FormState>({ mode: 'closed' });

  // Sync initialClientId from external navigation (e.g. from Dashboard or Recordings)
  useEffect(() => {
    if (initialClientId) {
      setSelectedClientId(initialClientId);
    }
  }, [initialClientId]);

  useEffect(() => {
    if (openNewPatient) {
      setSelectedClientId(null);
      setForm({ mode: 'new' });
      if (onNewPatientOpened) onNewPatientOpened();
    }
  }, [openNewPatient]);

  const selectedClient = useMemo(() => {
    return clients.find((c) => c.id === selectedClientId) || null;
  }, [clients, selectedClientId]);

  useEffect(() => {
    document.title = `${selectedClient ? selectedClient.name : 'Leads'} – MeetMind`;
  }, [selectedClient]);

  const filteredClients = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return clients.filter((client) => {
      const matchesSearch =
        !q ||
        client.name.toLowerCase().includes(q) ||
        client.condition.toLowerCase().includes(q) ||
        client.procedureName.toLowerCase().includes(q) ||
        client.assignedDoctor.toLowerCase().includes(q) ||
        client.phone.toLowerCase().includes(q) ||
        (client.email && client.email.toLowerCase().includes(q));

      // The filter offers stages and flags in one list
      return matchesSearch && (stageFilter === 'all' || client.stage === stageFilter || client.flag === stageFilter);
    });
  }, [clients, searchQuery, stageFilter]);

  const sortedClients = useMemo(() => {
    return [...filteredClients].sort((a, b) => {
      let comparison = 0;
      if (sortField === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortField === 'conversionChance') {
        comparison = (a.conversionChance || 0) - (b.conversionChance || 0);
      } else if (sortField === 'lastVisitDate') {
        comparison = (a.lastVisitDate || a.createdDate).localeCompare(b.lastVisitDate || b.createdDate);
      } else if (sortField === 'numericValue') {
        comparison = (a.numericValue || 0) - (b.numericValue || 0);
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredClients, sortField, sortDirection]);

  const totalPages = Math.ceil(sortedClients.length / PAGE_SIZE) || 1;
  const paginatedClients = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return sortedClients.slice(start, start + PAGE_SIZE);
  }, [sortedClients, currentPage]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleSavePatient = (client: ClientLead, { uploadRecording }: { uploadRecording: boolean }) => {
    if (form.mode === 'edit') {
      onUpdateClient(client);
    } else {
      onAddClient(client);
      setSelectedClientId(client.id);
      if (uploadRecording) onUploadForClient(client);
    }
    setForm({ mode: 'closed' });
  };

  const handleBackToList = () => {
    setSelectedClientId(null);
    if (onClearInitialClientId) {
      onClearInitialClientId();
    }
  };

  return (
    <div className="pb-12">
      {selectedClient ? (
        <PatientProfile
          client={selectedClient}
          recordings={recordings}
          onBack={handleBackToList}
          onEdit={() => setForm({ mode: 'edit', client: selectedClient })}
          onDelete={() => {
            onDeleteClient(selectedClient.id);
            handleBackToList();
          }}
          onUpdate={onUpdateClient}
          onSelectRecording={onSelectRecording}
          onUploadRecording={() => onUploadForClient(selectedClient)}
          onToggleTaskStatus={onToggleTaskStatus}
        />
      ) : (
        <div className="space-y-5">
          <PageHeader title="Leads">
            <Button onClick={() => setForm({ mode: 'new' })}>
              <Plus className="w-4 h-4" />
              <span>New patient</span>
            </Button>
          </PageHeader>

          {clients.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Add your first patient"
              hint="Link recordings to a patient to see their conversations and follow-ups in one place."
            />
          ) : (
            <>
              <div className="flex flex-col sm:flex-row gap-3">
                <SearchInput
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search leads"
                  aria-label="Search leads"
                />
                <Dropdown
                  value={stageFilter}
                  onChange={(stage) => {
                    setStageFilter(stage);
                    setCurrentPage(1);
                  }}
                  options={[{ value: 'all', label: 'All stages' }, ...LEAD_STAGES, ...LEAD_FLAGS]}
                  aria-label="Filter by stage"
                  className="sm:w-56"
                />
              </div>

              <Card className="overflow-hidden">
                {paginatedClients.length === 0 ? (
                  <p className={`${muted} py-10 text-center`}>No patients match your filters.</p>
                ) : (
                  <PatientsTable
                    clients={paginatedClients}
                    sortField={sortField}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    onOpen={(client) => setSelectedClientId(client.id)}
                    onEdit={(client) => setForm({ mode: 'edit', client })}
                    onDelete={(client) => onDeleteClient(client.id)}
                  />
                )}
              </Card>
            </>
          )}
        </div>
      )}

      {form.mode !== 'closed' && (
        <PatientFormModal
          client={form.mode === 'edit' ? form.client : null}
          suggestedLostReason={
            form.mode === 'edit'
              ? suggestLostReason(
                  form.client,
                  recordings.filter((r) => r.clientId === form.client.id || form.client.recordingIds.includes(r.id))
                )?.reason
              : undefined
          }
          onSave={handleSavePatient}
          onClose={() => setForm({ mode: 'closed' })}
        />
      )}
    </div>
  );
};
