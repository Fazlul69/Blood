import React, { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RootNavigator } from "./src/navigation/RootNavigator";
import { useAuthStore } from "./src/store/authStore";
import { registerForPushNotifications } from "./src/lib/notifications";

const queryClient = new QueryClient();

function PushRegistration() {
  const token = useAuthStore((s) => s.token);
  useEffect(() => {
    if (token) registerForPushNotifications();
  }, [token]);
  return null;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <PushRegistration />
      <RootNavigator />
      <StatusBar style="auto" />
    </QueryClientProvider>
  );
}
