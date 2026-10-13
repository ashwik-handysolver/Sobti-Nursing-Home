import React from 'react';
import { ClientLead, LanguageMode, MeetingRecording } from '../types/meeting';
import { AudioUploadZone } from './AudioUploadZone';
import { Modal } from './ui';

interface UploadDialogProps {
  clients: ClientLead[];
  defaultLanguage: LanguageMode;
  preSelectedClient: ClientLead | null;
  onProcessingSuccess: (recording: MeetingRecording) => void;
  onClose: () => void;
}

export const UploadDialog: React.FC<UploadDialogProps> = ({
  clients,
  defaultLanguage,
  preSelectedClient,
  onProcessingSuccess,
  onClose,
}) => (
  <Modal title="Upload recording" onClose={onClose} className="max-w-xl">
    <AudioUploadZone
      onProcessingSuccess={onProcessingSuccess}
      clients={clients}
      defaultLanguage={defaultLanguage}
      preSelectedClient={preSelectedClient}
    />
  </Modal>
);
