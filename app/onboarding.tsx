import { View, Text, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { track } from "@/lib/analytics";

export default function Onboarding() {
  return (
    <View style={{ flex:1, justifyContent:"center", alignItems:"center", gap:16 }}>
      <Text style={{ fontSize:22, fontWeight:"700" }}>🧭 온보딩(Stub)</Text>
      <TouchableOpacity
        onPress={() => { track("onboarding_completed"); router.replace("/"); }}
        style={{ padding:12, backgroundColor:"#111", borderRadius:12 }}
      >
        <Text style={{ color:"#fff" }}>완료</Text>
      </TouchableOpacity>
    </View>
  );
}
