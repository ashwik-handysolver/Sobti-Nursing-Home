import { useState } from 'react';
import type { PeriodId } from './conversion';

const PERIOD_KEY = 'meetmind_period_v1';

// The time period the Dashboard and Insights show; remembered in this browser and shared by both
export function usePeriod(): [PeriodId, (period: PeriodId) => void] {
  const [period, setPeriod] = useState<PeriodId>(() => {
    try {
      return (localStorage.getItem(PERIOD_KEY) as PeriodId) || '90d';
    } catch {
      return '90d';
    }
  });
  const change = (next: PeriodId) => {
    setPeriod(next);
    try {
      localStorage.setItem(PERIOD_KEY, next);
    } catch {}
  };
  return [period, change];
}
