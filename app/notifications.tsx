import {
  StyleSheet,
  Text,
  View,
  Button,
  TouchableHighlight,
} from "react-native";

interface Notification {
  id: number;
  title: string;
  message: string;
}

export default function Notifications() {
  return (
    <View>
      <Text>Notifications</Text>
    </View>
  );
};

