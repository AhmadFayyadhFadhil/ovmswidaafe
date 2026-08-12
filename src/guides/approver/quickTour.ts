import type { TourConfig } from '../types';

export const approverQuickTour: TourConfig = {
  id: 'approver_quick_tour',
  role: 'approver',
  title: 'Quick Tour Manager Approver',
  description: 'Panduan persetujuan pengajuan armada kendaraan dinas untuk Kepala Departemen.',
  type: 'quick_tour',
  steps: [
    {
      id: 'step_approver_dashboard',
      title: 'Approver Dashboard',
      description: 'Pantau statistik permohonan kendaraan yang membutuhkan persetujuan Anda hari ini.',
      targetSelector: '[data-guide="approver-dashboard"]',
      route: '/approver/dashboard',
      position: 'right',
    },
    {
      id: 'step_pending_requests',
      title: 'Pending Requests',
      description: 'Daftar permohonan kendaraan dari staf departemen Anda yang sedang menunggu konfirmasi persetujuan.',
      targetSelector: '[data-guide="pending-requests"]',
      route: '/approver/requests',
      position: 'right',
    },
    {
      id: 'step_request_detail',
      title: 'Request Detail',
      description: 'Klik pada pengajuan untuk melihat rincian lokasi tujuan, alasan perjalanan dinas, dan daftar penumpang.',
      targetSelector: '[data-guide="pending-requests"]',
      route: '/approver/requests',
      position: 'right',
    },
    {
      id: 'step_approval_history',
      title: 'Approval History',
      description: 'Lihat rekap histori seluruh permohonan yang telah Anda setujui maupun Anda tolak.',
      targetSelector: '[data-guide="approval-history"]',
      route: '/approver/history',
      position: 'right',
    },
    {
      id: 'step_notifications',
      title: 'Notifications',
      description: 'Dapatkan pemberitahuan otomatis setiap kali ada permohonan kendaraan dinas baru dari anggota tim Anda.',
      targetSelector: '[data-guide="notifications"]',
      route: '/approver/notifications',
      position: 'right',
    },
  ],
};
