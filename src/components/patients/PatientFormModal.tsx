import React, { useRef, useState } from 'react';
import { AlertTriangle, Users } from 'lucide-react';
import { ClientLead, LeadFlag, LeadSource, LeadStage, LostReason, PipelineStage } from '../../types/meeting';
import { LOST_REASONS } from '../../utils/lostReasons';
import { LEAD_FLAGS, LEAD_STAGES, PIPELINE_STAGES, isPipelineStage } from '../../utils/leads';
import { CLINIC_DOCTORS, CLINIC_PROCEDURES, DEFAULT_DOCTOR, DEFAULT_PROCEDURE, LEAD_SOURCES } from '../../data/clinic';
import { Button, Dropdown, DropdownOption, Field, Modal, TextArea, TextInput } from '../ui';
import {
  formatAmount,
  formatPhone,
  parseAmount,
  phoneKey,
  validateAge,
  validateAmount,
  validateEmail,
  validateName,
  validatePhone,
} from '../../utils/validation';

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
  procedureValue: '',
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
  existingClients?: ClientLead[]; // checked for a patient with the same phone number
  onOpenExisting?: (clientId: string) => void;
}

export const PatientFormModal: React.FC<PatientFormModalProps> = ({
  client,
  suggestedLostReason,
  onSave,
  onClose,
  existingClients = [],
  onOpenExisting,
}) => {
  // Another patient already saved with this phone number; saving again needs a second click
  const [duplicate, setDuplicate] = useState<ClientLead | null>(null);
  const duplicateConfirmedRef = useRef(false);
  const [formData, setFormData] = useState<PatientFormData>(() => (client ? toFormData(client) : EMPTY_FORM));
  // Which of the two "save" buttons submitted the new-patient form
  const uploadAfterSaveRef = useRef(false);

  const [errors, setErrors] = useState<Record<string, string | null>>({});

  // Editing a field clears its message; the full check runs again on save
  const set = (patch: Partial<PatientFormData>) => {
    if ('phone' in patch) setDuplicate(null);
    setFormData((prev) => ({ ...prev, ...patch }));
    setErrors((prev) => {
      const next = { ...prev };
      Object.keys(patch).forEach((key) => (next[key] = null));
      return next;
    });
  };

  const validate = () => {
    const next = {
      name: validateName(formData.name),
      phone: validatePhone(formData.phone),
      email: validateEmail(formData.email, { required: false }),
      age: validateAge(formData.age),
      procedureValue: validateAmount(formData.procedureValue),
    };
    setErrors(next);
    return Object.values(next).every((v) => !v);
  };

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
    if (!validate()) return;

    const match = existingClients.find(
      (c) => c.id !== client?.id && phoneKey(c.phone) && phoneKey(c.phone) === phoneKey(formData.phone)
    );
    if (match && !(duplicateConfirmedRef.current && duplicate?.id === match.id)) {
      setDuplicate(match);
      duplicateConfirmedRef.current = false;
      return;
    }

    const amount = parseAmount(formData.procedureValue);

    const today = new Date().toISOString().split('T')[0];
    const fields = {
      name: formData.name.trim(),
      phone: formatPhone(formData.phone),
      email: formData.email.trim(),
      age: formData.age ? parseInt(formData.age, 10) : undefined,
      gender: formData.gender,
      condition: formData.condition.trim() || 'General Eye Examination',
      procedureName: formData.procedureName,
      // Blank means not quoted yet, rather than a made-up figure
      procedureValue: amount ? formatAmount(amount) : '',
      numericValue: amount || 0,
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
      <form onSubmit={handleSubmit} noValidate className="space-y-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Full Name *" error={errors.name}>
            <TextInput
              size="sm"
              required
              value={formData.name}
              onChange={(e) => set({ name: e.target.value })}
              placeholder="e.g. Ramesh Chandra"
            />
          </Field>
          <Field label="Phone Number *" error={errors.phone}>
            <TextInput
              size="sm"
              required
              type="tel"
              inputMode="tel"
              maxLength={16}
              aria-invalid={Boolean(errors.phone)}
              value={formData.phone}
              onChange={(e) => set({ phone: e.target.value })}
              onBlur={() => formData.phone && setErrors((prev) => ({ ...prev, phone: validatePhone(formData.phone) }))}
              placeholder="+91 98201 44521"
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Field label="Email Address" className="sm:col-span-2" error={errors.email}>
            <TextInput
              size="sm"
              type="email"
              value={formData.email}
              onChange={(e) => set({ email: e.target.value })}
              placeholder="patient@gmail.com"
            />
          </Field>
          <Field label="Age & Gender" error={errors.age}>
            <div className="flex gap-1.5">
              <TextInput
                size="sm"
                type="number"
                min={0}
                max={120}
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
          <Field label="Estimated Value" error={errors.procedureValue}>
            <TextInput
              size="sm"
              inputMode="decimal"
              aria-invalid={Boolean(errors.procedureValue)}
              onBlur={() =>
                setErrors((prev) => ({ ...prev, procedureValue: validateAmount(formData.procedureValue) }))
              }
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
            // Only offered when editing; a new patient starts unflagged
            client &&
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Assigned Doctor">
            <Dropdown
              size="sm"
              value={formData.assignedDoctor}
              onChange={(assignedDoctor) => set({ assignedDoctor })}
              options={CLINIC_DOCTORS}
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

        {duplicate && (
          <div role="alert" className="p-3 rounded-lg border border-amber-300 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-500/10 text-sm text-gray-800 dark:text-gray-200 space-y-2">
            <p className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <span>
                <strong>{duplicate.name}</strong> is already saved with this phone number ({duplicate.phone}).
              </span>
            </p>
            <div className="flex flex-wrap gap-2 pl-6">
              {onOpenExisting && (
                <Button variant="outline" size="sm" type="button" onClick={() => onOpenExisting(duplicate.id)}>
                  Open {duplicate.name}
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                type="submit"
                onClick={() => (duplicateConfirmedRef.current = true)}
              >
                Save as a new patient anyway
              </Button>
            </div>
          </div>
        )}
        <div className="flex flex-wrap justify-end gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
          <Button variant="outline" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" type="submit">
            {client ? 'Save Changes' : 'Save'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
