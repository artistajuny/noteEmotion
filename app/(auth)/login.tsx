import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { router } from "expo-router";
import { supabase } from "@/lib/supabase"; // ← Supabase 클라이언트
import { useAuth } from "@/store/auth";

type F = { email: string; password: string };

export default function Login() {
  const { register, setValue, handleSubmit } = useForm<F>();
  const setUserId = useAuth((s) => s.setUserId);

  // RN에서는 ref가 없으니 수동 등록
  useEffect(() => {
    register("email");
    register("password");
  }, [register]);

  const onSubmit = async ({ email, password }: F) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      const user = data.user;
      if (!user) throw new Error("로그인 세션을 가져오지 못했습니다.");

      setUserId(user.id);  // supabase auth.users의 uuid
      router.replace("/");
    } catch (e: any) {
      console.log("login error", e);
      Alert.alert("로그인 실패", e?.message ?? "다시 시도해주세요.");
    }
  };

  return (
    <View style={{ flex: 1, padding: 20, gap: 12, justifyContent: "center" }}>
      <Text style={{ fontSize: 20, fontWeight: "700" }}>로그인</Text>

      <TextInput
        placeholder="이메일"
        autoCapitalize="none"
        keyboardType="email-address"
        onChangeText={(t) => setValue("email", t, { shouldValidate: false })}
        style={{ borderWidth: 1, borderColor: "#ddd", borderRadius: 10, padding: 12 }}
      />

      <TextInput
        placeholder="비밀번호"
        secureTextEntry
        onChangeText={(t) => setValue("password", t, { shouldValidate: false })}
        style={{ borderWidth: 1, borderColor: "#ddd", borderRadius: 10, padding: 12 }}
      />

      <TouchableOpacity onPress={handleSubmit(onSubmit)} style={{ backgroundColor: "#111", padding: 14, borderRadius: 12 }}>
        <Text style={{ color: "#fff", textAlign: "center", fontWeight: "700" }}>로그인</Text>
      </TouchableOpacity>
    </View>
  );
}
