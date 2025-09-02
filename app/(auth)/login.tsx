import { useForm } from "react-hook-form";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { signIn, getCurrentUser } from "aws-amplify/auth";
import { useAuth } from "@/store/auth";

type F = { email: string; password: string };

export default function Login() {
  const { register, setValue, handleSubmit } = useForm<F>();
  const setUserId = useAuth((s) => s.setUserId);

  const onSubmit = async ({ email, password }: F) => {
    try {
      const out = await signIn({ username: email, password });

      if (out.isSignedIn) {
        const { userId /*, username */ } = await getCurrentUser();
        setUserId(userId);
        router.replace("/");
        return;
      }

      // MFA/코드 확인 등 추가 단계 대응
      // ex) if (out.nextStep.signInStep === "CONFIRM_SIGN_IN_WITH_SMS_CODE") router.push("/(auth)/confirm");
      alert(`다음 단계: ${out.nextStep.signInStep}`);
    } catch (e: any) {
      console.log("login error", e);
      alert(e?.message ?? "로그인 실패");
    }
  };

  return (
    <View style={{ flex:1, padding:20, gap:12, justifyContent:"center" }}>
      <Text style={{ fontSize:20, fontWeight:"700" }}>로그인</Text>
      <TextInput
        placeholder="이메일"
        autoCapitalize="none"
        keyboardType="email-address"
        onChangeText={(t)=>setValue("email", t)}
        style={{ borderWidth:1, borderColor:"#ddd", borderRadius:10, padding:12 }}
        {...register("email")}
      />
      <TextInput
        placeholder="비밀번호"
        secureTextEntry
        onChangeText={(t)=>setValue("password", t)}
        style={{ borderWidth:1, borderColor:"#ddd", borderRadius:10, padding:12 }}
        {...register("password")}
      />
      <TouchableOpacity onPress={handleSubmit(onSubmit)} style={{ backgroundColor:"#111", padding:14, borderRadius:12 }}>
        <Text style={{ color:"#fff", textAlign:"center", fontWeight:"700" }}>로그인</Text>
      </TouchableOpacity>
    </View>
  );
}
