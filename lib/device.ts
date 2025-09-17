// lib/device.ts
import * as Device from "expo-device";
import * as Crypto from "expo-crypto";
import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "install-id";
export async function getDeviceIdHash() {
  let id = await AsyncStorage.getItem(KEY);
  if (!id) { id = cryptoRandom(); await AsyncStorage.setItem(KEY, id); }
  const raw = `${Device.modelName ?? "unknown"}|${id}`;
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, raw);
}
function cryptoRandom() { return Math.random().toString(36).slice(2)+Date.now().toString(36); }
