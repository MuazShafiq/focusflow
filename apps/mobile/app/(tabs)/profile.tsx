import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../../src/auth/AuthContext";
import { colors } from "../../src/theme";

export default function ProfileScreen() {
  const { session, logout } = useAuth();
  return (
    <View style={styles.screen}>
      <Text style={styles.kicker}>YOUR FOCUSFLOW</Text>
      <Text style={styles.title}>Preferences</Text>
      <View style={styles.profile}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{session?.user.displayName[0]?.toUpperCase()}</Text></View>
        <View><Text style={styles.name}>{session?.user.displayName}</Text><Text style={styles.email}>{session?.user.email}</Text></View>
      </View>
      <View style={styles.card}>
        <View style={styles.row}><Ionicons name="time-outline" size={21} color={colors.mint} /><View><Text style={styles.rowTitle}>Daily rhythm</Text><Text style={styles.rowMeta}>7:00 AM – 11:00 PM</Text></View></View>
        <View style={styles.row}><Ionicons name="flash-outline" size={21} color={colors.mint} /><View><Text style={styles.rowTitle}>Strongest energy</Text><Text style={styles.rowMeta}>Morning</Text></View></View>
        <View style={styles.row}><Ionicons name="leaf-outline" size={21} color={colors.mint} /><View><Text style={styles.rowTitle}>Lifestyle planning</Text><Text style={styles.rowMeta}>Exercise, meals, breaks and leisure</Text></View></View>
      </View>
      <Pressable style={styles.logout} onPress={() => void logout()}><Ionicons name="log-out-outline" size={20} color={colors.danger} /><Text style={styles.logoutText}>Sign out</Text></Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper, paddingTop: 62, paddingHorizontal: 20 },
  kicker: { fontSize: 10, letterSpacing: 1.5, fontWeight: "800", color: colors.muted }, title: { fontSize: 30, fontWeight: "900", letterSpacing: -1.2, color: colors.ink, marginTop: 4 },
  profile: { flexDirection: "row", alignItems: "center", gap: 14, marginTop: 26 }, avatar: { width: 55, height: 55, borderRadius: 28, backgroundColor: colors.mint, alignItems: "center", justifyContent: "center" }, avatarText: { fontSize: 20, fontWeight: "900", color: colors.onAccent }, name: { fontSize: 17, fontWeight: "900", color: colors.ink }, email: { fontSize: 11, color: colors.muted, marginTop: 4 },
  card: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, borderRadius: 17, paddingHorizontal: 16, marginTop: 28 }, row: { flexDirection: "row", alignItems: "center", gap: 13, paddingVertical: 18, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line }, rowTitle: { fontSize: 13, fontWeight: "800", color: colors.ink }, rowMeta: { fontSize: 10, color: colors.muted, marginTop: 3 },
  logout: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 50, borderWidth: 1, borderColor: "#603334", backgroundColor: colors.dangerSurface, borderRadius: 13, marginTop: 24 }, logoutText: { color: colors.danger, fontWeight: "800" },
});
