import { useEffect } from "react";
import { AppState } from "react-native";
import { Tabs } from "expo-router";
import {
  getFirestore,
  doc,
  updateDoc,
  serverTimestamp,
} from "@react-native-firebase/firestore";
import { useUser } from "../source/UserContext";

export default function Layout() {
  const db = getFirestore();
  const { user, firestoreUser } = useUser();

  // Listen for app foreground events and update Firestore
  useEffect(() => {
    const appState = { current: AppState.currentState };
    const subscription = AppState.addEventListener(
      "change",
      async (nextAppState) => {

        if (
          appState.current.match(/inactive|background/) &&
          nextAppState === "active"
        ) {
          if (user) {
            const lastActive = Number(firestoreUser?.lastActive) || 0;
            const now = Date.now();
            if (now - lastActive >= 5 * 60 * 1000) {
              const userRef = doc(db, "users", user.uid);
              await updateDoc(userRef, {
                lastActive: serverTimestamp(),
              });
            }
          }
        }
        appState.current = nextAppState;
      },
    );

    return () => {
      subscription.remove();
    };
  }, [user]);
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: "blue" }}>
      <Tabs.Screen name="home" options={{ title: "Rooms" }} />
      <Tabs.Screen name="friends" options={{ title: "Friends" }} />
      <Tabs.Screen name="settings" options={{ title: "Settings" }} />
      <Tabs.Screen
        name="room [roomNumber]"
        options={{ href: "/room/[roomNumber]", title: "room [roomNumber]" }}
      />
    </Tabs>
  );
}
