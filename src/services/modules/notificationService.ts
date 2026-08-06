import type { SystemNotification } from '../../types';
import type { ApiResponse } from '../../types/api';
import { apiClient } from '../api/api';

/**
 * Notification Service — 100% SERVER-DRIVEN, ZERO localStorage.
 * All read/delete state is persisted in the backend database.
 */
export const notificationService = {

  /**
   * Fetch all notifications from backend API.
   * Backend already filters out deleted notifications and sets isRead correctly.
   */
  getAll: async (): Promise<ApiResponse<SystemNotification[]>> => {
    try {
      const res = await apiClient.get<{ status: string; data: SystemNotification[]; total: number }>('/notifications');
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
      const res = await apiClient.post('/notifications/mark-read', { id: String(id) });
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
      const res = await apiClient.post('/notifications/mark-all-read', { ids: ids?.map(String) });
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
      // Use POST instead of DELETE for maximum server compatibility
      // (many aaPanel/nginx configs block HTTP DELETE method)
      const res = await apiClient.post(`/notifications/${String(id)}/delete`);
      window.dispatchEvent(new CustomEvent('ovms-notif-read'));
      return { success: res.data?.status === 'success' };
    } catch (err) {
      console.error('Failed to delete notification:', err);
      return { success: false };
    }
  },
};
