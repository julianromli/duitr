/**
 * NotificationService - PWA Push Notification Management
 * 
 * Handles browser notification permissions, push subscriptions,
 * and notification display for budget alerts and other events.
 * 
 * Phase 1: Client-side infrastructure only
 * - Permission management
 * - Subscription handling
 * - Test notifications
 * 
 * Phase 2 (Future):
 * - Backend notification scheduling
 * - VAPID key setup
 * - Automated budget alerts
 */

import { supabase } from '@/lib/supabase';
import type {
  NotificationSupportCheck,
  NotificationPermissionState,
  PushSubscriptionJSON,
  CreateNotificationSubscriptionInput,
  NotificationServiceError,
  NotificationErrorCode,
  DuitrNotificationOptions,
} from '@/types/notification';

class NotificationService {
  private readonly NOTIFICATION_TAG = 'duitr-notification';
  
  /**
   * Check if browser supports notifications and push API
   * @returns Support check result with detailed capability flags
   */
  isNotificationSupported(): NotificationSupportCheck {
    const hasNotificationAPI = 'Notification' in window;
    const hasServiceWorker = 'serviceWorker' in navigator;
    const hasPushManager = 'PushManager' in window;
    
    return {
      isSupported: hasNotificationAPI && hasServiceWorker && hasPushManager,
      hasNotificationAPI,
      hasServiceWorker,
      hasPushManager,
    };
  }

  /**
   * Get current notification permission status
   * @returns Current permission state ('default' | 'granted' | 'denied')
   */
  getNotificationPermission(): NotificationPermissionState {
    if (!('Notification' in window)) {
      return 'denied';
    }
    return Notification.permission as NotificationPermissionState;
  }

  /**
   * Request notification permission from user
   * Shows browser's native permission prompt
   * @returns Promise<boolean> - true if granted, false otherwise
   */
  async requestNotificationPermission(): Promise<boolean> {
    const support = this.isNotificationSupported();
    
    if (!support.hasNotificationAPI) {
      console.error('[NotificationService] Notification API not supported');
      throw this.createError(
        'Notification API is not supported in this browser',
        'NOT_SUPPORTED' as NotificationErrorCode
      );
    }

    try {
      const permission = await Notification.requestPermission();
      console.log('[NotificationService] Permission result:', permission);
      return permission === 'granted';
    } catch (error) {
      console.error('[NotificationService] Permission request failed:', error);
      throw this.createError(
        'Failed to request notification permission',
        'PERMISSION_DENIED' as NotificationErrorCode,
        error as Error
      );
    }
  }

  /**
   * Send a test notification to verify setup
   * Useful for testing notification display and permission
   * @param title - Notification title (default: "Duitr Notification")
   * @param body - Notification body (default: test message)
   */
  async sendTestNotification(
    title: string = 'Duitr Notification',
    body: string = 'Test notification from Duitr! Your notification system is working correctly. 🎉'
  ): Promise<void> {
    const permission = this.getNotificationPermission();
    
    if (permission !== 'granted') {
      throw this.createError(
        'Notification permission not granted. Please enable notifications first.',
        'PERMISSION_DENIED' as NotificationErrorCode
      );
    }

    try {
      // Check if we have a service worker registration
      const registration = await this.getServiceWorkerRegistration();
      
      if (registration) {
        // Use service worker to show notification (better for PWA)
        await registration.showNotification(title, {
          body,
          icon: '/pwa-icons/icon-192x192.png',
          badge: '/pwa-icons/icon-96x96.png',
          tag: this.NOTIFICATION_TAG,
          requireInteraction: false,
          vibrate: [200, 100, 200],
          data: {
            url: '/',
            timestamp: Date.now(),
          },
        });
        console.log('[NotificationService] Test notification sent via service worker');
      } else {
        // Fallback to basic notification API
        new Notification(title, {
          body,
          icon: '/pwa-icons/icon-192x192.png',
          tag: this.NOTIFICATION_TAG,
        });
        console.log('[NotificationService] Test notification sent (fallback)');
      }
    } catch (error) {
      console.error('[NotificationService] Failed to send test notification:', error);
      throw this.createError(
        'Failed to send test notification',
        'NOTIFICATION_FAILED' as NotificationErrorCode,
        error as Error
      );
    }
  }

