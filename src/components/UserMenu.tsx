import React from 'react';
import { LogOut, Settings } from 'lucide-react';
import type { AppUser } from '../AuthGate';
import { Avatar, muted, Popover } from './ui';

const ITEM =
  'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer';

// Avatar of the signed-in user in the top bar
export const UserMenu: React.FC<{ user: AppUser; onOpenSettings: () => void; onSignOut: () => void }> = ({
  user,
  onOpenSettings,
  onSignOut,
}) => (
  <Popover
    className="w-64"
    trigger={({ isOpen, toggle }) => (
      <button
        onClick={toggle}
        aria-label={`Account: ${user.name}`}
        aria-expanded={isOpen}
        title={user.name}
        className="flex rounded-full cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
      >
        <Avatar name={user.name} />
      </button>
    )}
  >
    {(close) => (
      <>
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-700/60">
          <Avatar name={user.name} />
          <div className="min-w-0">
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{user.name}</div>
            <div className={`${muted} truncate`}>{user.email}</div>
          </div>
        </div>
        <div className="p-1.5">
          <button
            onClick={() => {
              onOpenSettings();
              close();
            }}
            className={ITEM}
          >
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </button>
          <button
            onClick={() => {
              close();
              onSignOut();
            }}
            className={ITEM}
          >
            <LogOut className="w-4 h-4" />
            <span>Log out</span>
          </button>
        </div>
      </>
    )}
  </Popover>
);
