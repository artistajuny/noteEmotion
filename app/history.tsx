import { View, Text } from "react-native";

export default function History() {
  return (
    <View style={{ flex:1, justifyContent:"center", alignItems:"center" }}>
      <Text style={{ fontSize:22, fontWeight:"700" }}>📜 히스토리(Stub)</Text>
      <Text style={{ color:"#666", marginTop:8 }}>최근 7일 감정/루틴 기록</Text>
    </View>
  );
}
