import { StyleSheet, Text, Pressable } from "react-native";
import { Link } from "expo-router";

interface roomButtonProps {
  roomNumber: string;
}
export default function RoomButton({ roomNumber }: roomButtonProps) {
  const link = "/room/" + roomNumber.toString();
  return (
    <Link href={link} asChild>
      <Pressable style={styles.button}>
        <Text style={styles.buttonText}>Room {roomNumber}</Text>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  button: {
    backgroundColor: "black",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
  },
});
