import { Stack, useRouter } from "expo-router";
import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { UserProvider, useUser } from "./source/UserContext";
import { NotificationProvider } from "./source/NotificationContext";
import "../styles/global.css";

function InnerLayout() {
  const { user, initializing } = useUser();
  const router = useRouter();

  // Dynamic Routing
  useEffect(() => {
    if (initializing) return;

    if (user && user.emailVerified) {
      router.replace("/home");
      console.log("logged in");
    } else if (!user) {
      console.log("no user");
      router.replace("/");
    }
  }, [user, initializing, router]);

  if (initializing)
    return (
      <View
        style={{
          alignItems: "center",
          justifyContent: "center",
          flex: 1,
        }}
      >
        <ActivityIndicator size="large" />
      </View>
    );

  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Login" }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="user/updateName"
        options={{
          title: "Name",
          headerBackTitle: "Settings",
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="user/updateUsername"
        options={{
          title: "Username",
          headerBackTitle: "Settings",
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="user/addFriend"
        options={{
          title: "Add Friend",
          headerBackTitle: "Friends",
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="user/tutorial"
        options={{
          title: "Tutorial",
          headerBackTitle: "Settings",
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="notifications"
        options={{
          presentation: "modal",
          title: "Notifications",
        }}
      />
    </Stack>
  );
}
export default function RootLayout() {
  return (
    <UserProvider>
      <NotificationProvider>
        <InnerLayout />
      </NotificationProvider>
    </UserProvider>
  );
}
