/**
 * Notification Type Definitions
 * 
 * Types for PWA notification system including push subscriptions,
 * notification permissions, and database storage.
 */

/**
 * Push subscription data stored in database
 */
export interface NotificationSubscription {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh_key: string;
  auth_key: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

/**
 * Input for creating notification subscription
 */
export interface CreateNotificationSubscriptionInput {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

/**
 * Notification permission states
 */
export type NotificationPermissionState = 'default' | 'granted' | 'denied';

/**
 * Notification support check result
 */
export interface NotificationSupportCheck {
  isSupported: boolean;
  hasPushManager: boolean;
  hasServiceWorker: boolean;
  hasNotificationAPI: boolean;
}

/**
 * Push subscription JSON format
 */
export interface PushSubscriptionJSON {
  endpoint: string;
  expirationTime: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
}

/**
 * Notification action button
 */
export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

/**
 * Notification options for displaying notifications
 */
export interface DuitrNotificationOptions extends NotificationOptions {
  tag?: string;
  renotify?: boolean;
  requireInteraction?: boolean;
  data?: {
    url?: string;
    [key: string]: any;
  };
}

/**
 * Budget alert notification data
 */
export interface BudgetAlertNotificationData {
  type: 'budget_alert';
  categoryId: number;
  categoryName: string;
  budgetLimit: number;
  projectedSpend: number;
  riskLevel: 'low' | 'medium' | 'high';
  url: string;
}

/**
 * Notification service error types
 */
export class NotificationServiceError extends Error {
  constructor(
    message: string,
    public code: NotificationErrorCode,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'NotificationServiceError';
  }
}

export enum NotificationErrorCode {
  NOT_SUPPORTED = 'NOT_SUPPORTED',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  SUBSCRIPTION_FAILED = 'SUBSCRIPTION_FAILED',
  UNSUBSCRIBE_FAILED = 'UNSUBSCRIBE_FAILED',
  NOTIFICATION_FAILED = 'NOTIFICATION_FAILED',
  SERVICE_WORKER_NOT_READY = 'SERVICE_WORKER_NOT_READY',
}
