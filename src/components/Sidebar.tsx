import React from 'react';
import {
  Building2,
  CalendarCheck,
  ChevronsLeft,
  ChevronsRight,
  LayoutGrid,
  Moon,
  Target,
  Users,
  X,
} from 'lucide-react';
import { Logo, SwitchTrack } from './ui';
import { ReferButton } from './ReferButton';
import type { AppUser } from '../AuthGate';

export type NavigationPage = 'dashboard' | 'patients' | 'insights' | 'follow-ups' | 'recordings' | 'settings';

interface SidebarProps {
  activePage: NavigationPage;
  onNavigate: (page: NavigationPage) => void;
  pendingTasksCount: number;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  isCollapsed: boolean;
  onToggleCollapsed: () => void;
  user: AppUser;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activePage,
  onNavigate,
  pendingTasksCount,
  isDarkMode,
  onToggleDarkMode,
  isOpenMobile,
  onCloseMobile,
  isCollapsed,
  onToggleCollapsed,
  user,
}) => {
  const navItems: { id: NavigationPage; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
    { id: 'patients', label: 'Leads', icon: Users },
    { id: 'insights', label: 'Conversion Insights', icon: Target },
    {
      id: 'follow-ups',
      label: 'Follow-ups',
      icon: CalendarCheck,
      badge: pendingTasksCount > 0 ? pendingTasksCount : undefined,
    },
  ];

  // Collapsing only applies on desktop; the mobile drawer always shows labels
  const label = isCollapsed ? 'md:hidden' : '';
  const rowLayout = isCollapsed ? 'md:justify-center md:px-0' : '';
  const footerRow = `w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-lg text-sm text-gray-600 dark:text-gray-400 ${rowLayout}`;

  return (
    <>
      {isOpenMobile && <div onClick={onCloseMobile} className="fixed inset-0 z-40 bg-black/50 md:hidden" />}

      <aside
        className={`fixed md:sticky z-40 top-3 left-3 md:left-0 md:ml-3 md:self-start h-[calc(100dvh-1.5rem)] w-60 shrink-0 flex flex-col justify-between
        bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg shadow-gray-900/5 dark:shadow-black/30 p-4
        transition-[transform,width] duration-200 ${isCollapsed ? 'md:w-[76px] md:px-3' : ''} ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-[calc(100%+1rem)] md:translate-x-0'
        }`}
      >
        <div className="space-y-8">
          <div className={`flex items-center justify-between gap-2 pt-1 ${isCollapsed ? 'md:justify-center' : ''}`}>
            <Logo nameClassName={label} />
            <button
              onClick={onCloseMobile}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 md:hidden cursor-pointer"
              aria-label="Close menu"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    onCloseMobile();
                  }}
                  aria-current={isActive ? 'page' : undefined}
                  title={isCollapsed ? item.label : undefined}
                  className={`relative w-full flex items-center justify-between pl-3.5 pr-3 py-2.5 rounded-lg text-sm border-l-2 transition-colors cursor-pointer ${rowLayout} ${
                    isActive
                      ? 'border-blue-600 dark:border-blue-500 bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400 font-medium'
                      : 'border-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100'
                  }`}
                >
                  <span className="flex items-center gap-3.5">
                    <Icon className="w-5 h-5 shrink-0" />
                    <span className={label}>{item.label}</span>
                  </span>
                  {item.badge !== undefined && (
                    <>
                      <span
                        className={`text-xs tabular-nums px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 ${label}`}
                      >
                        {item.badge}
                      </span>
                      {isCollapsed && (
                        <span className="hidden md:block absolute top-1.5 right-2.5 w-2 h-2 rounded-full bg-amber-500" />
                      )}
                    </>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="space-y-3">
        <ReferButton user={user} isCollapsed={isCollapsed} />
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-1">
          <div className={footerRow} title={isCollapsed ? 'Ophthalmology Clinic' : undefined}>
            <Building2 className="w-5 h-5 shrink-0" />
            <span className={label}>Ophthalmology Clinic</span>
          </div>

          <button
            onClick={onToggleDarkMode}
            role="switch"
            aria-checked={isDarkMode}
            aria-label="Dark mode"
            title={isCollapsed ? 'Dark mode' : undefined}
            className={`${footerRow} justify-between hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer`}
          >
            <span className="flex items-center gap-3.5">
              <Moon className={`w-5 h-5 shrink-0 ${isCollapsed && isDarkMode ? 'md:text-blue-500' : ''}`} />
              <span className={label}>Dark mode</span>
            </span>
            <SwitchTrack checked={isDarkMode} className={label} />
          </button>

          <button
            onClick={onToggleCollapsed}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={isCollapsed ? 'Expand sidebar' : undefined}
            className={`${footerRow} hidden md:flex hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer`}
          >
            {isCollapsed ? <ChevronsRight className="w-5 h-5 shrink-0" /> : <ChevronsLeft className="w-5 h-5 shrink-0" />}
            <span className={label}>Collapse</span>
          </button>
        </div>
        </div>
      </aside>
    </>
  );
};
