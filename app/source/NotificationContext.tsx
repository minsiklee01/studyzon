import * as Notifications from "expo-notifications";
import {
  useEffect,
  useRef,
  useState,
  createContext,
  useContext,
  ReactNode,
} from "react";
import * as Device from "expo-device";
import Constants from "expo-constants";
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
} from "@react-native-firebase/firestore";
import auth from "@react-native-firebase/auth"

const NotificationContext = createContext<{ expoPushToken: string }>({
  expoPushToken: "",
});

interface NotificationProviderProps {
  children: ReactNode;
}
export const NotificationProvider = ({
  children,
}: NotificationProviderProps) => {
  const [expoPushToken, setExpoPushToken] = useState("");
  const notificationListener = useRef<Notifications.EventSubscription>();
  const responseListener = useRef<Notifications.EventSubscription>();

  useEffect(() => {
    registerForPush().then(setExpoPushToken);

    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log("Notification received from context:", notification);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log("Notification response:", response);
      });

    return () => {
      notificationListener.current &&
        Notifications.removeNotificationSubscription(
          notificationListener.current,
        );
      responseListener.current &&
        Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  return (
    <NotificationContext.Provider value={{ expoPushToken }}>
      {children}
    </NotificationContext.Provider>
  );
};

async function registerForPush() {
  const user = auth().currentUser;
  let savedToken = "";
  const db = getFirestore();

  if (!Device.isDevice) throw new Error("Not a physical device.");

  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== "granted") throw new Error("Notification permission denied.");

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;
  if (!projectId) throw new Error("Failed getting project ID");

  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  console.log("Push Token:", token);

  if (user) {
    const docRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(docRef);

    if (token !== docSnap.data()?.notificationToken) {
      await updateDoc(docRef, {
        notificationToken: token,
      });
    }
  } else {
    throw new Error("not logged in");
  }

  return token;
}

export const useNotifications = () => useContext(NotificationContext);
