import type { SystemNotification } from '../../types';
import type { ApiResponse } from '../../types/api';
import { apiClient } from '../api/api';

const cleanId = (id: string | number): string => {
  return String(id).trim();
};

/**
 * Notification Service — 100% SERVER-DRIVEN, ZERO localStorage.
 * All read/delete state is persisted in the backend database.
 */
export const notificationService = {

  /**
   * Fetch all notifications from backend API.
   * Uses cache-buster timestamp query param to guarantee fresh data on every request.
   */
  getAll: async (): Promise<ApiResponse<SystemNotification[]>> => {
    try {
      const res = await apiClient.get<{ status: string; data: SystemNotification[]; total: number }>(
        `/notifications?_t=${Date.now()}`,
        {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          }
        }
      );
      if (res.data && Array.isArray(res.data.data)) {
        return {
          data: res.data.data,
          total: res.data.total || res.data.data.length,
        };
      }
    } catch (err) {
      console.error('Failed to fetch notifications from API:', err);
    }
    return { data: [], total: 0 };
  },

  /**
   * Mark a single notification as read on the server.
   */
  markAsRead: async (id: string): Promise<{ success: boolean }> => {
    try {
      const cid = cleanId(id);
      const res = await apiClient.post('/notifications/mark-read', { id: cid });
      window.dispatchEvent(new CustomEvent('ovms-notif-read'));
      return { success: res.data?.status === 'success' };
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
      return { success: false };
    }
  },

  /**
   * Mark all notifications as read on the server.
   */
  markAllAsRead: async (ids?: string[]): Promise<{ success: boolean }> => {
    try {
      const cleaned = ids?.map(cleanId);
      const res = await apiClient.post('/notifications/mark-all-read', { ids: cleaned });
      window.dispatchEvent(new CustomEvent('ovms-notif-read'));
      return { success: res.data?.status === 'success' };
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
      return { success: false };
    }
  },

  /**
   * Delete (hide) a notification permanently on the server.
   */
  deleteNotification: async (id: string): Promise<{ success: boolean }> => {
    try {
      const cid = cleanId(id);
      const res = await apiClient.post(`/notifications/${cid}/delete`);
      window.dispatchEvent(new CustomEvent('ovms-notif-read'));
      return { success: res.data?.status === 'success' };
    } catch (err) {
      console.error('Failed to delete notification:', err);
      return { success: false };
    }
  },

  /**
   * Delete (hide) all notifications permanently on the server.
   */
  deleteAllNotifications: async (ids?: string[]): Promise<{ success: boolean }> => {
    try {
      const cleaned = ids?.map(cleanId);
      const res = await apiClient.post('/notifications/delete-all', { ids: cleaned });
      window.dispatchEvent(new CustomEvent('ovms-notif-read'));
      return { success: res.data?.status === 'success' };
    } catch (err) {
      console.error('Failed to delete all notifications:', err);
      return { success: false };
    }
  },
};
