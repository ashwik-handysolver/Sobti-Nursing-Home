import React, { useRef, useState } from 'react';
import { UploadCloud, Users } from 'lucide-react';
import { ClientLead, LeadFlag, LeadSource, LeadStage, LostReason, PipelineStage } from '../../types/meeting';
import { LOST_REASONS } from '../../utils/lostReasons';
import { LEAD_FLAGS, LEAD_STAGES, PIPELINE_STAGES, isPipelineStage } from '../../utils/leads';
import { CLINIC_DOCTORS, CLINIC_PROCEDURES, DEFAULT_DOCTOR, DEFAULT_PROCEDURE, LEAD_SOURCES } from '../../data/clinic';
import { Button, Dropdown, DropdownOption, Field, Modal, TextArea, TextInput } from '../ui';

type Gender = 'Male' | 'Female' | 'Other';
type UrgencyLevel = 'High' | 'Medium' | 'Low';

const SOURCE_OPTIONS: DropdownOption<LeadSource | ''>[] = [
  { value: '', label: 'Not recorded' },
  ...LEAD_SOURCES.map((source) => ({ value: source, label: source })),
];

const FLAG_OPTIONS: DropdownOption<LeadFlag | ''>[] = [
  { value: '', label: 'None' },
  ...LEAD_FLAGS.map((flag) => ({ value: flag, label: flag })),
];

const GENDER_OPTIONS: DropdownOption<Gender>[] = [
  { value: 'Male', label: 'M' },
  { value: 'Female', label: 'F' },
  { value: 'Other', label: 'O' },
];

const URGENCY_OPTIONS: DropdownOption<UrgencyLevel>[] = [
  { value: 'High', label: 'High Urgency' },
  { value: 'Medium', label: 'Medium Urgency' },
  { value: 'Low', label: 'Low Urgency' },
];

interface PatientFormData {
  name: string;
  phone: string;
  email: string;
  age: string;
  gender: Gender;
  condition: string;
  procedureName: string;
  procedureValue: string;
  stage: LeadStage;
  flag: LeadFlag | '';
  lostAtStage: PipelineStage;
  lostReason: LostReason;
  leadSource: LeadSource | '';
  assignedDoctor: string;
  urgencyLevel: UrgencyLevel;
  notes: string;
}

const EMPTY_FORM: PatientFormData = {
  name: '',
  phone: '',
  email: '',
  age: '',
  gender: 'Male',
  condition: '',
  procedureName: DEFAULT_PROCEDURE,
  procedureValue: '₹65,000',
  stage: 'New Lead',
  flag: '',
  lostAtStage: 'New Lead',
  lostReason: 'Unknown',
  leadSource: '',
  assignedDoctor: DEFAULT_DOCTOR,
  urgencyLevel: 'Medium',
  notes: '',
};

const toFormData = (client: ClientLead): PatientFormData => ({
  name: client.name,
  phone: client.phone,
  email: client.email || '',
  age: client.age ? String(client.age) : '',
  gender: client.gender || 'Male',
  condition: client.condition,
  procedureName: client.procedureName,
  procedureValue: client.procedureValue,
  stage: client.stage,
  flag: client.flag || '',
  lostAtStage: client.lostAtStage || (isPipelineStage(client.stage) ? client.stage : 'Consultation Completed'),
  lostReason: client.lostReason || 'Unknown',
  leadSource: client.leadSource || '',
  assignedDoctor: client.assignedDoctor,
  urgencyLevel: client.urgencyLevel,
  notes: client.notes || '',
});

interface PatientFormModalProps {
  client: ClientLead | null; // null registers a new patient
  suggestedLostReason?: LostReason; // from the patient's recordings; offered when the lead is marked Lost
  onSave: (client: ClientLead, options: { uploadRecording: boolean }) => void;
  onClose: () => void;
}

