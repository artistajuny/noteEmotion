import { Link } from "expo-router";
import { View, Text, TouchableOpacity } from "react-native";

export default function Home() {
  return (
    <View style={{ flex:1, justifyContent:"center", alignItems:"center", gap:16 }}>
      <Text style={{ fontSize:22, fontWeight:"700" }}>🏠 Home</Text>
      <Link href="/(auth)/login" asChild>
        <TouchableOpacity style={{ padding:12, borderRadius:12, backgroundColor:"#eee" }}>
          <Text>로그인</Text>
        </TouchableOpacity>
      </Link>
      <Link href="/onboarding" asChild>
        <TouchableOpacity style={{ padding:12, borderRadius:12, backgroundColor:"#eee" }}>
          <Text>온보딩</Text>
        </TouchableOpacity>
      </Link>
      <Link href="/routine" asChild>
        <TouchableOpacity style={{ padding:12, borderRadius:12, backgroundColor:"#eee" }}>
          <Text>1분 루틴 시작</Text>
        </TouchableOpacity>
      </Link>
      <Link href="/history" asChild>
        <TouchableOpacity style={{ padding:12, borderRadius:12, backgroundColor:"#eee" }}>
          <Text>히스토리</Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
}
