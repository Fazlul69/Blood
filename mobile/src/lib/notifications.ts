import { isRunningInExpoGo } from "expo";
import { registerDeviceToken } from "../api/devices";

/**
 * Remote push notifications (expo-notifications) were removed from Expo Go in
 * SDK 53 — merely importing the module now throws on Android inside Expo Go,
 * because it registers an internal push-token-refresh listener as a side
 * effect at import time. So we must not import it at all until we're outside
 * Expo Go (i.e. a dev client / EAS build), hence the dynamic import below
 * gated on isRunningInExpoGo() rather than a static top-level import.
 */
export async function registerForPushNotifications() {
  if (isRunningInExpoGo()) {
    console.log("Push notifications require a development build — skipping while running in Expo Go.");
    return;
  }

  try {
    const Notifications = await import("expo-notifications");
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });

    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== "granted") return;
    const { data: expoPushToken } = await Notifications.getExpoPushTokenAsync();
    await registerDeviceToken(expoPushToken);
  } catch (err) {
    console.warn("Push notification registration skipped:", err);
  }
}
