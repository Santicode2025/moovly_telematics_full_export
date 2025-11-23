import webpush from 'web-push';

// VAPID keys for web push - MUST be set via environment variables
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@moovly.delivery';

// Validate required VAPID keys
if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
  console.error('⚠️  VAPID keys not configured! Push notifications will not work.');
  console.error('Generate VAPID keys using: npx web-push generate-vapid-keys');
  console.error('Set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY environment variables');
}

// Configure web-push only if keys are available
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    VAPID_SUBJECT,
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
}

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  data?: any;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  tag?: string;
  requireInteraction?: boolean;
  silent?: boolean;
  timestamp?: number;
}

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export class PushNotificationService {
  static getVapidPublicKey(): string | null {
    return VAPID_PUBLIC_KEY || null;
  }

  static async sendNotification(
    subscription: PushSubscription,
    payload: NotificationPayload
  ): Promise<boolean> {
    try {
      const notificationPayload = JSON.stringify({
        title: payload.title,
        body: payload.body,
        icon: payload.icon || '/icons/moovly-icon-192.png',
        badge: payload.badge || '/icons/moovly-badge-72.png',
        image: payload.image,
        data: payload.data || {},
        actions: payload.actions || [],
        tag: payload.tag || 'moovly-notification',
        requireInteraction: payload.requireInteraction || false,
        silent: payload.silent || false,
        timestamp: payload.timestamp || Date.now(),
      });

      await webpush.sendNotification(subscription, notificationPayload, {
        TTL: 60 * 60 * 24, // 24 hours
      });

      return true;
    } catch (error: any) {
      console.error('Failed to send push notification:', error);
      
      // Handle specific error cases
      if (error.statusCode === 410) {
        console.log('Subscription expired, should remove from database');
        // In a real app, you'd remove this subscription from the database
        return false;
      }
      
      return false;
    }
  }

  static async sendBulkNotifications(
    subscriptions: PushSubscription[],
    payload: NotificationPayload
  ): Promise<{ successful: number; failed: number }> {
    let successful = 0;
    let failed = 0;

    const promises = subscriptions.map(async (subscription) => {
      const success = await this.sendNotification(subscription, payload);
      if (success) {
        successful++;
      } else {
        failed++;
      }
    });

    await Promise.allSettled(promises);

    return { successful, failed };
  }

  // Predefined notification templates for common scenarios
  static createJobCreatedNotification(jobData: any): NotificationPayload {
    return {
      title: '📦 New Job Available',
      body: `Job #${jobData.jobNumber}: ${jobData.customerName} - ${jobData.priority || 'medium'} priority`,
      icon: '/icons/job-available.png',
      data: {
        type: 'job_created',
        jobNumber: jobData.jobNumber,
        customerName: jobData.customerName,
        priority: jobData.priority || 'medium',
        pickupAddress: jobData.pickupAddress,
        deliveryAddress: jobData.deliveryAddress,
        url: '/mobile/jobs'
      },
      actions: [
        {
          action: 'view_jobs',
          title: 'View Jobs',
          icon: '/icons/view-jobs.png'
        },
        {
          action: 'dismiss',
          title: 'Dismiss',
          icon: '/icons/dismiss.png'
        }
      ],
      tag: `new-job-${jobData.jobNumber}`,
      requireInteraction: false
    };
  }

  static createJobAssignedNotification(jobData: any): NotificationPayload {
    return {
      title: '🚚 New Job Assigned',
      body: `Job #${jobData.jobNumber}: ${jobData.customerName}`,
      icon: '/icons/job-assigned.png',
      data: {
        type: 'job_assigned',
        jobId: jobData.id,
        jobNumber: jobData.jobNumber,
        url: `/mobile/jobs/${jobData.id}`
      },
      actions: [
        {
          action: 'view_job',
          title: 'View Job',
          icon: '/icons/view-job.png'
        },
        {
          action: 'dismiss',
          title: 'Dismiss',
          icon: '/icons/dismiss.png'
        }
      ],
      tag: `job-${jobData.id}`,
      requireInteraction: true
    };
  }

  static createJobUpdatedNotification(jobData: any, updateType: string): NotificationPayload {
    const updateMessages = {
      'address_changed': `Address updated for Job #${jobData.jobNumber}`,
      'time_changed': `Schedule updated for Job #${jobData.jobNumber}`,
      'priority_changed': `Priority changed to ${jobData.priority} for Job #${jobData.jobNumber}`,
      'cancelled': `Job #${jobData.jobNumber} has been cancelled`,
      'rescheduled': `Job #${jobData.jobNumber} has been rescheduled`
    };

    return {
      title: '📝 Job Update',
      body: updateMessages[updateType as keyof typeof updateMessages] || `Job #${jobData.jobNumber} has been updated`,
      data: {
        type: 'job_updated',
        jobId: jobData.id,
        jobNumber: jobData.jobNumber,
        updateType,
        url: `/mobile/jobs/${jobData.id}`
      },
      actions: [
        {
          action: 'view_job',
          title: 'View Job',
          icon: '/icons/view-job.png'
        }
      ],
      tag: `job-update-${jobData.id}`
    };
  }

  static createRouteOptimizedNotification(routeData: any): NotificationPayload {
    return {
      title: '🛣️ Route Optimized',
      body: `Your route has been optimized with ${routeData.jobCount} jobs`,
      data: {
        type: 'route_optimized',
        routeId: routeData.id,
        jobCount: routeData.jobCount,
        url: '/mobile/route'
      },
      actions: [
        {
          action: 'view_route',
          title: 'View Route',
          icon: '/icons/view-route.png'
        }
      ],
      tag: 'route-optimized'
    };
  }

  static createBreakReminderNotification(breakDuration: number): NotificationPayload {
    return {
      title: '☕ Break Reminder',
      body: `You've been on break for ${breakDuration} minutes. Don't forget to clock back in!`,
      data: {
        type: 'break_reminder',
        breakDuration,
        url: '/mobile/status'
      },
      actions: [
        {
          action: 'end_break',
          title: 'End Break',
          icon: '/icons/end-break.png'
        },
        {
          action: 'extend_break',
          title: 'Extend Break',
          icon: '/icons/extend-break.png'
        }
      ],
      tag: 'break-reminder',
      requireInteraction: true
    };
  }

  static createUrgentJobNotification(jobData: any): NotificationPayload {
    return {
      title: '🚨 Urgent Job Assignment',
      body: `HIGH PRIORITY: Job #${jobData.jobNumber} - ${jobData.customerName}`,
      data: {
        type: 'urgent_job',
        jobId: jobData.id,
        jobNumber: jobData.jobNumber,
        priority: jobData.priority,
        url: `/mobile/jobs/${jobData.id}`
      },
      actions: [
        {
          action: 'view_job',
          title: 'View Job',
          icon: '/icons/view-job.png'
        },
        {
          action: 'call_dispatcher',
          title: 'Call Dispatch',
          icon: '/icons/call.png'
        }
      ],
      tag: `urgent-job-${jobData.id}`,
      requireInteraction: true
    };
  }

  static createSystemAlertNotification(alertData: any): NotificationPayload {
    return {
      title: '⚠️ System Alert',
      body: alertData.message,
      data: {
        type: 'system_alert',
        alertId: alertData.id,
        severity: alertData.severity,
        url: '/mobile/alerts'
      },
      actions: [
        {
          action: 'view_alert',
          title: 'View Alert',
          icon: '/icons/view-alert.png'
        }
      ],
      tag: `alert-${alertData.id}`,
      requireInteraction: alertData.severity === 'high'
    };
  }
}