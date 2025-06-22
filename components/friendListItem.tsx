import { StyleSheet, Text, View, TouchableHighlight } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";

interface FriendListItemProps {
  User: {
    uid: string;
    name: string;
    currentRoomId: string;
    profilePic: string;
  };
}

export default function FriendListItem({ User }: FriendListItemProps) {
  const router = useRouter();
  const handleProfileClick = () => {
    if (User.currentRoomId) {
      router.navigate("/room/" + User.currentRoomId);
    } else {
      router.navigate("/user/" + User.uid);
    }
  };

  return (
    <View style={styles.container}>
      <View style={{ flex: 7 }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TouchableHighlight
            style={
              User.currentRoomId
                ? styles.activeImageContainer
                : styles.imageContainer
            }
            onPress={handleProfileClick}
          >
            <Image
              style={styles.image}
              source={User.profilePic}
              placeholder={User.name}
            />
          </TouchableHighlight>
          <View>
            <Text style={styles.userName}>{User.name}</Text>
            {User.currentRoomId ? (
              <Text style={styles.userDescription}>
                In room {User.currentRoomId}
              </Text>
            ) : (
              <Text style={styles.userDescription}>Active 4 Hours Ago</Text>
            )}
          </View>
        </View>
      </View>
      <Text style={{ flex: 1 }}>Edit</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderColor: "#ccc",
    width: "100%",
  },
  activeImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 2,
    borderColor:"rgb(12, 188, 12)",
    marginRight: 10,
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
  userName: {
    fontSize: 16,
  },
  userDescription: {
    fontSize: 12,
    color: "grey",
  },
});
