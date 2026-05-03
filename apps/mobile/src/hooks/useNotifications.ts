import { Platform } from "react-native";
import { useCallback, useEffect, useRef } from "react";

let Notifications: typeof import("expo-notifications") | null = null;

// Only load expo-notifications on native platforms (not Expo Go web)
if (Platform.OS !== "web") {
	try {
		Notifications = require("expo-notifications");
		Notifications?.setNotificationHandler({
			handleNotification: async () => ({
				shouldShowAlert: true,
				shouldPlaySound: true,
				shouldSetBadge: true,
				shouldShowBanner: true,
				shouldShowList: true,
			}),
		});
	} catch {
		Notifications = null;
	}
}

export function useNotifications() {
	const notificationListener =
		useRef<import("expo-notifications").EventSubscription | null>(null);
	const responseListener =
		useRef<import("expo-notifications").EventSubscription | null>(null);

	const registerForPush = useCallback(async () => {
		const notifications = Notifications;
		if (!notifications) {
			console.log("[Notifications] Not available in Expo Go");
			return null;
		}

		try {
			// biome-ignore lint/suspicious/noExplicitAny: expo-notifications types are missing status on some versions
			const permissions = (await notifications.getPermissionsAsync()) as any;
			let finalStatus = permissions.status;

			if (finalStatus !== "granted") {
				// biome-ignore lint/suspicious/noExplicitAny: expo-notifications types are missing status on some versions
				const request = (await notifications.requestPermissionsAsync()) as any;
				finalStatus = request.status;
			}

			if (finalStatus !== "granted") return null;

			const token = await notifications.getDevicePushTokenAsync();
			return token;
		} catch (error) {
			console.log("[Notifications] Failed to register:", error);
			return null;
		}
	}, []);

	useEffect(() => {
		const notifications = Notifications;
		if (!notifications) {
			return;
		}

		notificationListener.current =
			notifications.addNotificationReceivedListener((notification) => {
				console.log(
					"[Notification] Received:",
					notification.request.content.title,
				);
			});

		responseListener.current =
			notifications.addNotificationResponseReceivedListener((response) => {
				console.log(
					"[Notification] Response:",
					response.notification.request.content.title,
				);
			});

		return () => {
			if (notificationListener.current) {
				notificationListener.current.remove();
			}
			if (responseListener.current) {
				responseListener.current.remove();
			}
		};
	}, []);

	const scheduleLocalNotification = useCallback(
		async (title: string, body: string, data?: Record<string, unknown>) => {
			const notifications = Notifications;
			if (!notifications) {
				console.log("[Notifications] Local notifications not available");
				return;
			}

			try {
				await notifications.scheduleNotificationAsync({
					content: { title, body, data },
					trigger: null,
				});
			} catch (error) {
				console.log("[Notifications] Failed to schedule:", error);
			}
		},
		[],
	);

	return { registerForPush, scheduleLocalNotification };
}