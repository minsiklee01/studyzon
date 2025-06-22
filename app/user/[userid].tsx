import { useEffect, useState } from "react";
import { StyleSheet, Text, View, Button } from "react-native";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { Image } from "expo-image";
import {
  getFirestore,
  doc,
  getDoc,
  addDoc,
  deleteDoc,
  updateDoc,
  query,
  collection,
  where,
  onSnapshot,
} from "@react-native-firebase/firestore";
import { useUser } from "../source/UserContext";

type User = {
  currentRoomId: string;
  email: string;
  name: string;
  profilepic: string;
  totaltime: number;
  uid: string;
  username: string;
  notificationToken: string;
  lastActive: string;
};

enum Relationship {
  Friends = "friends",
  ReceivedRequest = "receivedRequest",
  SentRequest = "sentRequest",
  None = "none",
}

export default function UserPage() {
  const db = getFirestore();
  const navigation = useNavigation();
  const { userid } = useLocalSearchParams<{
    userid: string;
  }>();
  const [targetUser, setUser] = useState<User>();
  const [relationship, setRelationship] = useState<Relationship>(
    Relationship.None,
  );
  const [relationshipDocID, setRelationshipDocID] = useState("");
  const { firestoreUser, user } = useUser();

  const notifyRequest = async () => {
    await fetch("https://sendpushnotification-bp4bfzwgrq-uc.a.run.app", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token: targetUser?.notificationToken,
        title: "Friend Request",
        body: `${firestoreUser?.username} wants to be your friend!`,
      }),
    });
  };

  const notifyAccept = async () => {
    await fetch("https://sendpushnotification-bp4bfzwgrq-uc.a.run.app", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token: targetUser?.notificationToken,
        title: "Request Accepted",
        body: `${firestoreUser?.username} is now your friend!`,
      }),
    });
  };

  const getUserInfo = async () => {
    try {
      const userRef = doc(db, "users", userid);
      const userSnap = await getDoc(userRef);
      const data = userSnap.data();
      if (data) {
        // console.log("Document data:", data);
        setUser({
          currentRoomId: data.currentRoomId,
          email: data.email,
          name: data.name,
          profilepic: data.profilePic,
          totaltime: data.totaltime,
          uid: data.uid,
          username: data.username,
          notificationToken: data.notificationToken,
          lastActive: data.lastActive,
        });
        navigation.setOptions({
          title: `${data.username}`,
          headerBackTitle: "Back",
        });
      } else {
        console.log("no user document found");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getRelationship = () => {
    if (user) {
      try {
        const [lowId, highId] =
          user!.uid < userid ? [user?.uid, userid] : [userid, user?.uid];
        const relQuery = query(
          collection(db, "userRelationship"),
          where("user_first_id", "==", lowId),
          where("user_second_id", "==", highId),
        );
        const unsubscribe = onSnapshot(relQuery, (snapshot) => {
          if (!snapshot.empty) {
            const document = snapshot.docs[0];
            setRelationshipDocID(document.id);
            const type = document.data().type;
            if (type === "friends") {
              setRelationship(Relationship.Friends);
            } else if (type === "sentRequest") {
              if (document.data().user_first_id === user?.uid) {
                setRelationship(Relationship.SentRequest);
              } else {
                setRelationship(Relationship.ReceivedRequest);
              }
            } else if (type === "receivedRequest") {
              if (document.data().user_first_id === user?.uid) {
                setRelationship(Relationship.ReceivedRequest);
              } else {
                setRelationship(Relationship.SentRequest);
              }
            }
          } else {
            setRelationship(Relationship.None);
            setRelationshipDocID("");
          }
        });
        return () => unsubscribe();
      } catch (e) {
        console.error(e);
      }
    } else {
      console.log("failed to get user");
    }
  };

  const requestFriend = async () => {
    if (userid && user) {
      const [lowId, highId] =
        user.uid < userid ? [user.uid, userid] : [userid, user.uid];
      try {
        await addDoc(collection(db, "userRelationship"), {
          type: user.uid === lowId ? "sentRequest" : "receivedRequest",
          user_first_id: lowId,
          user_second_id: highId,
        });
        notifyRequest();
      } catch (e) {
        console.log(e);
      }
    }
  };

  const removeRelationship = async () => {
    if (userid && user) {
      if (relationshipDocID !== "") {
        try {
          await deleteDoc(doc(db, "userRelationship", relationshipDocID));
        } catch (e) {
          console.log(e);
        }
      }
    }
  };

  const acceptRequest = async () => {
    if (userid && user) {
      if (relationshipDocID !== "") {
        const relRef = doc(db, "userRelationship", relationshipDocID);
        try {
          await updateDoc(relRef, {
            type: "friends",
          });
          notifyAccept();
        } catch (error) {
          console.error("Failed to update relationship:", error);
        }
      }
    }
  };

  useEffect(() => {
    getUserInfo();
    const cleanup = getRelationship();
    return () => {
      if (cleanup) cleanup();
    };
  }, []);

  return (
    <>
      {targetUser ? (
        <View style={styles.container}>
          <Image
            style={styles.image}
            source={targetUser.profilepic}
            placeholder={targetUser.name}
          />
          <View style={{ alignItems: "center" }}>
            <Text style={{ fontSize: 24, fontWeight: 800 }}>
              {targetUser.name}
            </Text>
            <Text>@{targetUser.username}</Text>
          </View>
          <View style={styles.stats}>
            <View style={{ alignItems: "center" }}>
              <Text style={{ fontSize: 16, fontWeight: 600 }}>3000</Text>
              <Text>Total</Text>
            </View>
            <View style={{ alignItems: "center" }}>
              <Text style={{ fontSize: 16, fontWeight: 600 }}>12</Text>
              <Text>Weekly</Text>
            </View>
            <View style={{ alignItems: "center" }}>
              <Text style={{ fontSize: 16, fontWeight: 600 }}>22</Text>
              <Text>Session</Text>
            </View>
          </View>

          {relationship === Relationship.Friends && (
            <Button title="Remove Friend" onPress={removeRelationship} />
          )}
          {relationship === Relationship.ReceivedRequest && (
            <Button title="Accept Request" onPress={acceptRequest} />
          )}
          {relationship === Relationship.SentRequest && (
            <Button title="Cancel Request" onPress={removeRelationship} />
          )}
          {relationship === Relationship.None && (
            <Button title="Request Friend" onPress={requestFriend} />
          )}
        </View>
      ) : (
        <Text>Loading user data...</Text>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingTop: 12,
    gap: 8,
  },
  stats: {
    width: "100%",
    height: "8%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-evenly",
  },
  button: {
    backgroundColor: "blue",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
  },
  image: {
    borderRadius: 18,
    width: 92,
    height: 92,
  },
});
