import type { LeadSource } from '../types/meeting';

// Eye care procedures offered by the clinic
export const CLINIC_PROCEDURES = [
  'SMILE Laser',
  'LASIK Surgery',
  'Cataract Surgery',
  'ICL / IPCL',
  'Glaucoma',
  'Retina',
  'Squint Surgery',
  'Paediatric Eye Care',
];
export const DEFAULT_PROCEDURE = 'Cataract Surgery';

export const CLINIC_DOCTORS = ['Dr. Amit Sobti', 'Dr. Harsh Sobti', 'Dr. Neha Dua Sobti', 'Dr. Raashi Sobti'];
export const DEFAULT_DOCTOR = 'Dr. Amit Sobti';

export const LEAD_SOURCES: LeadSource[] = [
  'Walk-in',
  'Doctor referral',
  'Friend or family',
  'Google search',
  'Website',
  'Social media',
  'Advertisement',
  'ECHS / insurance panel',
  'Other',
];


// Used in drafted messages to patients
export const CLINIC_NAME = 'Sobti Nursing Home';
export const CLINIC_PHONE = '98176-33316';
