import { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  StyleSheet,
  TouchableOpacity,
  TouchableHighlight,
} from "react-native";
import { Image } from "expo-image";
import { useNavigation, useRouter } from "expo-router";
import {
  query,
  where,
  and,
  doc,
  getDoc,
  collection,
  onSnapshot,
  getFirestore,
} from "@react-native-firebase/firestore";
import Octicons from "@expo/vector-icons/Octicons";
import { useUser } from "../source/UserContext";

type User = {
  uid: string;
  username: string;
  name: string;
  profilepic: string;
};

export default function AddFriend() {
  const router = useRouter();
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchUsers, setSearchUsers] = useState<User[]>([]);
  const { firestoreUser } = useUser();
  const db = getFirestore();

  const searchUser = () => {
    try {
      let searchWord = searchKeyword.toLowerCase();
      const friendsQuery = query(
        collection(db, "users"),
        and(
          where("username", "==", searchWord),
          where("username", "!=", firestoreUser?.username),
        ),
      );
      return onSnapshot(friendsQuery, async (querySnapshot) => {
        try {
          const userPromises = querySnapshot.docs.map(async (userDoc) => {
            const userRef = doc(db, "users", userDoc.data().uid);
            const friendDoc = await getDoc(userRef);
            const data = friendDoc.data();
            return {
              uid: data?.uid,
              username: data?.username ?? "Unknown",
              name: data?.name,
              profilepic: data?.profilePic,
            } as User;
          });
          const usersArray = await Promise.all(userPromises);
          setSearchUsers(usersArray);
          console.log(searchUsers);
        } catch (innerErr) {
          console.error(innerErr);
        }
      });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView>
        <View style={styles.searchField}>
          <View style={{ flex: 7 }}>
            <TextInput
              style={styles.textInput}
              value={searchKeyword}
              onChangeText={setSearchKeyword}
              autoCapitalize="none"
              placeholder="User Name"
            />
          </View>
          <View style={{ flex: 1 }}>
            <TouchableOpacity
              onPress={() => {
                searchUser();
              }}
            >
              <Octicons name="search" size={24} color="black" />
            </TouchableOpacity>
          </View>
        </View>
        <FlatList
          contentContainerStyle={{ gap: 10 }}
          data={searchUsers}
          renderItem={({ item }) => (
            <View style={styles.userItem}>
              <TouchableHighlight
                onPress={() => {
                  router.navigate("/user/" + item.uid);
                }}
                style={{ width: "100%" }}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Image
                    style={styles.imageContainer}
                    source={item.profilepic}
                    placeholder={item.name}
                  />
                  <Text>{item.name}</Text>
                </View>
              </TouchableHighlight>
            </View>
          )}
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
    padding: 10,
  },
  searchField: {
    flexDirection: "row",
    alignItems: "center",
  },
  textInput: {
    padding: 4,
    height: 50,
    borderWidth: 1,
    borderRadius: 4,
    backgroundColor: "#fff",
    marginBottom: 10,
    fontSize: 16,
  },
  userItem: {
    width: "100%",
  },
  imageContainer: {
    width: 54,
    height: 54,
    borderRadius: 36,
    marginRight: 10,
    alignItems: "center",
  },
  image: {
    borderRadius: 36,
    width: 52,
    height: 52,
  },
});
