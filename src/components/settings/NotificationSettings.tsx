/**
 * NotificationSettings Component
 * 
 * UI for managing PWA push notification preferences.
 * Allows users to enable/disable notifications, request permissions,
 * and test notification functionality.
 * 
 * Phase 1: Basic permission and testing UI
 * Phase 2: Notification scheduling preferences
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, BellOff, TestTube, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { notificationService } from '@/services/notificationService';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import type { NotificationPermissionState } from '@/types/notification';

/**
 * NotificationSettings Component
 */
const NotificationSettings: React.FC = () => {
  const { t } = useTranslation();
  const { toast } = useToast();

  // State
  const [permission, setPermission] = useState<NotificationPermissionState>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isTestingNotification, setIsTestingNotification] = useState(false);
  const [supportCheck, setSupportCheck] = useState({
    isSupported: false,
    hasNotificationAPI: false,
    hasServiceWorker: false,
    hasPushManager: false,
  });

  /**
   * Check notification support and current state on mount
   */
  useEffect(() => {
    checkNotificationStatus();
  }, []);

  /**
   * Check current notification support and subscription status
   */
  const checkNotificationStatus = async () => {
    try {
      // Check browser support
      const support = notificationService.isNotificationSupported();
      setSupportCheck(support);

      // Check permission
      const currentPermission = notificationService.getNotificationPermission();
      setPermission(currentPermission);

      // Check subscription status
      if (support.isSupported && currentPermission === 'granted') {
        const subscribed = await notificationService.isSubscribed();
        setIsSubscribed(subscribed);
      }
    } catch (error) {
      console.error('[NotificationSettings] Error checking status:', error);
    }
  };

  /**
   * Handle enable/disable notifications toggle
   */
  const handleToggleNotifications = async (enabled: boolean) => {
    setIsLoading(true);

    try {
      if (enabled) {
        // Enable notifications - request permission first
        const permissionGranted = await notificationService.requestNotificationPermission();
        
        if (!permissionGranted) {
          toast({
            title: t('settings.notifications.permissionDenied', 'Permission Denied'),
            description: t(
              'settings.notifications.permissionDeniedDesc',
              'Please enable notifications in your browser settings.'
            ),
            variant: 'destructive',
          });
          setPermission('denied');
          setIsSubscribed(false);
          return;
        }

        setPermission('granted');

        // Subscribe to push notifications
        const subscription = await notificationService.subscribeToPushNotifications();
        
        if (subscription) {
          setIsSubscribed(true);
          toast({
            title: t('settings.notifications.enabled', 'Notifications Enabled'),
            description: t(
              'settings.notifications.enabledDesc',
              'You will receive budget alerts and updates.'
            ),
          });
        }
      } else {
        // Disable notifications
        const unsubscribed = await notificationService.unsubscribeFromPushNotifications();
        
        if (unsubscribed) {
          setIsSubscribed(false);
          toast({
            title: t('settings.notifications.disabled', 'Notifications Disabled'),
            description: t(
              'settings.notifications.disabledDesc',
              'You will no longer receive notifications.'
            ),
          });
        }
      }
    } catch (error) {
      console.error('[NotificationSettings] Toggle error:', error);
      toast({
        title: t('common.error', 'Error'),
        description: error instanceof Error ? error.message : t('common.unknownError', 'Unknown error occurred'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle test notification button
   */
  const handleTestNotification = async () => {
    setIsTestingNotification(true);

    try {
      await notificationService.sendTestNotification(
        t('settings.notifications.testTitle', 'Test Notification'),
        t('settings.notifications.testBody', 'This is a test notification from Duitr. Your notification system is working! 🎉')
      );

      toast({
        title: t('settings.notifications.testSent', 'Test Sent'),
        description: t(
          'settings.notifications.testSentDesc',
          'Check your notification area for the test notification.'
        ),
      });
    } catch (error) {
      console.error('[NotificationSettings] Test notification error:', error);
      toast({
        title: t('common.error', 'Error'),
        description: error instanceof Error ? error.message : t('common.unknownError', 'Unknown error occurred'),
        variant: 'destructive',
      });
    } finally {
      setIsTestingNotification(false);
    }
  };

  /**
   * Get permission status color and icon
   */
  const getPermissionStatusUI = () => {
    switch (permission) {
      case 'granted':
        return {
          icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
          text: t('settings.notifications.permissionGranted', 'Granted'),
          variant: 'default' as const,
        };
      case 'denied':
        return {
          icon: <XCircle className="h-5 w-5 text-red-500" />,
          text: t('settings.notifications.permissionDenied', 'Denied'),
          variant: 'destructive' as const,
        };
      default:
        return {
          icon: <AlertCircle className="h-5 w-5 text-yellow-500" />,
          text: t('settings.notifications.permissionDefault', 'Not Set'),
          variant: 'default' as const,
        };
    }
  };

  const permissionStatus = getPermissionStatusUI();

  // Browser doesn't support notifications
  if (!supportCheck.hasNotificationAPI) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5" />
            {t('settings.notifications.title', 'Notifications')}
          </CardTitle>
          <CardDescription>
            {t('settings.notifications.description', 'Manage your notification preferences')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertTitle>{t('settings.notifications.notSupported', 'Not Supported')}</AlertTitle>
            <AlertDescription>
              {t(
                'settings.notifications.notSupportedDesc',
                'Your browser does not support notifications. Please use a modern browser like Chrome, Firefox, or Safari.'
              )}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isSubscribed ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
          {t('settings.notifications.title', 'Notifications')}
        </CardTitle>
        <CardDescription>
          {t('settings.notifications.description', 'Manage your notification preferences')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Support Status Alert */}
        {!supportCheck.isSupported && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{t('settings.notifications.limitedSupport', 'Limited Support')}</AlertTitle>
            <AlertDescription>
              {t(
                'settings.notifications.limitedSupportDesc',
                'Some notification features may not work properly in your browser.'
              )}
              <ul className="mt-2 list-disc list-inside text-sm">
                {!supportCheck.hasServiceWorker && (
                  <li>{t('settings.notifications.noServiceWorker', 'Service Worker not available')}</li>
                )}
                {!supportCheck.hasPushManager && (
                  <li>{t('settings.notifications.noPushManager', 'Push Manager not available')}</li>
                )}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Permission Status */}
        <div className="space-y-2">
          <Label>{t('settings.notifications.permissionStatus', 'Permission Status')}</Label>
          <div className="flex items-center gap-2 p-3 rounded-lg border bg-muted/50">
            {permissionStatus.icon}
            <span className="text-sm font-medium">{permissionStatus.text}</span>
          </div>
        </div>

        {/* Enable/Disable Toggle */}
        <div className="flex items-center justify-between space-x-2">
          <div className="space-y-0.5">
            <Label htmlFor="notifications-enabled">
              {t('settings.notifications.enableNotifications', 'Enable Notifications')}
            </Label>
            <p className="text-sm text-muted-foreground">
              {t(
                'settings.notifications.enableNotificationsDesc',
                'Receive alerts for budget warnings and important updates'
              )}
            </p>
          </div>
          <Switch
            id="notifications-enabled"
            checked={isSubscribed && permission === 'granted'}
            onCheckedChange={handleToggleNotifications}
            disabled={isLoading || !supportCheck.isSupported}
          />
        </div>

        {/* Test Notification Button */}
        {isSubscribed && permission === 'granted' && (
          <div className="pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleTestNotification}
              disabled={isTestingNotification}
              className="w-full"
            >
              <TestTube className="h-4 w-4 mr-2" />
              {isTestingNotification
                ? t('settings.notifications.sending', 'Sending...')
                : t('settings.notifications.testNotification', 'Send Test Notification')}
            </Button>
          </div>
        )}

        {/* Information Alert */}
        {permission === 'denied' && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{t('settings.notifications.permissionDenied', 'Permission Denied')}</AlertTitle>
            <AlertDescription>
              {t(
                'settings.notifications.permissionDeniedHelp',
                'To enable notifications, you need to allow them in your browser settings. Look for the notification icon in your address bar or browser settings.'
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Phase 1 Notice */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t('settings.notifications.phase1Title', 'Early Preview')}</AlertTitle>
          <AlertDescription>
            {t(
              'settings.notifications.phase1Desc',
              'Notification system is in early preview. Automated budget alerts will be available in a future update.'
            )}
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default NotificationSettings;
