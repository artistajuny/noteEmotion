import { supabase } from "./supabase";

export async function emailSignUp(email: string, password: string) {
  const { error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
}

export async function emailSignIn(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function snsSignIn(provider: "google" | "apple") {
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: "emotionapp://auth/callback" }
  });
  if (error) throw error;
}

export async function currentUser() {
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}

export async function doSignOut() {
  await supabase.auth.signOut();
}
