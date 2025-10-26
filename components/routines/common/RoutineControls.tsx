// components/routines/common/RoutineControls.tsx
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

type Props = {
  paused: boolean;
  onTogglePause: () => void;
  onSkip: () => void;   // 스텝 건너뛰기 or 다음
  onExit: () => void;   // 루틴 종료(완료/나가기)
  hint?: string;        // 상단 안내문구(옵션)
  remainingSec?: number;// 남은시간 표시(옵션)
};

const UI = {
  text: "#0F172A",
  sub: "#6B7280",
  border: "#EEF2F7",
  primary: "#0E2A47",
  bgBtn: "#F6F8FB",
};

export default function RoutineControls({
  paused, onTogglePause, onSkip, onExit, hint, remainingSec,
}: Props) {
  return (
    <View style={styles.wrap}>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      {typeof remainingSec === "number" ? (
        <Text style={styles.remain}>남은 시간 {remainingSec}s</Text>
      ) : null}
      <View style={styles.row}>
        <TouchableOpacity onPress={onTogglePause} style={[styles.btn, styles.btnGhost]}>
          <Text style={styles.btnGhostText}>{paused ? "재개" : "일시정지"}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onSkip} style={[styles.btn, styles.btnGhost]}>
          <Text style={styles.btnGhostText}>건너뛰기</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onExit} style={[styles.btn, styles.btnPrimary]}>
          <Text style={styles.btnPrimaryText}>종료</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingTop: 12,
    paddingBottom: 20,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: UI.border,
    backgroundColor: "#FFFFFF",
  },
  hint: { textAlign: "center", color: UI.sub, marginBottom: 6 },
  remain: { textAlign: "center", color: UI.sub, marginBottom: 8 },
  row: { flexDirection: "row", gap: 10 },
  btn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  btnGhost: { borderWidth: 1, borderColor: UI.border, backgroundColor: UI.bgBtn },
  btnGhostText: { color: UI.text, fontWeight: "800" },
  btnPrimary: { backgroundColor: UI.primary },
  btnPrimaryText: { color: "#fff", fontWeight: "900" },
});
