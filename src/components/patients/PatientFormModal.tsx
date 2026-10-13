import React, { useRef, useState } from 'react';
import { UploadCloud, Users } from 'lucide-react';
import { ClientLead, LeadStage } from '../../types/meeting';
import { CLINIC_DOCTORS, CLINIC_PROCEDURES, DEFAULT_DOCTOR, DEFAULT_PROCEDURE } from '../../data/clinic';
import { Button, Dropdown, DropdownOption, Field, Modal, TextArea, TextInput } from '../ui';

type Gender = 'Male' | 'Female' | 'Other';
type UrgencyLevel = 'High' | 'Medium' | 'Low';

export const STAGE_OPTIONS: LeadStage[] = ['New Inquiry', 'Consultation Completed', 'Surgery Scheduled', 'Post-Op Follow-Up'];

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
  stage: 'New Inquiry',
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
  assignedDoctor: client.assignedDoctor,
  urgencyLevel: client.urgencyLevel,
  notes: client.notes || '',
});

interface PatientFormModalProps {
  client: ClientLead | null; // null registers a new patient
  onSave: (client: ClientLead, options: { uploadRecording: boolean }) => void;
  onClose: () => void;
}

export const PatientFormModal: React.FC<PatientFormModalProps> = ({ client, onSave, onClose }) => {
  const [formData, setFormData] = useState<PatientFormData>(() => (client ? toFormData(client) : EMPTY_FORM));
  // Which of the two "save" buttons submitted the new-patient form
  const uploadAfterSaveRef = useRef(false);

  const set = (patch: Partial<PatientFormData>) => setFormData((prev) => ({ ...prev, ...patch }));

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
          <Field label="Treatment Stage">
            <Dropdown size="sm" value={formData.stage} onChange={(stage) => set({ stage })} options={STAGE_OPTIONS} />
          </Field>
          <Field label="Urgency Level">
            <Dropdown
              size="sm"
              value={formData.urgencyLevel}
              onChange={(urgencyLevel) => set({ urgencyLevel })}
              options={URGENCY_OPTIONS}
            />
          </Field>
        </div>

        <Field label="Assigned Doctor">
          <Dropdown
            size="sm"
            value={formData.assignedDoctor}
            onChange={(assignedDoctor) => set({ assignedDoctor })}
            options={CLINIC_DOCTORS}
          />
        </Field>

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
