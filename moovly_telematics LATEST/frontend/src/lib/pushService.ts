// Push notification service for driver notifications
// Using Firebase Cloud Messaging integration

export interface PushMessage {
  title: string;
  body: string;
  data?: any;
}

export async function sendPushNotification(driverId: string | number, message: PushMessage) {
  try {
    // Use Firebase FCM through secure API endpoint
    const response = await fetch("/api/notifications/push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        driverId,
        notification: {
          title: message.title,
          body: message.body
        },
        data: message.data || {}
      })
    });

    if (!response.ok) {
      throw new Error(`Push notification failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Push notification error:", error);
    throw error;
  }
}