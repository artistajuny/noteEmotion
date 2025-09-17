// app/(tabs)/my.tsx
import { View, Text } from "react-native";
import { useAuth } from "@/store/auth";
import LogoutButton from "@/components/LogoutButton";

export default function MyScreen() {
  const { email } = useAuth();

  return (
    <View style={{ flex:1, padding:20, gap:16 }}>
      <Text style={{ fontSize:22, fontWeight:"700" }}>마이</Text>

      <View style={{ gap:4 }}>
        <Text style={{ fontSize:16, color:"#666" }}>계정</Text>
        <Text style={{ fontSize:18, fontWeight:"600" }}>{email ?? "게스트"}</Text>
      </View>

      {/* 로그인 상태에만 표시됨(컴포넌트 내부에서 게스트면 null) */}
      <LogoutButton />
    </View>
  );
}
