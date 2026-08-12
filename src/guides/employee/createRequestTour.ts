import type { TourConfig } from '../types';

export const employeeCreateRequestTour: TourConfig = {
  id: 'employee_create_request_tour',
  role: 'employee',
  title: 'Cara Mengajukan Kendaraan',
  description: 'Panduan langkah demi langkah cara mengisi formulir pengajuan kendaraan dinas.',
  type: 'feature_guide',
  steps: [
    {
      id: 'step_form_datetime',
      title: '1. Pilih Tanggal & Waktu',
      description: 'Tentukan tanggal keberangkatan dan perkiraan lama durasi perjalanan dinas Anda.',
      targetSelector: '[data-guide="request-datetime"]',
      route: '/employee/createrequest',
      position: 'bottom',
    },
    {
      id: 'step_form_destination',
      title: '2. Masukkan Kota & Tujuan',
      description: 'Pilih kota tujuan dan isi lokasi spesifik tempat perjalanan dinas Anda.',
      targetSelector: '[data-guide="request-destination"]',
      route: '/employee/createrequest',
      position: 'bottom',
    },
    {
      id: 'step_form_passengers',
      title: '3. Data Penumpang',
      description: 'Tentukan jumlah penumpang dan pilih daftar staf yang ikut dalam perjalanan.',
      targetSelector: '[data-guide="request-passengers"]',
      route: '/employee/createrequest',
      position: 'bottom',
    },
    {
      id: 'step_form_priority',
      title: '4. Prioritas & Catatan',
      description: 'Pilih tingkat urgensi permohonan dan tambahkan catatan khusus jika diperlukan.',
      targetSelector: '[data-guide="request-priority"]',
      route: '/employee/createrequest',
      position: 'bottom',
    },
    {
      id: 'step_form_submit',
      title: '5. Kirim Pengajuan',
      description: 'Klik tombol ini untuk mengirimkan pengajuan ke Kepala Departemen Anda.',
      targetSelector: '[data-guide="submit-request"]',
      route: '/employee/createrequest',
      position: 'top',
    },
  ],
};
