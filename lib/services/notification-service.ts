import { createClient } from '@supabase/supabase-js';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  userId: string;
  action?: string;
  data?: any;
  read: boolean;
  createdAt: string;
  expiresAt?: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userRole: string;
  action: string;
  resource: string;
  resourceId: string;
  details: any;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

export interface NotificationSubscription {
  unsubscribe: () => void;
}

export class NotificationService {
  private supabase;
  private channels: Map<string, RealtimeChannel> = new Map();

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  /**
   * Send notification to a specific user
   */
  async sendNotification(
    userId: string,
    notification: Omit<Notification, 'id' | 'userId' | 'read' | 'createdAt'>
  ): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('notifications')
        .insert({
          type: notification.type,
          title: notification.title,
          message: notification.message,
          user_id: userId,
          action: notification.action,
          data: notification.data,
          read: false,
          expires_at: notification.expiresAt
        });

      if (error) {
        console.error('Error sending notification:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error sending notification:', error);
      return false;
    }
  }

  /**
   * Send notification to multiple users
   */
  async sendBulkNotification(
    userIds: string[],
    notification: Omit<Notification, 'id' | 'userId' | 'read' | 'createdAt'>
  ): Promise<boolean> {
    try {
      const notifications = userIds.map(userId => ({
        type: notification.type,
        title: notification.title,
        message: notification.message,
        user_id: userId,
        action: notification.action,
        data: notification.data,
        read: false,
        expires_at: notification.expiresAt
      }));

      const { error } = await this.supabase
        .from('notifications')
        .insert(notifications);

      if (error) {
        console.error('Error sending bulk notification:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error sending bulk notification:', error);
      return false;
    }
  }

  /**
   * Send notification to users by role
   */
  async sendNotificationByRole(
    role: string,
    notification: Omit<Notification, 'id' | 'userId' | 'read' | 'createdAt'>
  ): Promise<boolean> {
    try {
      // Get all users with the specified role
      const { data: users, error: usersError } = await this.supabase
        .from('government_officials')
        .select('id')
        .eq('role', role)
        .eq('is_active', true);

      if (usersError) {
        console.error('Error fetching users by role:', usersError);
        return false;
      }

      if (!users || users.length === 0) {
        return true; // No users with this role
      }

      const userIds = users.map(user => user.id);
      return await this.sendBulkNotification(userIds, notification);
    } catch (error) {
      console.error('Error sending notification by role:', error);
      return false;
    }
  }

  /**
   * Get notifications for a user
   */
  async getNotifications(
    userId: string,
    options: {
      limit?: number;
      unreadOnly?: boolean;
      type?: string;
    } = {}
  ): Promise<Notification[]> {
    try {
      let query = this.supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (options.limit) {
        query = query.limit(options.limit);
      }

      if (options.unreadOnly) {
        query = query.eq('read', false);
      }

      if (options.type) {
        query = query.eq('type', options.type);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching notifications:', error);
        return [];
      }

      return data.map(notification => ({
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        userId: notification.user_id,
        action: notification.action,
        data: notification.data,
        read: notification.read,
        createdAt: notification.created_at,
        expiresAt: notification.expires_at
      }));
    } catch (error) {
      console.error('Error getting notifications:', error);
      return [];
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) {
        console.error('Error marking notification as read:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) {
        console.error('Error marking all notifications as read:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) {
        console.error('Error deleting notification:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error deleting notification:', error);
      return false;
    }
  }

  /**
   * Subscribe to real-time notifications for a user
   */
  subscribeToNotifications(
    userId: string,
    callback: (notification: Notification) => void
  ): NotificationSubscription {
    const channelName = `notifications:${userId}`;
    
    // Unsubscribe from existing channel if it exists
    if (this.channels.has(channelName)) {
      this.channels.get(channelName)?.unsubscribe();
    }

    const channel = this.supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          const notification: Notification = {
            id: payload.new.id,
            type: payload.new.type,
            title: payload.new.title,
            message: payload.new.message,
            userId: payload.new.user_id,
            action: payload.new.action,
            data: payload.new.data,
            read: payload.new.read,
            createdAt: payload.new.created_at,
            expiresAt: payload.new.expires_at
          };
          callback(notification);
        }
      )
      .subscribe();

    this.channels.set(channelName, channel);

    return {
      unsubscribe: () => {
        channel.unsubscribe();
        this.channels.delete(channelName);
      }
    };
  }

  /**
   * Clean up expired notifications
   */
  async cleanupExpiredNotifications(): Promise<number> {
    try {
      const { data, error } = await this.supabase
        .from('notifications')
        .delete()
        .lt('expires_at', new Date().toISOString())
        .not('expires_at', 'is', null);

      if (error) {
        console.error('Error cleaning up expired notifications:', error);
        return 0;
      }

      return data?.length || 0;
    } catch (error) {
      console.error('Error cleaning up expired notifications:', error);
      return 0;
    }
  }

  /**
   * Get notification statistics for a user
   */
  async getNotificationStats(userId: string): Promise<{
    total: number;
    unread: number;
    byType: Record<string, number>;
  }> {
    try {
      const { data, error } = await this.supabase
        .from('notifications')
        .select('type, read')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching notification stats:', error);
        return { total: 0, unread: 0, byType: {} };
      }

      const stats = {
        total: data.length,
        unread: data.filter(n => !n.read).length,
        byType: data.reduce((acc, notification) => {
          acc[notification.type] = (acc[notification.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      };

      return stats;
    } catch (error) {
      console.error('Error getting notification stats:', error);
      return { total: 0, unread: 0, byType: {} };
    }
  }
}

export class AuditService {
  private supabase;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  /**
   * Log an audit event
   */
  async logEvent(
    userId: string,
    userRole: string,
    action: string,
    resource: string,
    resourceId: string,
    details: any,
    metadata?: {
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('audit_logs')
        .insert({
          user_id: userId,
          user_role: userRole,
          action,
          resource,
          resource_id: resourceId,
          details,
          ip_address: metadata?.ipAddress,
          user_agent: metadata?.userAgent
        });

      if (error) {
        console.error('Error logging audit event:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error logging audit event:', error);
      return false;
    }
  }

  /**
   * Get audit logs with filtering
   */
  async getAuditLogs(
    filters: {
      userId?: string;
      userRole?: string;
      action?: string;
      resource?: string;
      resourceId?: string;
      dateFrom?: string;
      dateTo?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<AuditLog[]> {
    try {
      let query = this.supabase
        .from('audit_logs')
        .select('*')
        .order('timestamp', { ascending: false });

      if (filters.userId) {
        query = query.eq('user_id', filters.userId);
      }

      if (filters.userRole) {
        query = query.eq('user_role', filters.userRole);
      }

      if (filters.action) {
        query = query.eq('action', filters.action);
      }

      if (filters.resource) {
        query = query.eq('resource', filters.resource);
      }

      if (filters.resourceId) {
        query = query.eq('resource_id', filters.resourceId);
      }

      if (filters.dateFrom) {
        query = query.gte('timestamp', filters.dateFrom);
      }

      if (filters.dateTo) {
        query = query.lte('timestamp', filters.dateTo);
      }

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching audit logs:', error);
        return [];
      }

      return data.map(log => ({
        id: log.id,
        userId: log.user_id,
        userRole: log.user_role,
        action: log.action,
        resource: log.resource,
        resourceId: log.resource_id,
        details: log.details,
        ipAddress: log.ip_address,
        userAgent: log.user_agent,
        timestamp: log.timestamp
      }));
    } catch (error) {
      console.error('Error getting audit logs:', error);
      return [];
    }
  }

  /**
   * Get audit statistics
   */
  async getAuditStats(
    dateFrom?: string,
    dateTo?: string
  ): Promise<{
    totalEvents: number;
    eventsByAction: Record<string, number>;
    eventsByUser: Record<string, number>;
    eventsByResource: Record<string, number>;
  }> {
    try {
      let query = this.supabase
        .from('audit_logs')
        .select('action, user_id, resource');

      if (dateFrom) {
        query = query.gte('timestamp', dateFrom);
      }

      if (dateTo) {
        query = query.lte('timestamp', dateTo);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching audit stats:', error);
        return {
          totalEvents: 0,
          eventsByAction: {},
          eventsByUser: {},
          eventsByResource: {}
        };
      }

      const stats = {
        totalEvents: data.length,
        eventsByAction: data.reduce((acc, log) => {
          acc[log.action] = (acc[log.action] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        eventsByUser: data.reduce((acc, log) => {
          acc[log.user_id] = (acc[log.user_id] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        eventsByResource: data.reduce((acc, log) => {
          acc[log.resource] = (acc[log.resource] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      };

      return stats;
    } catch (error) {
      console.error('Error getting audit stats:', error);
      return {
        totalEvents: 0,
        eventsByAction: {},
        eventsByUser: {},
        eventsByResource: {}
      };
    }
  }

  /**
   * Export audit logs to CSV
   */
  async exportAuditLogs(
    filters: {
      userId?: string;
      userRole?: string;
      action?: string;
      resource?: string;
      dateFrom?: string;
      dateTo?: string;
    } = {}
  ): Promise<string> {
    try {
      const logs = await this.getAuditLogs(filters);

      const headers = [
        'ID',
        'User ID',
        'User Role',
        'Action',
        'Resource',
        'Resource ID',
        'Details',
        'IP Address',
        'User Agent',
        'Timestamp'
      ];

      const csvRows = [
        headers.join(','),
        ...logs.map(log => [
          log.id,
          log.userId,
          log.userRole,
          log.action,
          log.resource,
          log.resourceId,
          JSON.stringify(log.details).replace(/"/g, '""'),
          log.ipAddress || '',
          log.userAgent || '',
          log.timestamp
        ].map(field => `"${field}"`).join(','))
      ];

      return csvRows.join('\n');
    } catch (error) {
      console.error('Error exporting audit logs:', error);
      return '';
    }
  }
}

export const notificationService = new NotificationService();
export const auditService = new AuditService();

// Clean up expired notifications every hour
setInterval(() => {
  notificationService.cleanupExpiredNotifications();
}, 60 * 60 * 1000);

