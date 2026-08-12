import type { TourConfig } from '../types';

export const gahrdQuickTour: TourConfig = {
  id: 'gahrd_quick_tour',
  role: 'gahrd',
  title: 'Quick Tour GA / HRD',
  description: 'Panduan pengelolaan operasional armada, penugasan driver, dan koordinasi kendaraan dinas.',
  type: 'quick_tour',
  steps: [
    {
      id: 'step_gahrd_dashboard',
      title: 'GA / HRD Dashboard',
      description: 'Pantau ketersediaan armada internal, kesiapan driver, serta permintaan kendaraan yang telah disetujui Kadep.',
      targetSelector: '[data-guide="gahrd-dashboard"]',
      route: '/gahrd/dashboard',
      position: 'right',
    },
    {
      id: 'step_gahrd_requests',
      title: 'Vehicle Requests',
      description: 'Kelola dan lakukan verifikasi permohonan kendaraan yang siap ditugaskan armada dan pengemudinya.',
      targetSelector: '[data-guide="gahrd-requests"]',
      route: '/gahrd/requests',
      position: 'right',
    },
    {
      id: 'step_driver_assignment',
      title: 'Driver Availability & Assignment',
      description: 'Pantau status keberadaan driver (Tersedia / On Trip) dan lakukan alokasi penugasan driver ke permohonan.',
      targetSelector: '[data-guide="driver-assignment"]',
      route: '/gahrd/driver',
      position: 'right',
    },
    {
      id: 'step_vehicle_assignment',
      title: 'Vehicle Management',
      description: 'Kelola inventaris armada mobil dinas, kondisi odometer, foto STNK, serta ketersediaan unit.',
      targetSelector: '[data-guide="vehicle-assignment"]',
      route: '/admin/vehicles',
      position: 'right',
    },
    {
      id: 'step_gahrd_schedule',
      title: 'Operational Calendar',
      description: 'Lihat matriks kalender penugasan kendaraan untuk menghindari bentrok jadwal perjalanan dinas.',
      targetSelector: '[data-guide="gahrd-schedule"]',
      route: '/gahrd/calendar',
      position: 'right',
    },
    {
      id: 'step_gahrd_history',
      title: 'Reports & History',
      description: 'Akses laporan lengkap penggunaan armada, pengeluaran sewa eksternal, dan arsip riwayat perjalanan.',
      targetSelector: '[data-guide="gahrd-history"]',
      route: '/gahrd/history',
      position: 'right',
    },
  ],
};
