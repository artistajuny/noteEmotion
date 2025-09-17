// app/(onboarding)/step4-done.tsx
import { View, Text, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { supabase } from "@/lib/supabase";

export default function Step4() {
  const onEnter = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace("/"); return; }
    await supabase.from("app_user")
      .update({ onboarding_completed_at: new Date().toISOString() })
      .eq("id", user.id);
    router.replace("/");
  };

  return (
    <View style={{flex:1,justifyContent:"center",alignItems:"center",gap:16}}>
      <Text style={{fontSize:22,fontWeight:"700",textAlign:"center"}}>{"환영합니다!\n이제 감정 월드의 여정을 시작해요 🌌"}</Text>
      <TouchableOpacity onPress={onEnter} style={{backgroundColor:"#111",padding:14,borderRadius:12}}>
        <Text style={{color:"#fff",fontWeight:"700"}}>입장하기</Text>
      </TouchableOpacity>
    </View>
  );
}
