// components/LogoutButton.tsx
import { TouchableOpacity, Text, Alert, ViewStyle, TextStyle } from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/store/auth";

type Props = {
  visible?: boolean;                 // 강제로 숨김/표시 제어 (기본 true)
  style?: ViewStyle;                 // 버튼 스타일 커스텀
  textStyle?: TextStyle;             // 텍스트 스타일 커스텀
  label?: string;                    // 버튼 라벨 (기본 '로그아웃')
};

export default function LogoutButton({
  visible = true,
  style,
  textStyle,
  label = "로그아웃",
}: Props) {
  const { signOut, email } = useAuth();
  if (!email || !visible) return null; // 게스트면 숨김

  const onLogout = () => {
    Alert.alert(
      "로그아웃",
      "어떻게 로그아웃할까요?",
      [
        {
          text: "완전 로그아웃",
          style: "destructive",
          onPress: async () => {
            await signOut({ keepTrusted: false }); // 신뢰기기/이메일까지 삭제
            router.replace("/(onboarding)/step1-welcome");
          },
        },
        { text: "취소", style: "cancel" },
      ],
      { cancelable: true }
    );
  };

  return (
    <TouchableOpacity
      onPress={onLogout}
      style={[{ padding: 12, backgroundColor: "#eee", borderRadius: 8 }, style]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text style={[{ color: "#111", fontWeight: "600" }, textStyle]}>{label}</Text>
    </TouchableOpacity>
  );
}
