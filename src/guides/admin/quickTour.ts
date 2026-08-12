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
      title: 'Administrator Dashboard',
      description: 'Pusat kontrol dan matriks statistik utama seluruh operasional sistem OVMS perusahaan.',
      targetSelector: '[data-guide="admin-dashboard"]',
      route: '/admin/dashboard',
      position: 'right',
    },
    {
      id: 'step_user_management',
      title: 'User Management',
      description: 'Kelola data seluruh akun karyawan, registrasi staf baru, NIK, jabatan, dan aktivasi akun.',
      targetSelector: '[data-guide="user-management"]',
      route: '/admin/users',
      position: 'right',
    },
    {
      id: 'step_role_management',
      title: 'Role & Permission Management',
      description: 'Atur hak akses dan wewenang akun (Employee, Approver, Driver, GA/HRD, Security, Admin).',
      targetSelector: '[data-guide="role-management"]',
      route: '/admin/roles',
      position: 'right',
    },
    {
      id: 'step_notification_center',
      title: 'Notification Center',
      description: 'Kelola pusat notifikasi sistem, kirim pengumuman operasional, dan atur notifikasi otomatis.',
      targetSelector: '[data-guide="notification-center"]',
      route: '/admin/notifications',
      position: 'right',
    },
    {
      id: 'step_audit_logs',
      title: 'Audit Logs',
      description: 'Pantau jejak aktivitas dan log perubahan data (SIEM / Audit Trail) secara sistematis.',
      targetSelector: '[data-guide="audit-logs"]',
      route: '/admin/audit',
      position: 'right',
    },
    {
      id: 'step_system_settings',
      title: 'System Settings',
      description: 'Konfigurasi identitas perusahaan, nama sistem, logo, serta parameter operasi global.',
      targetSelector: '[data-guide="system-settings"]',
      route: '/admin/settings',
      position: 'right',
    },
  ],
};
