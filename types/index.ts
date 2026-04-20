export interface Shift {
  id: string;
  nurseId: string;
  nurseName: string;
  date: string | null;     // '2026-04-20' or null for recurring
  dayOfWeek: string;       // 'Monday'
  startTime: string;
  endTime: string;
  isRecurring: boolean;
  createdAt: string;
}