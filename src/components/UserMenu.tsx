import React from 'react';
import { Settings } from 'lucide-react';
import { CURRENT_USER } from '../data/clinic';
import { Avatar, muted, Popover } from './ui';

// Avatar of the signed-in user in the top bar
export const UserMenu: React.FC<{ onOpenSettings: () => void }> = ({ onOpenSettings }) => (
  <Popover
    className="w-60"
    trigger={({ isOpen, toggle }) => (
      <button
        onClick={toggle}
        aria-label={`Account: ${CURRENT_USER.name}`}
        aria-expanded={isOpen}
        title={CURRENT_USER.name}
        className="flex rounded-full cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
      >
        <Avatar name={CURRENT_USER.name} />
      </button>
    )}
  >
    {(close) => (
      <>
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-700/60">
          <Avatar name={CURRENT_USER.name} />
          <div className="min-w-0">
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{CURRENT_USER.name}</div>
            <div className={`${muted} truncate`}>{CURRENT_USER.role}</div>
          </div>
        </div>
        <div className="p-1.5">
          <button
            onClick={() => {
              onOpenSettings();
              close();
            }}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
          >
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </button>
        </div>
      </>
    )}
  </Popover>
);
