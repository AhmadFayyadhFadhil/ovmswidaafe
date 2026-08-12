import type { TourConfig } from '../types';

export const adminQuickTour: TourConfig = {
  id: 'admin_quick_tour',
  role: 'admin',
  title: 'Quick Tour Administrator',
  description: 'Panduan kontrol sistem, manajemen pengguna, hak akses peran, dan audit operasional.',
  type: 'quick_tour',
  steps: [
    {
      id: 'step_admin_dashboard',
      title: '1. Administrator Dashboard',
      description: 'Selamat datang Administrator! Halaman ini memuat pusat kontrol dan metrik statistik operasional sistem OVMS.',
      targetSelector: '[data-guide="admin-dashboard-stats"]',
      route: '/admin/dashboard',
      position: 'bottom',
    },
    {
      id: 'step_user_management',
      title: '2. User Management Table',
      description: 'Kelola data seluruh akun karyawan, registrasi staf baru, NIK, jabatan, dan aktivasi akun secara terpusat.',
      targetSelector: '[data-guide="admin-users-table"]',
      route: '/admin/users',
      position: 'top',
    },
    {
      id: 'step_role_management',
      title: '3. Role & Permission Management',
      description: 'Atur hak akses dan wewenang modul (Employee, Approver, Driver, GA/HRD, Security, Admin).',
      targetSelector: '[data-guide="role-management"]',
      route: '/admin/roles',
      position: 'right',
    },
    {
      id: 'step_notification_center',
      title: '4. Notification Center',
      description: 'Kelola pusat notifikasi sistem, kirim pengumuman operasional, dan atur notifikasi otomatis.',
      targetSelector: '[data-guide="notification-center"]',
      route: '/admin/notifications',
      position: 'right',
    },
    {
      id: 'step_audit_logs',
      title: '5. Audit Trail Logs',
      description: 'Pantau jejak aktivitas dan log perubahan data (SIEM / Audit Trail) secara sistematis.',
      targetSelector: '[data-guide="audit-logs"]',
      route: '/admin/audit',
      position: 'right',
    },
    {
      id: 'step_system_settings',
      title: '6. System Settings',
      description: 'Konfigurasi identitas perusahaan, nama sistem, logo, serta parameter operasi global.\n\nAnda siap mengelola kontrol sistem!',
      targetSelector: '[data-guide="system-settings"]',
      route: '/admin/settings',
      position: 'right',
    },
  ],
};
