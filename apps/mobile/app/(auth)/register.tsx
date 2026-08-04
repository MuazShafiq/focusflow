import { Ionicons } from "@expo/vector-icons";
import { Link, router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator, KeyboardAvoidingView, Platform, Pressable,
  ScrollView, StyleSheet, Text, TextInput, View,
} from "react-native";
import { useAuth } from "../../src/auth/AuthContext";
import { BrandMark } from "../../src/components/BrandMark";
import { colors } from "../../src/theme";

export default function RegisterScreen() {
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const submit = async () => {
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setPending(true);
    try {
      await register(name.trim(), email.trim(), password);
      router.replace("/(tabs)");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not register");
    } finally { setPending(false); }
  };
  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.brand}><BrandMark /><Text style={styles.brandName}>FocusFlow</Text></View>
        <View style={styles.copy}><Text style={styles.kicker}>START FRESH</Text><Text style={styles.title}>Plan a better week.</Text><Text style={styles.subtitle}>A few details now. A calmer schedule next.</Text></View>
        <Text style={styles.label}>Name</Text><TextInput style={styles.input} value={name} onChangeText={setName} placeholder="What should we call you?" placeholderTextColor={colors.placeholder} />
        <Text style={styles.label}>Email</Text><TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="you@example.com" placeholderTextColor={colors.placeholder} autoCapitalize="none" keyboardType="email-address" />
        <Text style={styles.label}>Password</Text><TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="At least 8 characters" placeholderTextColor={colors.placeholder} secureTextEntry />
        <Text style={styles.label}>Confirm password</Text><TextInput style={styles.input} value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Enter your password again" placeholderTextColor={colors.placeholder} secureTextEntry />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Pressable style={styles.button} onPress={() => void submit()} disabled={pending}>{pending ? <ActivityIndicator color="white" /> : <><Text style={styles.buttonText}>Create my account</Text><Ionicons name="arrow-forward" size={18} color="white" /></>}</Pressable>
        <Text style={styles.switch}>Already have an account? <Link href="/(auth)/login" style={styles.link}>Sign in</Link></Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper }, content: { paddingHorizontal: 24, paddingTop: 65, paddingBottom: 45 },
  brand: { flexDirection: "row", alignItems: "center", gap: 10 }, brandName: { fontSize: 21, fontWeight: "900", color: colors.ink },
  copy: { marginTop: 55, marginBottom: 20 }, kicker: { fontSize: 10, letterSpacing: 1.4, fontWeight: "800", color: colors.muted }, title: { fontSize: 38, fontWeight: "900", letterSpacing: -1.6, color: colors.ink, marginTop: 8 }, subtitle: { color: colors.muted, marginTop: 8 },
  label: { fontSize: 12, fontWeight: "700", color: colors.ink, marginBottom: 8, marginTop: 15 }, input: { height: 52, borderWidth: 1, borderColor: colors.line, borderRadius: 13, paddingHorizontal: 15, backgroundColor: colors.field, color: colors.ink },
  error: { marginTop: 14, color: colors.danger, backgroundColor: colors.dangerSurface, padding: 11, borderRadius: 9, fontSize: 12 },
  button: { height: 54, flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center", borderRadius: 14, backgroundColor: colors.forest, marginTop: 24 }, buttonText: { color: "white", fontWeight: "800" },
  switch: { textAlign: "center", color: colors.muted, marginTop: 24, fontSize: 13 }, link: { color: colors.lime, fontWeight: "800" },
});
