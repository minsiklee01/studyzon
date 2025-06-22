import { useEffect, useState, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  Platform,
  Linking,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useNavigation } from "expo-router";
import {
  getFirestore,
  query,
  FirebaseFirestoreTypes,
  doc,
  deleteDoc,
  updateDoc,
  setDoc,
  collection,
  onSnapshot,
  serverTimestamp,
} from "@react-native-firebase/firestore";
import { useUser } from "../source/UserContext";

import { EventEmitter } from "expo-modules-core";
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import * as BackgroundTask from "expo-background-task";

type User = {
  createdAt: FirebaseFirestoreTypes.Timestamp;
  email: string;
  name: string;
  profilePic: string;
  totalTime: number;
  uid: string;
};

type GeofenceEventData = {
  eventType: Location.GeofencingEventType;
  region: Location.LocationRegion;
};

export default function Room() {
  const db = getFirestore();
  const [locationAccess, setLocationAccess] = useState(false);
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null,
  );
  const geofenceStateRef = useRef(0);
  const [geofenceState, setGeofenceState] = useState(0);
  const [loadingAction, setLoadingAction] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [isInRoom, setIsInRoom] = useState(false);
  const isInRoomRef = useRef(false);
  const { roomNumber } = useLocalSearchParams();
  const navigation = useNavigation();
  const { firestoreUser, user } = useUser();

  const LOCATION_TASK_NAME = "LOCATION_GEOFENCE_TASK";

  const geofenceEventEmitter = new EventEmitter<{
    geofenceEvent: (data: GeofenceEventData) => void;
  }>();

  TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
    if (error) {
      console.error(error);
      return;
    }
    if (data) {
      const { eventType, region } = data as {
        eventType: Location.GeofencingEventType;
        region: Location.LocationRegion;
      };
      if (eventType === Location.GeofencingEventType.Enter) {
        console.log("Entered region: ", region);
        setGeofenceState(1);
      } else if (eventType === Location.GeofencingEventType.Exit) {
        console.log("Exited region: ", region);
        setGeofenceState(-1);
        stopBackgroundUpdate();
        unregisterBackgroundTaskAsync();
        if (isInRoom) {
          leaveRoom();
          Alert.alert(
            "Too far from the library",
            "Looks like you left library, now leaving room.",
            [
              {
                text: "Close",
                onPress: () => console.log("Cancel Pressed"),
                style: "cancel",
              },
            ],
            { cancelable: false },
          );
        }
      }
      console.log("Geofencing event:", eventType, region);
      geofenceEventEmitter.emit("geofenceEvent", { eventType, region });
    }
  });

  const BACKGROUND_TASK_IDENTIFIER = "updateLastActive";
  TaskManager.defineTask(BACKGROUND_TASK_IDENTIFIER, async () => {
    try {
      const userRef = doc(db, "users", user!.uid);
      await updateDoc(userRef, {
        lastActive: serverTimestamp(),
      });
      console.log("update last active from background task");
    } catch (error) {
      console.error("Failed to update lastActive:", error);
      return BackgroundTask.BackgroundTaskResult.Failed;
    }
    return BackgroundTask.BackgroundTaskResult.Success;
  });
  async function registerBackgroundTaskAsync() {
    return BackgroundTask.registerTaskAsync(BACKGROUND_TASK_IDENTIFIER);
  }
  async function unregisterBackgroundTaskAsync() {
    return BackgroundTask.unregisterTaskAsync(BACKGROUND_TASK_IDENTIFIER);
  }

  const grantPermission = async () => {
    let { status } = await Location.requestBackgroundPermissionsAsync();
    if (status !== "granted") {
      console.log("Permission to access location was denied");
      setLocationAccess(false);
      return;
    } else {
      setLocationAccess(true);
      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);
      console.log(location);
    }
  };

  const startBackgroundUpdate = async () => {
    // Don't track position if permission is not granted
    if (!locationAccess) {
      console.log("location tracking denied");
      Alert.alert(
        "Need Location Permission",
        "Please allow in the settings",
        [
          {
            text: "Cancel",
            onPress: () => console.log("Cancel Pressed"),
            style: "cancel",
          },
          {
            text: "Settings",
            onPress: () => {
              if (Platform.OS === "ios") {
                Linking.openURL("app-settings://LOCATION_SERVICES");
              } else {
                Linking.openSettings();
              }
            },
          },
        ],
        { cancelable: false },
      );
      return;
    }
    // Make sure the task is defined otherwise do not start tracking
    const isTaskDefined = await TaskManager.isTaskDefined(LOCATION_TASK_NAME);
    if (!isTaskDefined) {
      console.log("Task is not defined");
      return;
    }

    try {
      await Location.startGeofencingAsync(LOCATION_TASK_NAME, [
        {
          identifier: "library",
          latitude: 40.4562,
          longitude: -85.49709,
          notifyOnEnter: true,
          notifyOnExit: true,
          // DEBUG
          radius: 500,
          state: geofenceState,
        },
      ]);
      const hasStarted =
        await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
      console.log("Geofence started:", hasStarted);
    } catch (e) {
      console.error(e);
    }
  };

  // Stop location tracking in background
  const stopBackgroundUpdate = async () => {
    const hasStarted =
      await Location.hasStartedGeofencingAsync(LOCATION_TASK_NAME);
    if (hasStarted) {
      await Location.stopGeofencingAsync(LOCATION_TASK_NAME);
      console.log("Geofence stopped");
    }
  };

  const waitForGeofenceResult = (timeout = 10000) =>
    new Promise<number>((resolve, reject) => {
      const interval = setInterval(() => {
        console.log("Waiting for geofence result...", geofenceStateRef.current);
        if (geofenceStateRef.current !== 0) {
          clearInterval(interval);
          clearTimeout(timeoutID);
          resolve(geofenceStateRef.current);
        }
      }, 500);

      const timeoutID = setTimeout(() => {
        clearInterval(interval);
        setLoadingAction(false);
        Alert.alert(
          "Unable to join",
          "Sorry, join failed. Please try again later.",
          [
            {
              text: "Close",
              onPress: () => console.log("Cancel Pressed"),
              style: "cancel",
            },
          ],
          { cancelable: false },
        );
        reject(new Error("Timeout"));
      }, timeout);
    });

  const getUsers = () => {
    try {
      const roomId = Array.isArray(roomNumber) ? roomNumber[0] : roomNumber;
      const roomsQuery = query(collection(db, "rooms", roomId, "users"));

      return onSnapshot(roomsQuery, async (querySnapshot) => {
        try {
          const usersArray: User[] = await Promise.all(
            querySnapshot.docs.map(async (docSnapshot) => {
              const userRef = docSnapshot.data().user;
              const userDoc = await userRef.get();
              return userDoc.data() as User;
            }),
          );

          if (user) {
            const userIsInRoom = usersArray.some((u) => u.uid === user.uid);
            setIsInRoom(userIsInRoom);
          }

          setUsers(usersArray);
        } catch (innerErr) {
          console.error(innerErr);
        }
      });
    } catch (err) {
      console.error(err);
    }
  };

  const joinRoom = async () => {
    const roomId = Array.isArray(roomNumber) ? roomNumber[0] : roomNumber;
    setLoadingAction(true);
    try {
      const hasStarted =
        await Location.hasStartedGeofencingAsync(LOCATION_TASK_NAME);
      if (!hasStarted) {
        await startBackgroundUpdate();
      }
      const result = await waitForGeofenceResult();
      if (result === 1) {
        // update room doc
        await setDoc(doc(db, "rooms", roomId, "users", user!.uid), {
          user: doc(db, "users", user!.uid),
        });
        // leave other room
        if (
          firestoreUser?.currentRoomId !== "" &&
          firestoreUser?.currentRoomId !== roomId
        ) {
          if (!firestoreUser?.currentRoomId) return "";
          await deleteDoc(
            doc(db, "rooms", firestoreUser?.currentRoomId!, "users", user!.uid),
          );
        }
        // update user doc
        const userRef = doc(db, "users", user!.uid);
        await updateDoc(userRef, {
          currentRoomId: roomId,
          lastActive: serverTimestamp(),
        });
        // run background task: update lastActive
        registerBackgroundTaskAsync();
      } else if (result === -1) {
        Alert.alert(
          "Not located near the library",
          "You must be inside the library to join.",
          [
            {
              text: "Cancel",
              onPress: () => console.log("Cancel Pressed"),
              style: "cancel",
            },
          ],
          { cancelable: false },
        );
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingAction(false);
    }
  };

  const leaveRoom = async () => {
    const roomId = Array.isArray(roomNumber) ? roomNumber[0] : roomNumber;
    await deleteDoc(doc(db, "rooms", roomId, "users", user!.uid));
    const userRef = doc(db, "users", user!.uid);
    await updateDoc(userRef, {
      currentRoomId: "",
      lastActive: serverTimestamp(),
    });
    stopBackgroundUpdate();
    unregisterBackgroundTaskAsync();
  };

  const getStatus = async () => {
    const isRegistered =
      await TaskManager.isTaskRegisteredAsync("updateLastActive");
    console.log("Task registered:", isRegistered);
    const result = await BackgroundTask.getStatusAsync();
    console.log(result);
  };

  useEffect(() => {
    grantPermission();
    const unsubscribe = getUsers();
    if (roomNumber) {
      navigation.setOptions({
        title: `Room ${roomNumber}`,
        headerBackTitle: "Back",
      });
    }
    geofenceStateRef.current = geofenceState;
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [roomNumber, geofenceState]);

  useEffect(() => {
    isInRoomRef.current = isInRoom;
  }, [isInRoom]);

  return (
    <View style={styles.container}>
      {users.map((user) => (
        <View key={user.uid}>
          <Text>{user.name}</Text>
        </View>
      ))}
      {isInRoom ? (
        <Pressable
          onPress={leaveRoom}
          style={styles.button}
          disabled={loadingAction}
        >
          {loadingAction ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>Leave</Text>
          )}
        </Pressable>
      ) : (
        <Pressable
          onPress={joinRoom}
          style={styles.button}
          disabled={loadingAction}
        >
          {loadingAction ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>Join</Text>
          )}
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  button: {
    backgroundColor: "black",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
  },
});