export const PatientFormModal: React.FC<PatientFormModalProps> = ({ client, suggestedLostReason, onSave, onClose }) => {
  const [formData, setFormData] = useState<PatientFormData>(() => (client ? toFormData(client) : EMPTY_FORM));
  // Which of the two "save" buttons submitted the new-patient form
  const uploadAfterSaveRef = useRef(false);

  const set = (patch: Partial<PatientFormData>) => setFormData((prev) => ({ ...prev, ...patch }));

  // Marking a lead Lost remembers the stage it was at, so drop-off can be reported
  const setStage = (stage: LeadStage) =>
    setFormData((prev) => ({
      ...prev,
      stage,
      lostAtStage: stage === 'Lost' && isPipelineStage(prev.stage) ? prev.stage : prev.lostAtStage,
      lostReason: stage === 'Lost' && prev.stage !== 'Lost' && suggestedLostReason ? suggestedLostReason : prev.lostReason,
    }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const today = new Date().toISOString().split('T')[0];
    const fields = {
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim(),
      age: formData.age ? parseInt(formData.age, 10) : undefined,
      gender: formData.gender,
      condition: formData.condition.trim() || 'General Eye Examination',
      procedureName: formData.procedureName,
      procedureValue: formData.procedureValue,
      numericValue: parseInt(formData.procedureValue.replace(/[^0-9]/g, ''), 10) || 50000,
      stage: formData.stage,
      // A flag only applies while the lead is still open; the lost-at stage only once it is lost
      flag: isPipelineStage(formData.stage) ? formData.flag || undefined : undefined,
      lostAtStage: formData.stage === 'Lost' ? formData.lostAtStage : undefined,
      lostReason: formData.stage === 'Lost' ? formData.lostReason : undefined,
      lostDate: formData.stage === 'Lost' ? (client?.stage === 'Lost' && client.lostDate) || today : undefined,
      leadSource: formData.leadSource || undefined,
      assignedDoctor: formData.assignedDoctor,
      urgencyLevel: formData.urgencyLevel,
      notes: formData.notes,
    };

    if (client) {
      onSave({ ...client, ...fields }, { uploadRecording: false });
    } else {
      onSave(
        {
          id: `client-${Date.now()}`,
          ...fields,
          // No estimate until a recording has been analyzed
          conversionChance: NaN,
          conversionIssues: [],
          conversionNextStep: '',
          recordingIds: [],
          createdDate: today,
          lastVisitDate: today,
        },
        { uploadRecording: uploadAfterSaveRef.current }
      );
    }
  };

  return (
    <Modal
      title={client ? 'Edit Patient Details' : 'Register New Patient'}
      icon={Users}
      onClose={onClose}
      closeOnBackdrop={false}
    >
      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Full Name *">
            <TextInput
              size="sm"
              required
              value={formData.name}
              onChange={(e) => set({ name: e.target.value })}
              placeholder="e.g. Ramesh Chandra"
            />
          </Field>
          <Field label="Phone Number *">
            <TextInput
              size="sm"
              required
              value={formData.phone}
              onChange={(e) => set({ phone: e.target.value })}
              placeholder="+91 98201 44521"
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Field label="Email Address" className="sm:col-span-2">
            <TextInput
              size="sm"
              type="email"
              value={formData.email}
              onChange={(e) => set({ email: e.target.value })}
              placeholder="patient@gmail.com"
            />
          </Field>
          <Field label="Age & Gender">
            <div className="flex gap-1.5">
              <TextInput
                size="sm"
                type="number"
                value={formData.age}
                onChange={(e) => set({ age: e.target.value })}
                placeholder="Age"
                aria-label="Age"
                className="w-16! px-2"
              />
              <Dropdown
                size="sm"
                value={formData.gender}
                onChange={(gender) => set({ gender })}
                options={GENDER_OPTIONS}
                aria-label="Gender"
                className="flex-1 px-2"
              />
            </div>
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Recommended Procedure">
            <Dropdown
              size="sm"
              value={formData.procedureName}
              onChange={(procedureName) => set({ procedureName })}
              options={CLINIC_PROCEDURES}
            />
          </Field>
          <Field label="Estimated Value">
            <TextInput
              size="sm"
              value={formData.procedureValue}
              onChange={(e) => set({ procedureValue: e.target.value })}
              placeholder="₹65,000"
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Lead Stage">
            <Dropdown size="sm" value={formData.stage} onChange={setStage} options={LEAD_STAGES} />
          </Field>
          {formData.stage === 'Lost' ? (
            <Field label="Lost at Stage">
              <Dropdown
                size="sm"
                value={formData.lostAtStage}
                onChange={(lostAtStage) => set({ lostAtStage })}
                options={PIPELINE_STAGES}
              />
            </Field>
          ) : (
            isPipelineStage(formData.stage) && (
              <Field label="Marked As">
                <Dropdown size="sm" value={formData.flag} onChange={(flag) => set({ flag })} options={FLAG_OPTIONS} />
              </Field>
            )
          )}
        </div>

        {formData.stage === 'Lost' && (
          <Field
            label={
              suggestedLostReason === formData.lostReason
                ? 'Reason Lost (suggested from the conversation, please confirm)'
                : 'Reason Lost'
            }
          >
            <Dropdown
              size="sm"
              value={formData.lostReason}
              onChange={(lostReason) => set({ lostReason })}
              options={LOST_REASONS}
            />
          </Field>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Field label="Assigned Doctor">
            <Dropdown
              size="sm"
              value={formData.assignedDoctor}
              onChange={(assignedDoctor) => set({ assignedDoctor })}
              options={CLINIC_DOCTORS}
            />
          </Field>
          <Field label="Urgency Level">
            <Dropdown
              size="sm"
              value={formData.urgencyLevel}
              onChange={(urgencyLevel) => set({ urgencyLevel })}
              options={URGENCY_OPTIONS}
            />
          </Field>
          <Field label="Lead Source">
            <Dropdown
              size="sm"
              value={formData.leadSource}
              onChange={(leadSource) => set({ leadSource })}
              options={SOURCE_OPTIONS}
            />
          </Field>
        </div>

        <Field label="Clinical Notes">
          <TextArea
            size="sm"
            rows={2}
            value={formData.notes}
            onChange={(e) => set({ notes: e.target.value })}
            placeholder="Chief visual complaint, test results..."
          />
        </Field>

        <div className="flex flex-wrap justify-end gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
          <Button variant="outline" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          {client ? (
            <Button size="sm" type="submit">
              Save Changes
            </Button>
          ) : (
            <>
              <Button variant="outline" size="sm" type="submit" onClick={() => (uploadAfterSaveRef.current = false)}>
                Save without recording
              </Button>
              <Button size="sm" type="submit" onClick={() => (uploadAfterSaveRef.current = true)}>
                <UploadCloud className="w-3.5 h-3.5" />
                Save & upload recording
              </Button>
            </>
          )}
        </div>
      </form>
    </Modal>
  );
};
