export type GuideRole = 'employee' | 'approver' | 'gahrd' | 'driver' | 'admin' | 'security';

export interface GuideStep {
  id: string;
  title: string;
  description: string;
  targetSelector: string; // e.g. '[data-guide="dashboard"]' or 'data-guide="dashboard"'
  route?: string; // Optional route if step requires navigating to another page
  position?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
}

export interface TourConfig {
  id: string;
  role: GuideRole;
  title: string;
  description: string;
  type: 'quick_tour' | 'feature_guide';
  steps: GuideStep[];
}
