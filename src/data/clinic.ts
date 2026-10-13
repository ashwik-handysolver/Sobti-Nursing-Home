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

// There is no sign-in yet, so the app runs as the clinic's lead doctor
export const CURRENT_USER = { name: 'Dr. Amit Sobti', role: 'Eye Surgeon' };
