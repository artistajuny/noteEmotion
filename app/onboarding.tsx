import { View, Text, TouchableOpacity } from "react-native";
import { router } from "expo-router";

export default function Onboarding() {
  return (
    <View style={{ flex:1, justifyContent:"center", alignItems:"center", gap:20, padding:20 }}>
      <Text style={{ fontSize:22, fontWeight:"700" }}>환영합니다 👋</Text>
      <Text style={{ fontSize:16, color:"#555", textAlign:"center" }}>
        감정 루틴을 시작하려면 로그인 해주세요.
      </Text>
      <TouchableOpacity
        onPress={() => router.replace("/(auth)/login")}
        style={{ padding:14, backgroundColor:"#111", borderRadius:12, marginTop:24 }}
      >
        <Text style={{ color:"#fff", fontWeight:"600" }}>로그인 / 회원가입</Text>
      </TouchableOpacity>
    </View>
  );
}
