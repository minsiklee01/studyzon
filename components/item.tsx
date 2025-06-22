import { useState } from "react";
import { View, Text, Button } from "react-native";
interface TodoItemProps {
  title: string;
}

export default function TodoItem({ title }: TodoItemProps) {
  const [isDone, setIsDone] = useState(false);
  return (
    <View>
      <Button title="" onPress={() => setIsDone(!isDone)} />
      <Text>{title}</Text>
    </View>
  );
}
