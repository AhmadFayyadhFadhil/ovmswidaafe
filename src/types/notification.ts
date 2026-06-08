// Notification types
export interface SystemNotification {
  id: string;
  title: string;
  description: string;
  timeAgo: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  category: "Operational" | "Approvals" | "Security" | "Announcements" | "System";
  isRead: boolean;
  metadata?: string;
  userInitiated?: string;
  timestamp?: string;
  actionUrl?: string;
}

export interface NotificationFilter {
  type?: string;
  status?: "read" | "unread";
  severity?: "critical" | "high" | "medium" | "low" | "info";
}

export interface NotificationPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  inAppNotifications: boolean;
  categories: {
    operational: boolean;
    approvals: boolean;
    security: boolean;
    announcements: boolean;
    system: boolean;
  };
}
