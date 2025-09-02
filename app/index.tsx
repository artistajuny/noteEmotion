import { View, Text, TouchableOpacity } from "react-native";
import { Link } from "expo-router";

export default function HomeScreen() {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ fontSize: 20, fontWeight: "700" }}>🏠 홈 화면</Text>
      <Link href="/login" asChild>
        <TouchableOpacity style={{ marginTop: 20, padding: 12, backgroundColor: "lightblue" }}>
          <Text>로그인으로 이동</Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
}
