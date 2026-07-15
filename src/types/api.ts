export interface ApiResponse<T> {
  data: T;
  message?: string;
  total?: number;
  stats?: {
    total_logs: number;
    security_alerts: number;
    failed_logins: number;
    permissions: number;
    operational: number;
    suspicious: number;
    data_integrity: number;
  };
}

export interface ApiError {
  message: string;
  status?: number;
  errors?: Record<string, string[]>;
}
