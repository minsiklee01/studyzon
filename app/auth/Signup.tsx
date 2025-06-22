import { useState } from "react";
import {
  StyleSheet,
  TextInput,
  View,
  Text,
  ActivityIndicator,
  Button,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import auth from "@react-native-firebase/auth";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [selectedEmail, setSelectedEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // const provider = new GoogleAuthProvider();
  const firebaseAuth = auth;

  /*
  const signInWithGoogle = () => {
    const auth = getAuth();
    signInWithRedirect(auth, provider);

    getRedirectResult(auth)
      .then((result) => {
        const credential = GoogleAuthProvider.credentialFromResult(result!)!;
        const token = credential.accessToken;
        const user = result!.user;
        console.log(user);
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        const email = error.customData.email;
        const credential = GoogleAuthProvider.credentialFromError(error);
      });
  };
  */
  const signUp = async () => {
    setLoading(true);
    const fullEmail = email + "@gmail.com";
    // const provider = new GoogleAuthProvider();
    // const auth = getAuth();
    // signInWithRedirect(auth, provider);

    try {
      const userCredential = await auth().createUserWithEmailAndPassword(
        fullEmail,
        password
      );
      const user = userCredential.user;
      console.log(user);
      await user.sendEmailVerification;

    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
    setLoading(false);
  };
  const handleSignUp = () => {
    setError("");
    if (!email || !password || !confirmPassword) {
      setError("Required fields not complete");
    }
    if (selectedEmail !== "@taylor.edu") {
      setError("Invalid Email Address");
    }
    if (password !== confirmPassword) {
      setError("password does not match");
    }
    if (error === "") {
      signUp();
    }
  };
  return (
    <View style={styles.container}>
      <KeyboardAvoidingView behavior="padding">
        <View style={styles.emailContainer}>
          <View style={{ flex: 0.5 }}>
            <TextInput
              value={email}
              placeholder="Email"
              onChangeText={(text) => setEmail(text)}
              autoCapitalize="none"
              style={styles.emailInput}
            />
          </View>
          <View style={{ flex: 0.5 }}>
            <Picker
              selectedValue={selectedEmail}
              onValueChange={(itemValue) => setSelectedEmail(itemValue)}
              itemStyle={Platform.OS === "ios" ? styles.pickerItem : {}}
            >
              <Picker.Item label="@taylor.edu" value="@taylor.edu" />
              <Picker.Item label="Coming Soon..." value="" enabled={false} />
            </Picker>
          </View>
        </View>
        <TextInput
          value={password}
          placeholder="password"
          onChangeText={(text) => setPassword(text)}
          autoCapitalize="none"
          style={styles.input}
        />
        <TextInput
          value={confirmPassword}
          placeholder="confirm password"
          onChangeText={(text) => setConfirmPassword(text)}
          autoCapitalize="none"
          style={styles.input}
        />
        {error ? <Text style={{ color: "red" }}>{error}</Text> : null}
        {loading ? (
          <ActivityIndicator size="large" color="000ff" />
        ) : (
          <>
            <Button
              title="Create Account"
              onPress={() => {
                handleSignUp();
              }}
            />
          </>
        )}
        <Button
          title="Google"
          onPress={() => {
            // signInWithGoogle();
          }}
        />
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    paddingHorizontal: 20,
    justifyContent: "center",
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 4,
    padding: 10,
    marginBottom: 8,
    backgroundColor: "#fff",
  },
  emailInput: {
    height: 50,
    borderWidth: 1,
    borderRadius: 4,
    padding: 10,
    marginBottom: 8,
    backgroundColor: "#fff",
    marginRight: 8,
  },
  emailContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  pickerItem: {
    fontSize: 16,
    height: 120,
  },
});
