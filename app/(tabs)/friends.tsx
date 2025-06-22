import { useEffect, useState, useLayoutEffect } from "react";
import { StyleSheet, TextInput, View, FlatList, Button, TouchableOpacity, KeyboardAvoidingView } from "react-native";
import { useNavigation, useRouter } from "expo-router";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import {
  getFirestore,
  query,
  or,
  and,
  where,
  doc,
  getDoc,
  collection,
  onSnapshot,
} from "@react-native-firebase/firestore";
import { useUser } from "../source/UserContext";
import FriendListItem from "../../components/friendListItem";

type Friend = {
  uid: string;
  name: string;
  currentRoomId: string;
  profilePic: string;
};

export default function Friends() {
  const db = getFirestore();

  const [friends, setFriends] = useState<Friend[]>([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const { user } = useUser();
  const router = useRouter();

  const getFriends = () => {
    try {
      const friendsQuery = query(
        collection(db, "userRelationship"),
        and(
          or(
            where("user_first_id", "==", user!.uid),
            where("user_second_id", "==", user!.uid),
          ),
          where("type", "==", "friends")
        )
      );
      return onSnapshot(friendsQuery, async (querySnapshot) => {
        try {
          const friendPromises = querySnapshot.docs.map(async (relDoc) => {
            const firstId = relDoc.data().user_first_id;
            const secondId = relDoc.data().user_second_id;
            const friendId = firstId === user!.uid ? secondId : firstId;
            const userRef = doc(db, "users", friendId);
            const friendDoc = await getDoc(userRef);
            const data = friendDoc.data();
            return {
              uid: data?.uid,
              name: data?.name ?? "Unknown",
              currentRoomId: data?.currentRoomId ?? null,
              profilePic: data?.profilePic,
            } as Friend;
          });

          const friendsArray = await Promise.all(friendPromises);
          setFriends(friendsArray);
        } catch (innerErr) {
          console.error(innerErr);
        }
      });
    } catch (e) {
      console.error(e);
    }
  };

  const navigation = useNavigation();
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            router.navigate("user/addFriend");
          }}
        >
          <MaterialIcons name="person-add-alt" size={24} color="black" />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  useEffect(() => {
    const unsubscribe = getFriends();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  useEffect(() => {
    console.log(friends);
  }, [friends]);
  return (
    <View style={styles.container}>
      <KeyboardAvoidingView>
        <TextInput
          style={styles.textInput}
          value={searchKeyword}
          onChangeText={setSearchKeyword}
          autoCapitalize="none"
          placeholder="User Name"
        />
        <FlatList
          contentContainerStyle={{ gap: 10 }}
          data={friends}
          renderItem={({ item }) => <FriendListItem User={item} />}
        />
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    width: "100%",
    paddingHorizontal: 10,
  },
  textInput: {
    marginVertical: 4,
    padding: 4,
    height: 50,
    borderWidth: 1,
    borderRadius: 4,
    backgroundColor: "#fff",
    marginBottom: 10,
    fontSize: 16,
  },
  addButton: {
    paddingRight: 12,
  },
});
