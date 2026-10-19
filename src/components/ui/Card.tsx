import React from 'react';
import { card, muted } from './styles';

interface CardProps extends React.HTMLAttributes<HTMLElement> {
  as?: 'div' | 'section';
}

export const Card: React.FC<CardProps> = ({ as: Tag = 'div', className = '', ...props }) => (
  <Tag {...props} className={`${card} ${className}`} />
);

interface PanelProps {
  title: string;
  icon?: React.ElementType;
  subtitle?: React.ReactNode;
  action?: React.ReactNode; // e.g. a "View all" link, shown at the right of the header
  flush?: boolean; // body runs edge to edge (tables, lists with their own padding)
  className?: string;
  children: React.ReactNode;
}

// The standard card for a section of a page: a header (title, optional subtitle and action) and a
// body. It fills the height of its grid cell, so cards in the same row line up.
export const Panel: React.FC<PanelProps> = ({ title, icon: Icon, subtitle, action, flush, className = '', children }) => (
  <Card as="section" className={`flex flex-col min-w-0 ${className}`}>
    <header className="flex items-start justify-between gap-3 px-5 pt-4 pb-3">
      <div className="min-w-0">
        <h2 className="flex items-center gap-2 text-[15px] font-semibold text-gray-900 dark:text-gray-100">
          {Icon && <Icon className="w-4 h-4 shrink-0 text-gray-400 dark:text-gray-500" />}
          <span className="truncate">{title}</span>
        </h2>
        {subtitle && <p className={`${muted} mt-0.5`}>{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
    <div className={`flex-1 ${flush ? '' : 'px-5 pb-5'}`}>{children}</div>
  </Card>
);
