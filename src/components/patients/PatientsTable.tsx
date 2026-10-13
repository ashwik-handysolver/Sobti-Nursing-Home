import React from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import { ClientLead } from '../../types/meeting';
import { Avatar, Button, ConversionBadge, formatRecordingDate, IconButton, LeadFlagBadge, muted, StageBadge } from '../ui';

export type SortField = 'name' | 'conversionChance' | 'lastVisitDate' | 'numericValue';
export type SortDirection = 'asc' | 'desc';

interface PatientsTableProps {
  clients: ClientLead[]; // the current page
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onOpen: (client: ClientLead) => void;
  onEdit: (client: ClientLead) => void;
  onDelete: (client: ClientLead) => void;
}

export const PatientsTable: React.FC<PatientsTableProps> = ({
  clients,
  sortField,
  sortDirection,
  onSort,
  currentPage,
  totalPages,
  onPageChange,
  onOpen,
  onEdit,
  onDelete,
}) => {
  const arrow = (field: SortField) => sortField === field && (sortDirection === 'asc' ? '↑' : '↓');

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-850 select-none">
              <th className="py-2.5 px-4 font-medium cursor-pointer" onClick={() => onSort('name')}>
                Patient {arrow('name')}
              </th>
              <th className="py-2.5 px-4 font-medium hidden md:table-cell">Stage</th>
              <th
                className="py-2.5 px-4 font-medium cursor-pointer whitespace-nowrap"
                onClick={() => onSort('conversionChance')}
              >
                Conversion {arrow('conversionChance')}
              </th>
              <th
                className="py-2.5 px-4 font-medium cursor-pointer whitespace-nowrap hidden sm:table-cell"
                onClick={() => onSort('lastVisitDate')}
              >
                Last visit {arrow('lastVisitDate')}
              </th>
              <th className="py-2.5 px-4" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
            {clients.map((client) => (
              <tr
                key={client.id}
                onClick={() => onOpen(client)}
                className="hover:bg-gray-50 dark:hover:bg-gray-750/50 transition-colors cursor-pointer"
              >
                <td className="py-3 px-4 w-full max-w-0">
                  <div className="flex items-center gap-3">
                    <Avatar name={client.name} />
                    <div className="min-w-0">
                      <div className="font-medium text-gray-900 dark:text-gray-100 truncate">{client.name}</div>
                      <div className={`${muted} mt-0.5 truncate`}>{client.procedureName}</div>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4 whitespace-nowrap hidden md:table-cell">
                  <div className="flex items-center gap-2">
                    <StageBadge stage={client.stage} />
                    <LeadFlagBadge flag={client.flag} />
                  </div>
                </td>
                <td className="py-3 px-4 whitespace-nowrap">
                  <ConversionBadge value={client.conversionChance} />
                </td>
                <td className="py-3 px-4 whitespace-nowrap text-gray-600 dark:text-gray-400 hidden sm:table-cell">
                  {formatRecordingDate(client.lastVisitDate).date}
                </td>
                <td className="py-3 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                  <IconButton onClick={() => onEdit(client)} title="Edit patient" aria-label="Edit patient">
                    <Edit2 className="w-4 h-4" />
                  </IconButton>
                  <IconButton
                    tone="danger"
                    onClick={() => onDelete(client)}
                    title="Delete patient"
                    aria-label="Delete patient"
                  >
                    <Trash2 className="w-4 h-4" />
                  </IconButton>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className={`${muted} px-4 py-2.5 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-2`}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            Prev
          </Button>
          <span className="tabular-nums">
            {currentPage} / {totalPages}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </>
  );
};
