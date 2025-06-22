import { useState, useLayoutEffect } from "react";
import { Text, View, Button, TouchableHighlight, TouchableOpacity } from "react-native";
import firestore from "@react-native-firebase/firestore";
import auth from "@react-native-firebase/auth";
import { Link, useNavigation } from "expo-router";
import { useUser } from "../source/UserContext";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import Feather from "@expo/vector-icons/Feather";

export default function Settings() {
  const { firestoreUser } = useUser();
  const usernamelink = "/user/updateUsername";
  const namelink = "/user/updateName";
  const [image, setImage] = useState<string | null>(null);

  const navigation = useNavigation();

  const signOut = () => {
    auth()
      .signOut()
      .then(() => console.log("signed out"));
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      const selectedImageUri = result.assets[0].uri;
      setImage(selectedImageUri);
      // const uid = auth().currentUser?.uid;
      // if (uid) {
      //   await firestore().collection("users").doc(uid).update({
      //     profilePic: selectedImageUri,
      //   });
      // }
    }
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={() => {}} className="pr-4">
          <Feather name="menu" size={24} color="black" />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  return (
    <View className="flex-1 w-full bg-white p-6 gap-3">
      <View className="flex-row w-full items-center">
        {/* <Image
          style={styles.imageContainer}
          source={firestoreUser?.profilePic}
          placeholder={firestoreUser?.name}
        /> */}
        <TouchableHighlight
          className="w-[58px] h-[58px] rounded-full mr-2 items-center justify-center bg-gray-200"
          onPress={pickImage}
        >
          <Image
            source={{ uri: image }}
            className="w-[52px] h-[52px] rounded-full"
          />
        </TouchableHighlight>
        <View className="flex-1 gap-y-1">
          <Text>{firestoreUser?.name}</Text>
          <View className="flex-row justify-between">
            <View className="flex items-center">
              <Text>Study Time</Text>
              <Text>10</Text>
            </View>
            <View className="flex items-center text-base">
              <Text>Study Time</Text>
              <Text>10</Text>
            </View>
          </View>
        </View>
      </View>

      <Link href={namelink} asChild>
        <Text>Name {firestoreUser?.name}</Text>
      </Link>
      <Link href={usernamelink} asChild>
        <Text>Username {firestoreUser?.username}</Text>
      </Link>
      <Link href="/user/tutorial" asChild>
        <Text>Tutorial</Text>
      </Link>
      <TouchableHighlight onPress={signOut}>
        <Text className="text-red-600 font-medium text-lg">Log Out</Text>
      </TouchableHighlight>

      {/* <Button onPress={signOut} title="Sign Out" /> */}
    </View>
  );
}
