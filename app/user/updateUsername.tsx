import { useState, useEffect, useLayoutEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  KeyboardAvoidingView,
  Button,
} from "react-native";
import { doc, updateDoc, getFirestore } from "@react-native-firebase/firestore";
import { useUser } from "../source/UserContext";
import { useNavigation, useRouter } from "expo-router";

export default function UpdateName() {
  const navigation = useNavigation();
  const router = useRouter();
  const { firestoreUser, setFirestoreUser, user } = useUser();
  const [userName, setUserName] = useState("");
  const db = getFirestore();

  const handleSave = useCallback(async () => {

    if (user) {
      const userRef = doc(db, "users", user.uid);
      try {
        await updateDoc(userRef, {
          username: userName,
        });
        setFirestoreUser({
          ...firestoreUser!,
          username: userName,
        });
        router.back();
        console.log("Saved name:", userName);
      } catch (error) {
        console.error("Failed to update user name:", error);
      }
    }
  }, [user, userName]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Button onPress={handleSave} title="Save" color="#007AFF" />
      ),
    });
  }, [navigation, handleSave]);

  useEffect(() => {
    if (firestoreUser?.username && !userName) {
      setUserName(firestoreUser.username);
    }
  }, [firestoreUser?.username]);

  return (
    <View className="flex-1 w-full bg-white items-center p-6">
      <KeyboardAvoidingView className="w-full gap-2">
        <Text>Username</Text>
        <TextInput
          value={userName}
          onChangeText={setUserName}
          autoCapitalize="none"
          placeholder="User Name"
          className="border w-full rounded-md p-2 h-14"
        />
      </KeyboardAvoidingView>
    </View>
  );
}