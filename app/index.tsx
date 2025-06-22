import { useState, useEffect } from "react";
import {
  Text,
  View,
  StyleSheet,
  KeyboardAvoidingView,
  TextInput,
  Button,
  ActivityIndicator,
  Modal
} from "react-native";
import auth, {
  getAuth,
  sendEmailVerification,
  FirebaseAuthTypes,
} from "@react-native-firebase/auth";
import firestore, { doc, setDoc, getFirestore } from "@react-native-firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Index() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const auth = getAuth();
  const db = getFirestore();

  const checkFirstLaunch = async () => {
    try {
      const isFirstLaunchVal = await AsyncStorage.getItem("isFirstLaunch");
      if (!isFirstLaunchVal) {
        setShowOnboarding(true);
      }
    } catch {
      return null;
    }
  };

  const setFirstLaunch = async () => {
    try {
      console.log("close");
      await AsyncStorage.setItem("isFirstLaunch", "true");
      setShowOnboarding(false);
    } catch {}
  };

  const signOut = () => {
    auth.signOut().then(() => console.log("signed out"));
  };

  const verifyEmail = () => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      if (currentUser?.emailVerified) {
        alert("Account verified already.");
      } else {
        sendEmailVerification(auth.currentUser as FirebaseAuthTypes.User).then(
          () => {
            alert("Sent Email Verification");
          },
        );
      }
    }
  };

  const signUp = async () => {
    setLoading(true);
    try {
      await auth
        .createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
          verifyEmail();
          setDoc(doc(db, "users", userCredential.user.uid), {
            createdAt: firestore.Timestamp.now(),
            email: email,
            name: "temp",
            profilePic: "",
            totalTime: 0,
            uid: userCredential.user.uid,
          });
        })
        .catch((e) => {
          alert("Registration failed: " + e.message);
        });
    } finally {
      setLoading(false);
    }
  };

  const signIn = async () => {
    setLoading(true);
    try {
      await auth.signInWithEmailAndPassword(email, password).then(() => {
        if (!auth.currentUser?.emailVerified) {
          alert("Verification Email Sent");
        }
      });
    } catch (e: any) {
      alert("Sign in failed: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(()=>{
    checkFirstLaunch();
    console.log("Is first launch: " + showOnboarding);
  },[])

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView behavior="padding">
        <Modal
          animationType="slide"
          visible={showOnboarding}
          onRequestClose={setFirstLaunch}
        >
          <View style={styles.container}>
            <Text>Welcome aboard</Text>
            <Button onPress={setFirstLaunch} title="close" />
          </View>
        </Modal>
        {auth.currentUser ? (
          <>
            <Text>{auth.currentUser.email}</Text>
            <Text> Please Verify Your Email</Text>
            <Button onPress={verifyEmail} title="Send email verification" />
            <Button onPress={signOut} title="Sign Out" />
          </>
        ) : (
          <>
            <Text>Login</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="Email"
            />
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="Password"
            />
            {loading ? (
              <ActivityIndicator size={"small"} style={{ margin: 28 }} />
            ) : (
              <>
                <Button onPress={signIn} title="Login" />
                <Button onPress={signUp} title="Create account" />
              </>
            )}
          </>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    flex: 1,
    justifyContent: "center",
  },
  input: {
    marginVertical: 4,
    height: 50,
    borderWidth: 1,
    borderRadius: 4,
    padding: 10,
    backgroundColor: "#fff",
  },
});
