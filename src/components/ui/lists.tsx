import React, { useState } from 'react';
import { Button } from './Button';
import { muted } from './styles';

interface ExpandableListProps<T> {
  items: T[];
  limit?: number; // how many to show before "Show all"
  className?: string;
  children: (item: T, index: number) => React.ReactNode;
}

// A list that shows its first few items and reveals the rest on request
export function ExpandableList<T>({ items, limit = 3, className, children }: ExpandableListProps<T>) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? items : items.slice(0, limit);

  return (
    <>
      <ul className={className}>{visible.map(children)}</ul>
      {items.length > limit && (
        <Button variant="link" className="mt-2 text-xs" onClick={() => setShowAll((prev) => !prev)}>
          {showAll ? 'Show less' : `Show all ${items.length}`}
        </Button>
      )}
    </>
  );
}

interface BulletListProps<T> {
  title: string;
  items: T[];
  dot: string; // bullet colour class
  limit?: number;
  renderItem?: (item: T) => React.ReactNode;
}

// Titled bullet list, capped to the first few items
export function BulletList<T>({ title, items, dot, limit, renderItem }: BulletListProps<T>) {
  if (items.length === 0) return null;
  return (
    <div>
      <h3 className={`${muted} font-medium mb-1.5`}>{title}</h3>
      <ExpandableList items={items} limit={limit} className="space-y-1.5 text-sm text-gray-800 dark:text-gray-200">
        {(item, i) => (
          <li key={i} className="flex items-start gap-2 leading-snug">
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1.5 ${dot}`} />
            <span>{renderItem ? renderItem(item) : String(item)}</span>
          </li>
        )}
      </ExpandableList>
    </div>
  );
}
