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
import { getAuth, signInWithEmailAndPassword } from "@react-native-firebase/auth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [selectedEmail, setSelectedEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const auth = getAuth();

  const signIn = async () => {
    console.log("sign in");
    setLoading(true);
    const fullEmail = email.includes("@") ? email : email + selectedEmail;
    signInWithEmailAndPassword(auth, fullEmail, password)
    .then((userCredential) => {
      // Signed in 
      console.log(userCredential);
      const user = userCredential.user;
    })
    .catch((error) => {
      const errorCode = error.code;
      const errorMessage = error.message;
      console.log(errorCode);
      console.log(errorMessage);
    });
    setLoading(false);

  };

  const handleLogin = () => {
    setError("");
    if (!email || !password) {
      setError("Email and Password required");
      return;
    }
    // if (selectedEmail !== "@taylor.edu") {
    //   setError("Invalid Email Address");
    //   return;
    // }
    signIn();
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
              <Picker.Item label="@taylor.edu" value="@gmail.com" />
              <Picker.Item label="Future Update..." value="" enabled={false} />
            </Picker>
          </View>
        </View>
        <TextInput
          value={password}
          placeholder="Password"
          onChangeText={(text) => setPassword(text)}
          autoCapitalize="none"
          secureTextEntry
          style={styles.input}
        />
        {error ? <Text style={{ color: "red" }}>{error}</Text> : null}
        {loading ? (
          <ActivityIndicator size="large" color="#0000ff" />
        ) : (
          <>
            <Button title="Login" onPress={handleLogin} />
            <Button
              title="Create Account"
              onPress={() => {
                console.log("sign up");
              }}
            />
          </>
        )}
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