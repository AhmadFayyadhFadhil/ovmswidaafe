import type { TourConfig } from '../types';

export const employeeQuickTour: TourConfig = {
  id: 'employee_quick_tour',
  role: 'employee',
  title: 'Quick Tour Employee',
  description: 'Panduan lengkap cara menggunakan layanan pengajuan kendaraan dinas untuk Employee.',
  type: 'quick_tour',
  steps: [
    {
      id: 'step_dashboard',
      title: 'Dashboard Overview',
      description: 'Dashboard memberikan ringkasan pengajuan kendaraan Anda, status persetujuan, dan aktivitas terkini secara real-time.',
      targetSelector: '[data-guide="dashboard"]',
      route: '/employee/dashboard',
      position: 'right',
    },
    {
      id: 'step_create_request',
      title: 'Create Request',
      description: 'Gunakan fitur ini untuk mengajukan permohonan armada kendaraan dinas baru beserta tanggal dan lokasi tujuan.',
      targetSelector: '[data-guide="create-request"]',
      route: '/employee/createrequest',
      position: 'right',
    },
    {
      id: 'step_my_requests',
      title: 'My Requests',
      description: 'Pantau daftar seluruh permohonan kendaraan yang telah Anda buat, lengkap dengan status persetujuan dari Kadep.',
      targetSelector: '[data-guide="my-requests"]',
      route: '/employee/myrequests',
      position: 'right',
    },
    {
      id: 'step_schedule',
      title: 'Vehicle Schedule & History',
      description: 'Lihat rincian jadwal armada yang telah ditetapkan untuk Anda serta riwayat perjalanan dinas yang sudah selesai.',
      targetSelector: '[data-guide="vehicle-schedule"]',
      route: '/employee/history',
      position: 'right',
    },
    {
      id: 'step_notifications',
      title: 'Notifications',
      description: 'Tempat Anda menerima pemberitahuan langsung mengenai persetujuan pengajuan, penugasan driver, dan pembaruan sistem.',
      targetSelector: '[data-guide="notifications"]',
      route: '/employee/notifications',
      position: 'right',
    },
    {
      id: 'step_profile',
      title: 'Profile',
      description: 'Kelola informasi pribadi, NIK, serta preferensi akun Anda di sini.\n\nYou\'re ready to use the system!',
      targetSelector: '[data-guide="profile"]',
      route: '/employee/profile',
      position: 'right',
    },
  ],
};
