import React from 'react';
import { ClientLead, LanguageMode, MeetingRecording } from '../types/meeting';
import { AudioUploadZone } from './AudioUploadZone';
import { Modal } from './ui';

export type UploadMode = 'upload' | 'record';

interface UploadDialogProps {
  clients: ClientLead[];
  defaultLanguage: LanguageMode;
  preSelectedClient: ClientLead | null;
  mode?: UploadMode;
  onProcessingSuccess: (recording: MeetingRecording) => void;
  onClose: () => void;
}

export const UploadDialog: React.FC<UploadDialogProps> = ({
  clients,
  defaultLanguage,
  preSelectedClient,
  mode = 'upload',
  onProcessingSuccess,
  onClose,
}) => (
  <Modal title={mode === 'record' ? 'Record consultation' : 'Upload recording'} onClose={onClose} className="max-w-xl">
    <AudioUploadZone
      onProcessingSuccess={onProcessingSuccess}
      clients={clients}
      defaultLanguage={defaultLanguage}
      preSelectedClient={preSelectedClient}
      mode={mode}
    />
  </Modal>
);
