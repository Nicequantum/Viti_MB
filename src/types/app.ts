export type AppView = 'home' | 'ro' | 'line' | 'settings';

export interface DealershipContext {
  id: string;
  name: string;
  technicianId?: string;
  technicianName?: string;
}