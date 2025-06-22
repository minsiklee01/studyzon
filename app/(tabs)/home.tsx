import { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  Button,
  Pressable,
  FlatList,
} from "react-native";

import {
  getFirestore,
  collection,
  query,
  getDocs,
} from "@react-native-firebase/firestore";

import RoomButton from "../room/roomButton";
import { Link } from "expo-router";
import { Octicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

type Room = {
  id: string;
  users: string[];
};

export default function App() {
  const db = getFirestore();
  const navigation = useNavigation();

  const [rooms, setRooms] = useState<Room[]>([]);

  const getRooms = async () => {
    try {
      const q = query(collection(db, "rooms"));
      const snapshot = await getDocs(q);
      const filteredData = snapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
        users: doc.data().users || [],
      }));
      console.log(filteredData);
      setRooms(filteredData);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Link href="/notifications" asChild>
          <Pressable>
            <Octicons name="bell" size={24} />
          </Pressable>
        </Link>
      ),
    });
  }, [navigation]);

  useEffect(() => {
    getRooms();
  }, []);

  return (
    <View style={[styles.container, { flexDirection: "column" }]}>
      {rooms.map((item) => (
        <View style={styles.roomButtons} key={item.id}>
          <RoomButton roomNumber={item.id} />
        </View>
      ))}
    </View>
  );
}

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 82,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  list: {
    backgroundColor: "grey",
  },
  link: {
    color: "steelblue",
  },
  roomButtons: {
    margin: 3,
  },
});
