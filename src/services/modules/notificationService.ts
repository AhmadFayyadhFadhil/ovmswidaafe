import type { SystemNotification } from '../../types';
import type { ApiResponse } from '../../types/api';
import { apiClient } from '../api/api';

const READ_KEY = 'ovms_read_notification_ids';
const DELETED_KEY = 'ovms_deleted_notification_ids';

function getStoredReadIds(): string[] {
  try {
    const raw = localStorage.getItem(READ_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function getStoredDeletedIds(): string[] {
  try {
    const raw = localStorage.getItem(DELETED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveStoredReadIds(ids: string[]) {
  try {
    localStorage.setItem(READ_KEY, JSON.stringify(Array.from(new Set(ids))));
  } catch (err) {
    console.error(err);
  }
}

function saveStoredDeletedIds(ids: string[]) {
  try {
    localStorage.setItem(DELETED_KEY, JSON.stringify(Array.from(new Set(ids))));
  } catch (err) {
    console.error(err);
  }
}

export const notificationService = {
  getAll: async (): Promise<ApiResponse<SystemNotification[]>> => {
    if (import.meta.env.VITE_ENABLE_MOCK !== 'true') {
      try {
        const res = await apiClient.get<ApiResponse<SystemNotification[]>>('/notifications');
        if (res.data?.status === 'success' && Array.isArray(res.data.data)) {
          return res.data;
        }
      } catch (err) {
        console.warn('Backend notification fetch failed, using local fallback:', err);
      }
    }

    const readIds = getStoredReadIds();
    const deletedIds = getStoredDeletedIds();

    return {
      data: [],
      total: 0
    };
  },

  markAsRead: async (id: string): Promise<ApiResponse<SystemNotification>> => {
    const readIds = getStoredReadIds();
    readIds.push(String(id));
    saveStoredReadIds(readIds);

    if (import.meta.env.VITE_ENABLE_MOCK !== 'true') {
      try {
        await apiClient.post('/notifications/mark-read', { id });
      } catch (err) {
        console.warn('Failed to post mark-read to API:', err);
      }
    }

    window.dispatchEvent(new CustomEvent('ovms-notif-read'));
    return { data: { id, title: '', description: '', timeAgo: '', severity: 'info', category: 'Operational', isRead: true } };
  },

  markAllAsRead: async (ids?: string[]): Promise<ApiResponse<void>> => {
    if (ids && ids.length > 0) {
      const readIds = getStoredReadIds();
      saveStoredReadIds([...readIds, ...ids.map(String)]);
    }

    if (import.meta.env.VITE_ENABLE_MOCK !== 'true') {
      try {
        await apiClient.post('/notifications/mark-all-read', { ids });
      } catch (err) {
        console.warn('Failed to post mark-all-read to API:', err);
      }
    }

    window.dispatchEvent(new CustomEvent('ovms-notif-read'));
    return { data: undefined };
  },

  deleteNotification: async (id: string): Promise<ApiResponse<void>> => {
    const deletedIds = getStoredDeletedIds();
    deletedIds.push(String(id));
    saveStoredDeletedIds(deletedIds);

    if (import.meta.env.VITE_ENABLE_MOCK !== 'true') {
      try {
        await apiClient.delete(`/notifications/${id}`);
      } catch (err) {
        console.warn('Failed to delete notification on API:', err);
      }
    }

    window.dispatchEvent(new CustomEvent('ovms-notif-read'));
    return { data: undefined };
  },
};
