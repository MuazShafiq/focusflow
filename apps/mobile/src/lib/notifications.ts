import Constants, { ExecutionEnvironment } from "expo-constants";
import { Platform } from "react-native";
import type { ScheduleBlock } from "../types";

export const schedulePlanNotifications = async (
  blocks: ScheduleBlock[],
): Promise<void> => {
  if (
    Platform.OS === "web" ||
    Constants.executionEnvironment === ExecutionEnvironment.StoreClient
  ) {
    return;
  }

  const Notifications = await import("expo-notifications");
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  const currentPermission = await Notifications.getPermissionsAsync();
  const permission =
    currentPermission.status === "granted"
      ? currentPermission
      : await Notifications.requestPermissionsAsync();
  if (permission.status !== "granted") return;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("schedule", {
      name: "Schedule reminders",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  await Notifications.cancelAllScheduledNotificationsAsync();
  const fiveMinutesFromNow = Date.now() + 5 * 60_000;
  const upcoming = blocks
    .filter((block) => new Date(block.startAt).getTime() > fiveMinutesFromNow)
    .slice(0, 40);

  await Promise.all(
    upcoming.map((block) => {
      const reminder = new Date(
        new Date(block.startAt).getTime() - 5 * 60_000,
      );
      return Notifications.scheduleNotificationAsync({
        content: {
          title: `${block.title} starts in 5 minutes`,
          body: block.rationale,
          data: { blockId: block.id },
          sound: "default",
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: reminder,
          channelId: "schedule",
        },
      });
    }),
  );
};
