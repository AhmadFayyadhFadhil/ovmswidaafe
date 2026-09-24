import { apiClient } from "@/services/api/api";

export interface GaTeamApproverItem {
  id: number;
  name: string;
  position?: string | null;
  is_active: boolean;
  sort_order?: number;
}

export const gaTeamApproverService = {
  getAll: async (params?: { active_only?: boolean }) => {
    const res = await apiClient.get("/ga-team-approvers", { params });
    return res.data;
  },

  create: async (data: { name: string; position?: string; is_active?: boolean; sort_order?: number }) => {
    const res = await apiClient.post("/ga-team-approvers", data);
    return res.data;
  },

  update: async (id: number, data: { name: string; position?: string; is_active?: boolean; sort_order?: number }) => {
    const res = await apiClient.put(`/ga-team-approvers/${id}`, data);
    return res.data;
  },

  delete: async (id: number) => {
    const res = await apiClient.delete(`/ga-team-approvers/${id}`);
    return res.data;
  },

  toggleActive: async (id: number) => {
    const res = await apiClient.post(`/ga-team-approvers/${id}/toggle-active`);
    return res.data;
  },
};
