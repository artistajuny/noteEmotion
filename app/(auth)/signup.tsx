import { View, Text, TouchableOpacity } from "react-native";
import { router } from "expo-router";

export default function Signup() {
  return (
    <View style={{ flex:1, justifyContent:"center", alignItems:"center", gap:16 }}>
      <Text style={{ fontSize:20, fontWeight:"700" }}>회원가입(Stub)</Text>
      <TouchableOpacity onPress={()=>router.replace("/")} style={{ padding:12, backgroundColor:"#111", borderRadius:12 }}>
        <Text style={{ color:"#fff" }}>완료</Text>
      </TouchableOpacity>
    </View>
  );
}