  /**
   * Subscribe user to push notifications
   * Creates push subscription and stores in database
   * @returns Promise<PushSubscription | null> - subscription object or null if failed
   */
  async subscribeToPushNotifications(): Promise<PushSubscription | null> {
    const support = this.isNotificationSupported();
    
    if (!support.isSupported) {
      console.error('[NotificationService] Push notifications not fully supported');
      throw this.createError(
        'Push notifications are not supported in this browser',
        'NOT_SUPPORTED' as NotificationErrorCode
      );
    }

    const permission = this.getNotificationPermission();
    if (permission !== 'granted') {
      console.error('[NotificationService] Permission not granted for push subscription');
      throw this.createError(
        'Notification permission required for push subscription',
        'PERMISSION_DENIED' as NotificationErrorCode
      );
    }

    try {
      const registration = await this.getServiceWorkerRegistration();
      
      if (!registration) {
        throw this.createError(
          'Service worker not available',
          'SERVICE_WORKER_NOT_READY' as NotificationErrorCode
        );
      }

      // Check for existing subscription
      const existingSubscription = await registration.pushManager.getSubscription();
      if (existingSubscription) {
        console.log('[NotificationService] Using existing push subscription');
        await this.savePushSubscription(existingSubscription);
        return existingSubscription;
      }

      // Note: VAPID public key setup will be in Phase 2
      // For now, we create subscription without VAPID (will work for testing)
      console.log('[NotificationService] Creating new push subscription (Phase 1 - no VAPID)');
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: null, // Phase 2: Add VAPID public key here
      });

      console.log('[NotificationService] Push subscription created');
      
      // Save to database
      await this.savePushSubscription(subscription);
      
