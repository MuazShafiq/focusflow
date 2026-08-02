import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../../src/auth/AuthContext";
import { PreferencesEditor } from "../../src/components/PreferencesEditor";
import { colors } from "../../src/theme";
import type { UserPreferences } from "../../src/types";

const formatPreferenceTime = (
  value: string,
  clockFormat: UserPreferences["clockFormat"],
) => {
  const [hourValue, minute = "00"] = value.split(":");
  const hour = Number(hourValue);
  if (clockFormat === "24h") {
    return `${String(hour).padStart(2, "0")}:${minute}`;
  }
  const period = hour >= 12 ? "PM" : "AM";
  return `${hour % 12 || 12}:${minute} ${period}`;
};

export default function ProfileScreen() {
  const { session, logout, request, savePreferences } = useAuth();
  const [savingClock, setSavingClock] = useState(false);
  const [editing, setEditing] = useState(false);
  const [notice, setNotice] = useState("");
  const preferences = session?.user.preferences;

  const changeClockFormat = async (
    clockFormat: UserPreferences["clockFormat"],
  ) => {
    if (!preferences || preferences.clockFormat === clockFormat) return;
    setSavingClock(true);
    try {
      const saved = await request<UserPreferences>("/preferences", {
        method: "PUT",
        body: JSON.stringify({ ...preferences, clockFormat }),
      });
      await savePreferences(saved);
    } finally {
      setSavingClock(false);
    }
  };

  const saveAllPreferences = async (next: UserPreferences) => {
    const saved = await request<UserPreferences>("/preferences", {
      method: "PUT",
      body: JSON.stringify(next),
    });
    await savePreferences(saved);
    setNotice("Preferences saved. Your next plan will use them.");
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.kicker}>YOUR FOCUSFLOW</Text>
      <Text style={styles.title}>Preferences</Text>
      <View style={styles.profile}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{session?.user.displayName[0]?.toUpperCase()}</Text></View>
        <View><Text style={styles.name}>{session?.user.displayName}</Text><Text style={styles.email}>{session?.user.email}</Text></View>
      </View>
      <View style={styles.card}>
        <View style={styles.row}><Ionicons name="time-outline" size={21} color={colors.mint} /><View><Text style={styles.rowTitle}>Daily rhythm</Text><Text style={styles.rowMeta}>{preferences ? `${formatPreferenceTime(preferences.dayStart, preferences.clockFormat)} – ${formatPreferenceTime(preferences.dayEnd, preferences.clockFormat)}` : "—"}</Text></View></View>
        <View style={styles.clockRow}>
          <View><Text style={styles.rowTitle}>Clock format</Text><Text style={styles.rowMeta}>{savingClock ? "Saving…" : "Used throughout FocusFlow"}</Text></View>
          <View style={styles.clockOptions}>
            {(["12h", "24h"] as const).map((format) => (
              <Pressable key={format} style={[styles.clockOption, preferences?.clockFormat === format && styles.clockOptionActive]} onPress={() => void changeClockFormat(format)} disabled={savingClock}>
                <Text style={[styles.clockOptionText, preferences?.clockFormat === format && styles.clockOptionTextActive]}>{format === "12h" ? "12-hour" : "24-hour"}</Text>
              </Pressable>
            ))}
          </View>
        </View>
        <View style={styles.row}><Ionicons name="flash-outline" size={21} color={colors.mint} /><View><Text style={styles.rowTitle}>Strongest energy</Text><Text style={styles.rowMeta}>{preferences?.preferredStudyTime ?? "—"}</Text></View></View>
        <View style={styles.row}><Ionicons name="leaf-outline" size={21} color={colors.mint} /><View><Text style={styles.rowTitle}>Lifestyle planning</Text><Text style={styles.rowMeta}>Exercise, meals, breaks and leisure</Text></View></View>
      </View>
      <Pressable
        disabled={!preferences}
        onPress={() => {
          setNotice("");
          setEditing(true);
        }}
        style={styles.edit}
      >
        <Ionicons name="options-outline" size={19} color={colors.onAccent} />
        <Text style={styles.editText}>Edit planning preferences</Text>
      </Pressable>
      {notice ? <Text style={styles.notice}>{notice}</Text> : null}
      <Pressable style={styles.logout} onPress={() => void logout()}><Ionicons name="log-out-outline" size={20} color={colors.danger} /><Text style={styles.logoutText}>Sign out</Text></Pressable>
      {preferences ? (
        <PreferencesEditor
          key={`${editing}-${preferences.dayStart}-${preferences.dayEnd}-${preferences.clockFormat}`}
          onClose={() => setEditing(false)}
          onSave={saveAllPreferences}
          preferences={preferences}
          visible={editing}
        />
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  content: { paddingTop: 62, paddingHorizontal: 20, paddingBottom: 120 },
  kicker: { fontSize: 10, letterSpacing: 1.5, fontWeight: "800", color: colors.muted }, title: { fontSize: 30, fontWeight: "900", letterSpacing: -1.2, color: colors.ink, marginTop: 4 },
  profile: { flexDirection: "row", alignItems: "center", gap: 14, marginTop: 26 }, avatar: { width: 55, height: 55, borderRadius: 28, backgroundColor: colors.mint, alignItems: "center", justifyContent: "center" }, avatarText: { fontSize: 20, fontWeight: "900", color: colors.onAccent }, name: { fontSize: 17, fontWeight: "900", color: colors.ink }, email: { fontSize: 11, color: colors.muted, marginTop: 4 },
  card: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, borderRadius: 17, paddingHorizontal: 16, marginTop: 28 }, row: { flexDirection: "row", alignItems: "center", gap: 13, paddingVertical: 18, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line }, rowTitle: { fontSize: 13, fontWeight: "800", color: colors.ink }, rowMeta: { fontSize: 10, color: colors.muted, marginTop: 3 },
  clockRow: { gap: 13, paddingVertical: 18, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
  clockOptions: { flexDirection: "row", gap: 8, marginTop: 2 },
  clockOption: { flex: 1, alignItems: "center", borderWidth: 1, borderColor: colors.line, borderRadius: 9, paddingVertical: 9, backgroundColor: colors.field },
  clockOptionActive: { borderColor: colors.mint, backgroundColor: colors.subtle },
  clockOptionText: { color: colors.muted, fontSize: 11, fontWeight: "800" },
  clockOptionTextActive: { color: colors.mint },
  edit: { height: 52, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 14, backgroundColor: colors.lime, marginTop: 18 },
  editText: { color: colors.onAccent, fontWeight: "900" },
  notice: { color: colors.mint, backgroundColor: colors.subtle, borderWidth: 1, borderColor: colors.line, borderRadius: 10, padding: 12, marginTop: 12, fontSize: 11, lineHeight: 16 },
  logout: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 50, borderWidth: 1, borderColor: "#603334", backgroundColor: colors.dangerSurface, borderRadius: 13, marginTop: 16 }, logoutText: { color: colors.danger, fontWeight: "800" },
});
