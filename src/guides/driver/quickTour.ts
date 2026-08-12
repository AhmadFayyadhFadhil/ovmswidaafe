import type { TourConfig } from '../types';

export const driverQuickTour: TourConfig = {
  id: 'driver_quick_tour',
  role: 'driver',
  title: 'Quick Tour Driver',
  description: 'Panduan penggunaan portal tugas dan operasi perjalanan dinas untuk Driver.',
  type: 'quick_tour',
  steps: [
    {
      id: 'step_driver_dashboard',
      title: 'Dashboard Driver',
      description: 'Halaman utama untuk memantau ringkasan status ketersediaan armada dan jadwal keberangkatan Anda.',
      targetSelector: '[data-guide="driver-dashboard"]',
      route: '/driver/dashboard',
      position: 'right',
    },
    {
      id: 'step_driver_assignment',
      title: 'My Tasks / Assignment',
      description: 'Lihat daftar penugasan perjalanan dinas yang telah dialokasikan oleh GA/HRD kepada Anda.',
      targetSelector: '[data-guide="driver-assignment"]',
      route: '/driver/dashboard?tab=assignments',
      position: 'right',
    },
    {
      id: 'step_driver_vehicle',
      title: 'My Vehicle',
      description: 'Periksa rincian informasi unit kendaraan dinas, nomor plat, dan odometer yang Anda kemudikan.',
      targetSelector: '[data-guide="driver-vehicle"]',
      route: '/driver/dashboard?tab=vehicle',
      position: 'right',
    },
    {
      id: 'step_driver_schedule',
      title: 'Trip Schedule & Calendar',
      description: 'Pantau kalender jadwal perjalanan mendatang agar persiapan keberangkatan tepat waktu.',
      targetSelector: '[data-guide="driver-schedule"]',
      route: '/driver/dashboard?tab=calendar',
      position: 'right',
    },
    {
      id: 'step_driver_history',
      title: 'History Perjalanan',
      description: 'Lihat seluruh riwayat perjalanan dinas dan penugasan yang telah sukses Anda selesaikan.',
      targetSelector: '[data-guide="driver-history"]',
      route: '/driver/dashboard?tab=schedule',
      position: 'right',
    },
  ],
};
