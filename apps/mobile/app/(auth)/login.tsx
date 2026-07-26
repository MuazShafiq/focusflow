import { Ionicons } from "@expo/vector-icons";
import { Link, router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useAuth } from "../../src/auth/AuthContext";
import { colors } from "../../src/theme";

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const submit = async () => {
    setPending(true);
    setError("");
    try {
      await login(email.trim(), password);
      router.replace("/(tabs)");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not sign in");
    } finally {
      setPending(false);
    }
  };
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.screen}
    >
      <View style={styles.brand}>
        <View style={styles.mark}><Ionicons name="stats-chart" size={22} color={colors.lime} /></View>
        <Text style={styles.brandName}>FocusFlow</Text>
      </View>
      <View style={styles.copy}>
        <Text style={styles.kicker}>WELCOME BACK</Text>
        <Text style={styles.title}>Find your flow.</Text>
        <Text style={styles.subtitle}>Your balanced schedule is waiting.</Text>
      </View>
      <Text style={styles.label}>Email</Text>
      <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="you@example.com" placeholderTextColor="#9ba19d" autoCapitalize="none" keyboardType="email-address" />
      <Text style={styles.label}>Password</Text>
      <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="At least 8 characters" placeholderTextColor="#9ba19d" secureTextEntry />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable style={styles.button} onPress={() => void submit()} disabled={pending}>
        {pending ? <ActivityIndicator color="white" /> : <><Text style={styles.buttonText}>Sign in</Text><Ionicons name="arrow-forward" size={18} color="white" /></>}
      </Pressable>
      <Text style={styles.switch}>New to FocusFlow? <Link href="/(auth)/register" style={styles.link}>Create an account</Link></Text>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 24, paddingTop: 70, backgroundColor: colors.paper },
  brand: { flexDirection: "row", alignItems: "center", gap: 10 },
  mark: { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.forest, alignItems: "center", justifyContent: "center" },
  brandName: { fontSize: 21, fontWeight: "900", color: colors.ink },
  copy: { marginTop: 70, marginBottom: 28 },
  kicker: { fontSize: 10, letterSpacing: 1.4, fontWeight: "800", color: colors.muted },
  title: { fontSize: 40, fontWeight: "900", letterSpacing: -1.6, color: colors.ink, marginTop: 8 },
  subtitle: { color: colors.muted, marginTop: 8 },
  label: { fontSize: 12, fontWeight: "700", color: colors.ink, marginBottom: 8, marginTop: 15 },
  input: { height: 52, borderWidth: 1, borderColor: colors.line, borderRadius: 13, paddingHorizontal: 15, backgroundColor: colors.card, color: colors.ink },
  error: { marginTop: 14, color: colors.danger, backgroundColor: "#ffebe7", padding: 11, borderRadius: 9, fontSize: 12 },
  button: { height: 54, flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center", borderRadius: 14, backgroundColor: colors.forest, marginTop: 24 },
  buttonText: { color: "white", fontWeight: "800" },
  switch: { textAlign: "center", color: colors.muted, marginTop: 24, fontSize: 13 },
  link: { color: colors.forest, fontWeight: "800" },
});
