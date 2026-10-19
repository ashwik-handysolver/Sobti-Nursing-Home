import React from 'react';
import { Menu } from 'lucide-react';
import { ClientLead, MeetingRecording } from '../types/meeting';
import { GlobalSearch } from './GlobalSearch';
import { NotificationsMenu } from './NotificationsMenu';
import { UserMenu } from './UserMenu';
import { IconButton } from './ui';
import type { AppUser } from '../AuthGate';

interface TopNavbarProps {
  recordings: MeetingRecording[];
  clients: ClientLead[];
  onOpenMobileMenu: () => void;
  onOpenRecording: (recordingId: string, transcriptQuery?: string) => void;
  onOpenPatient: (patientId: string) => void;
  onToggleTaskStatus: (taskId: string) => void;
  onOpenFollowUps: () => void;
  onOpenSettings: () => void;
  user: AppUser;
  onSignOut: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  recordings,
  clients,
  onOpenMobileMenu,
  onOpenRecording,
  onOpenPatient,
  onToggleTaskStatus,
  onOpenFollowUps,
  onOpenSettings,
  user,
  onSignOut,
}) => (
  // The page-coloured strip keeps scrolling content from showing above the floating bar
  <div className="sticky top-0 z-30 px-3 sm:px-4 pt-3 bg-gray-50 dark:bg-gray-900">
    <header className="flex items-center gap-2 sm:gap-3 pl-2 pr-3 sm:px-4 py-2 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg shadow-gray-900/5 dark:shadow-black/30">
      <IconButton onClick={onOpenMobileMenu} aria-label="Open menu" className="md:hidden p-2">
        <Menu className="w-5 h-5" />
      </IconButton>

      <GlobalSearch
        recordings={recordings}
        clients={clients}
        onOpenRecording={onOpenRecording}
        onOpenPatient={onOpenPatient}
      />

      <div className="ml-auto flex items-center gap-1.5 sm:gap-3 shrink-0">
        <NotificationsMenu
          recordings={recordings}
          clients={clients}
          onToggleTaskStatus={onToggleTaskStatus}
          onOpenRecording={onOpenRecording}
          onViewAll={onOpenFollowUps}
        />
        <UserMenu user={user} onOpenSettings={onOpenSettings} onSignOut={onSignOut} />
      </div>
    </header>
  </div>
);
