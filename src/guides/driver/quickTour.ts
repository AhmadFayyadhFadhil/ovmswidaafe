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
      title: '1. Dashboard Driver',
      description: 'Selamat datang di Portal Driver! Halaman ini memuat ringkasan tugas dan status ketersediaan armada Anda.',
      targetSelector: '[data-guide="driver-dashboard-overview"]',
      route: '/driver/dashboard',
      position: 'bottom',
    },
    {
      id: 'step_driver_hero_task',
      title: '2. Kartu Penugasan Utama',
      description: 'Menampilkan detail lokasi tujuan, waktu keberangkatan, serta penumpang utama untuk perjalanan dinas terdekat.',
      targetSelector: '[data-guide="driver-task-card"]',
      route: '/driver/dashboard',
      position: 'bottom',
    },
    {
      id: 'step_driver_assignment',
      title: '3. Menu Tugas / Assignments',
      description: 'Akses daftar seluruh penugasan perjalanan yang dialokasikan oleh GA/HRD untuk dikonfirmasi dan dijalankan.',
      targetSelector: '[data-guide="driver-assignment"]',
      route: '/driver/dashboard?tab=assignments',
      position: 'right',
    },
    {
      id: 'step_driver_vehicle',
      title: '4. Informasi Kendaraan Saya',
      description: 'Periksa rincian unit kendaraan dinas, nomor plat, serta catatan odometer yang Anda kemudikan.',
      targetSelector: '[data-guide="driver-vehicle"]',
      route: '/driver/dashboard?tab=vehicle',
      position: 'right',
    },
    {
      id: 'step_driver_schedule',
      title: '5. Kalender Jadwal Tugas',
      description: 'Pantau kalender matriks jadwal keberangkatan agar persiapan perjalanan dinas terlaksana tepat waktu.',
      targetSelector: '[data-guide="driver-schedule"]',
      route: '/driver/dashboard?tab=calendar',
      position: 'right',
    },
    {
      id: 'step_driver_history',
      title: '6. Histori Perjalanan Selesai',
      description: 'Lihat seluruh rekap riwayat tugas perjalanan dinas yang telah sukses Anda selesaikan.\n\nAnda siap menjalankan tugas!',
      targetSelector: '[data-guide="driver-history"]',
      route: '/driver/dashboard?tab=schedule',
      position: 'right',
    },
  ],
};