      return subscription;
    } catch (error) {
      console.error('[NotificationService] Failed to subscribe to push:', error);
      throw this.createError(
        'Failed to create push subscription',
        'SUBSCRIPTION_FAILED' as NotificationErrorCode,
        error as Error
      );
    }
  }

  /**
   * Unsubscribe from push notifications
   * Removes subscription from browser and database
   * @returns Promise<boolean> - true if successfully unsubscribed
   */
  async unsubscribeFromPushNotifications(): Promise<boolean> {
    try {
      const registration = await this.getServiceWorkerRegistration();
      
      if (!registration) {
        console.log('[NotificationService] No service worker, nothing to unsubscribe');
        return true;
      }

      const subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        console.log('[NotificationService] No active subscription found');
        return true;
      }

      // Unsubscribe from browser
      const unsubscribed = await subscription.unsubscribe();
      
      if (unsubscribed) {
        console.log('[NotificationService] Unsubscribed from push notifications');
        // Remove from database
        await this.removePushSubscription(subscription);
      }
      
      return unsubscribed;
    } catch (error) {
      console.error('[NotificationService] Failed to unsubscribe:', error);
      throw this.createError(
        'Failed to unsubscribe from push notifications',
        'UNSUBSCRIBE_FAILED' as NotificationErrorCode,
        error as Error
      );
    }
  }

  /**
   * Check if user is currently subscribed to push
   * @returns Promise<boolean> - true if subscribed
   */
  async isSubscribed(): Promise<boolean> {
    try {
      const registration = await this.getServiceWorkerRegistration();
      
      if (!registration) {
        return false;
      }

      const subscription = await registration.pushManager.getSubscription();
      return subscription !== null;
    } catch (error) {
      console.error('[NotificationService] Error checking subscription status:', error);
      return false;
    }
  }

  /**
   * Get current push subscription
   * @returns Promise<PushSubscription | null>
   */
  async getCurrentSubscription(): Promise<PushSubscription | null> {
    try {
      const registration = await this.getServiceWorkerRegistration();
      
      if (!registration) {
        return null;
      }

      return await registration.pushManager.getSubscription();
    } catch (error) {
      console.error('[NotificationService] Error getting subscription:', error);
      return null;
    }
  }

  /**
   * Show a budget alert notification
   * @param categoryName - Category that exceeded budget
   * @param budgetLimit - Budget limit amount
   * @param projectedSpend - Projected spending
   */
  async showBudgetAlert(
    categoryName: string,
    budgetLimit: number,
    projectedSpend: number
  ): Promise<void> {
    const options: DuitrNotificationOptions = {
      body: `Your ${categoryName} spending is projected to exceed budget by ${Math.abs(projectedSpend - budgetLimit).toFixed(0)}`,
      icon: '/pwa-icons/icon-192x192.png',
      badge: '/pwa-icons/icon-96x96.png',
      tag: `budget-alert-${categoryName}`,
      requireInteraction: true,
      vibrate: [200, 100, 200, 100, 200],
      data: {
        type: 'budget_alert',
        categoryName,
        budgetLimit,
        projectedSpend,
        url: '/budgets',
      },
      actions: [
        { action: 'view', title: 'View Budget' },
        { action: 'dismiss', title: 'Dismiss' },
      ],
    };

    await this.showNotification('Budget Alert! ⚠️', options);
  }

  /**
   * Show a generic notification
   * @param title - Notification title
   * @param options - Notification options
   */
  private async showNotification(
    title: string,
    options: DuitrNotificationOptions
  ): Promise<void> {
    const permission = this.getNotificationPermission();
    
    if (permission !== 'granted') {
      console.error('[NotificationService] Cannot show notification: permission not granted');
      return;
    }

    try {
      const registration = await this.getServiceWorkerRegistration();
      
      if (registration) {
        await registration.showNotification(title, options);
      } else {
        new Notification(title, options);
      }
    } catch (error) {
      console.error('[NotificationService] Failed to show notification:', error);
    }
  }

  /**
   * Get active service worker registration
   * @returns Promise<ServiceWorkerRegistration | null>
   */
  private async getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
    if (!('serviceWorker' in navigator)) {
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      return registration;
    } catch (error) {
      console.error('[NotificationService] Error getting service worker:', error);
      return null;
    }
  }

  /**
   * Save push subscription to database
   * @param subscription - PushSubscription object
   */
  private async savePushSubscription(subscription: PushSubscription): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('[NotificationService] No user logged in, cannot save subscription');
        return;
      }

      const subscriptionJSON = subscription.toJSON() as PushSubscriptionJSON;
      
      if (!subscriptionJSON.keys) {
        throw new Error('Invalid subscription: missing keys');
      }

      const input: CreateNotificationSubscriptionInput = {
        endpoint: subscriptionJSON.endpoint,
        keys: subscriptionJSON.keys,
      };

      // Upsert subscription (update if exists, insert if new)
      const { error } = await supabase
        .from('notification_subscriptions')
        .upsert({
          user_id: user.id,
          endpoint: input.endpoint,
          p256dh_key: input.keys.p256dh,
          auth_key: input.keys.auth,
          is_active: true,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,endpoint',
        });

      if (error) {
        console.error('[NotificationService] Failed to save subscription:', error);
        throw error;
      }

      console.log('[NotificationService] Subscription saved to database');
    } catch (error) {
      console.error('[NotificationService] Error saving subscription:', error);
      // Don't throw - subscription still works locally even if DB save fails
    }
  }

  /**
   * Remove push subscription from database
   * @param subscription - PushSubscription object
   */
  private async removePushSubscription(subscription: PushSubscription): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return;
      }

      const subscriptionJSON = subscription.toJSON() as PushSubscriptionJSON;

      const { error } = await supabase
        .from('notification_subscriptions')
        .delete()
        .eq('user_id', user.id)
        .eq('endpoint', subscriptionJSON.endpoint);

      if (error) {
        console.error('[NotificationService] Failed to remove subscription:', error);
      } else {
        console.log('[NotificationService] Subscription removed from database');
      }
    } catch (error) {
      console.error('[NotificationService] Error removing subscription:', error);
    }
  }

  /**
   * Create typed error
   */
  private createError(
    message: string,
    code: NotificationErrorCode,
    originalError?: Error
  ): NotificationServiceError {
    const error = new Error(message) as NotificationServiceError;
    error.name = 'NotificationServiceError';
    error.code = code;
    error.originalError = originalError;
    return error;
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
export default notificationService;
