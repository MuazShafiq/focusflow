import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../theme";
import type { UserPreferences } from "../types";

interface PreferencesEditorProps {
  visible: boolean;
  preferences: UserPreferences;
  onClose(): void;
  onSave(preferences: UserPreferences): Promise<void>;
}

interface PreferenceDraft {
  clockFormat: UserPreferences["clockFormat"];
  dayStart: string;
  dayEnd: string;
  focusSessionMinutes: string;
  shortBreakMinutes: string;
  preferredStudyTime: UserPreferences["preferredStudyTime"];
  exerciseMinutesPerWeek: string;
  leisureMinutesPerDay: string;
  autoScheduleLifestyle: boolean;
}

const formatTimeInput = (
  value: string,
  clockFormat: UserPreferences["clockFormat"],
) => {
  if (clockFormat === "24h") return value;
  const [hourValue, minute = "00"] = value.split(":");
  const hour = Number(hourValue);
  return `${hour % 12 || 12}:${minute} ${hour >= 12 ? "PM" : "AM"}`;
};

const parseTimeInput = (
  value: string,
  clockFormat: UserPreferences["clockFormat"],
) => {
  const normalized = value.trim();
  if (clockFormat === "24h") {
    const match = normalized.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
    if (!match) return null;
    return `${match[1].padStart(2, "0")}:${match[2]}`;
  }

  const match = normalized.match(/^(0?[1-9]|1[0-2]):([0-5]\d)\s*([ap]m)$/i);
  if (!match) return null;
  let hour = Number(match[1]) % 12;
  if (match[3].toUpperCase() === "PM") hour += 12;
  return `${String(hour).padStart(2, "0")}:${match[2]}`;
};

const makeDraft = (preferences: UserPreferences): PreferenceDraft => ({
  clockFormat: preferences.clockFormat,
  dayStart: formatTimeInput(preferences.dayStart, preferences.clockFormat),
  dayEnd: formatTimeInput(preferences.dayEnd, preferences.clockFormat),
  focusSessionMinutes: String(preferences.focusSessionMinutes),
  shortBreakMinutes: String(preferences.shortBreakMinutes),
  preferredStudyTime: preferences.preferredStudyTime,
  exerciseMinutesPerWeek: String(preferences.exerciseMinutesPerWeek),
  leisureMinutesPerDay: String(preferences.leisureMinutesPerDay),
  autoScheduleLifestyle: preferences.autoScheduleLifestyle,
});

const parseBoundedInteger = (
  value: string,
  minimum: number,
  maximum: number,
) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= minimum && parsed <= maximum
    ? parsed
    : null;
};

export const PreferencesEditor = ({
  visible,
  preferences,
  onClose,
  onSave,
}: PreferencesEditorProps) => {
  const initialDraft = useMemo(() => makeDraft(preferences), [preferences]);
  const [draft, setDraft] = useState(initialDraft);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const close = () => {
    if (saving) return;
    setDraft(makeDraft(preferences));
    setError("");
    onClose();
  };

  const changeClockFormat = (
    clockFormat: UserPreferences["clockFormat"],
  ) => {
    setDraft((current) => {
      const dayStart =
        parseTimeInput(current.dayStart, current.clockFormat) ??
        preferences.dayStart;
      const dayEnd =
        parseTimeInput(current.dayEnd, current.clockFormat) ??
        preferences.dayEnd;
      return {
        ...current,
        clockFormat,
        dayStart: formatTimeInput(dayStart, clockFormat),
        dayEnd: formatTimeInput(dayEnd, clockFormat),
      };
    });
  };

  const submit = async () => {
    const dayStart = parseTimeInput(draft.dayStart, draft.clockFormat);
    const dayEnd = parseTimeInput(draft.dayEnd, draft.clockFormat);
    const focusSessionMinutes = parseBoundedInteger(
      draft.focusSessionMinutes,
      20,
      120,
    );
    const shortBreakMinutes = parseBoundedInteger(
      draft.shortBreakMinutes,
      5,
      30,
    );
    const exerciseMinutesPerWeek = parseBoundedInteger(
      draft.exerciseMinutesPerWeek,
      0,
      840,
    );
    const leisureMinutesPerDay = parseBoundedInteger(
      draft.leisureMinutesPerDay,
      0,
      240,
    );

    if (!dayStart || !dayEnd) {
      setError(
        draft.clockFormat === "12h"
          ? "Enter times like 7:30 AM or 8:00 PM."
          : "Enter times in 24-hour HH:MM format.",
      );
      return;
    }
    if (
      focusSessionMinutes === null ||
      shortBreakMinutes === null ||
      exerciseMinutesPerWeek === null ||
      leisureMinutesPerDay === null
    ) {
      setError("Check the allowed number ranges shown beneath each field.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      await onSave({
        ...preferences,
        clockFormat: draft.clockFormat,
        dayStart,
        dayEnd,
        focusSessionMinutes,
        shortBreakMinutes,
        preferredStudyTime: draft.preferredStudyTime,
        exerciseMinutesPerWeek,
        leisureMinutesPerDay,
        autoScheduleLifestyle: draft.autoScheduleLifestyle,
      });
      onClose();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not save preferences",
      );
    } finally {
      setSaving(false);
    }
  };

  const timePlaceholder =
    draft.clockFormat === "12h" ? "7:30 AM" : "07:30";

  return (
    <Modal
      animationType="slide"
      onRequestClose={close}
      statusBarTranslucent
      visible={visible}
    >
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.keyboardView}
        >
          <View style={styles.header}>
            <View>
              <Text style={styles.kicker}>YOUR RHYTHM</Text>
              <Text style={styles.title}>Planning preferences</Text>
            </View>
            <Pressable
              accessibilityLabel="Close preferences"
              disabled={saving}
              onPress={close}
              style={styles.close}
            >
              <Ionicons name="close" size={22} color={colors.ink} />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.label}>Clock format</Text>
            <View style={styles.options}>
              {(["12h", "24h"] as const).map((clockFormat) => (
                <Pressable
                  key={clockFormat}
                  onPress={() => changeClockFormat(clockFormat)}
                  style={[
                    styles.option,
                    draft.clockFormat === clockFormat && styles.optionActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.optionText,
                      draft.clockFormat === clockFormat &&
                        styles.optionTextActive,
                    ]}
                  >
                    {clockFormat === "12h" ? "12-hour" : "24-hour"}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.fieldRow}>
              <View style={styles.fieldColumn}>
                <Text style={styles.label}>Day starts</Text>
                <TextInput
                  autoCapitalize="characters"
                  onChangeText={(dayStart) =>
                    setDraft((current) => ({ ...current, dayStart }))
                  }
                  placeholder={timePlaceholder}
                  placeholderTextColor={colors.placeholder}
                  style={styles.input}
                  value={draft.dayStart}
                />
              </View>
              <View style={styles.fieldColumn}>
                <Text style={styles.label}>Day ends</Text>
                <TextInput
                  autoCapitalize="characters"
                  onChangeText={(dayEnd) =>
                    setDraft((current) => ({ ...current, dayEnd }))
                  }
                  placeholder={timePlaceholder}
                  placeholderTextColor={colors.placeholder}
                  style={styles.input}
                  value={draft.dayEnd}
                />
              </View>
            </View>

            <View style={styles.fieldRow}>
              <NumberField
                help="20–120 minutes"
                label="Focus session"
                onChangeText={(focusSessionMinutes) =>
                  setDraft((current) => ({
                    ...current,
                    focusSessionMinutes,
                  }))
                }
                value={draft.focusSessionMinutes}
              />
              <NumberField
                help="5–30 minutes"
                label="Short break"
                onChangeText={(shortBreakMinutes) =>
                  setDraft((current) => ({
                    ...current,
                    shortBreakMinutes,
                  }))
                }
                value={draft.shortBreakMinutes}
              />
            </View>

            <Text style={styles.label}>Strongest study time</Text>
            <View style={styles.options}>
              {(["morning", "afternoon", "evening"] as const).map(
                (studyTime) => (
                  <Pressable
                    key={studyTime}
                    onPress={() =>
                      setDraft((current) => ({
                        ...current,
                        preferredStudyTime: studyTime,
                      }))
                    }
                    style={[
                      styles.option,
                      draft.preferredStudyTime === studyTime &&
                        styles.optionActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        draft.preferredStudyTime === studyTime &&
                          styles.optionTextActive,
                      ]}
                    >
                      {studyTime[0].toUpperCase() + studyTime.slice(1)}
                    </Text>
                  </Pressable>
                ),
              )}
            </View>

            <View style={styles.fieldRow}>
              <NumberField
                help="0–840 minutes"
                label="Exercise / week"
                onChangeText={(exerciseMinutesPerWeek) =>
                  setDraft((current) => ({
                    ...current,
                    exerciseMinutesPerWeek,
                  }))
                }
                value={draft.exerciseMinutesPerWeek}
              />
              <NumberField
                help="0–240 minutes"
                label="Leisure / day"
                onChangeText={(leisureMinutesPerDay) =>
                  setDraft((current) => ({
                    ...current,
                    leisureMinutesPerDay,
                  }))
                }
                value={draft.leisureMinutesPerDay}
              />
            </View>

            <View style={styles.switchRow}>
              <View style={styles.switchCopy}>
                <Text style={styles.switchTitle}>Plan lifestyle automatically</Text>
                <Text style={styles.help}>
                  Protect meals, movement, breaks and leisure.
                </Text>
              </View>
              <Switch
                onValueChange={(autoScheduleLifestyle) =>
                  setDraft((current) => ({
                    ...current,
                    autoScheduleLifestyle,
                  }))
                }
                thumbColor={
                  draft.autoScheduleLifestyle ? colors.lime : colors.muted
                }
                trackColor={{ false: colors.line, true: colors.forest }}
                value={draft.autoScheduleLifestyle}
              />
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Pressable
              disabled={saving}
              onPress={() => void submit()}
              style={[styles.save, saving && styles.saveDisabled]}
            >
              {saving ? (
                <ActivityIndicator color={colors.onAccent} />
              ) : (
                <>
                  <Ionicons
                    name="checkmark"
                    size={19}
                    color={colors.onAccent}
                  />
                  <Text style={styles.saveText}>Save preferences</Text>
                </>
              )}
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

interface NumberFieldProps {
  label: string;
  help: string;
  value: string;
  onChangeText(value: string): void;
}

const NumberField = ({
  label,
  help,
  value,
  onChangeText,
}: NumberFieldProps) => (
  <View style={styles.fieldColumn}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      keyboardType="number-pad"
      onChangeText={onChangeText}
      placeholderTextColor={colors.placeholder}
      style={styles.input}
      value={value}
    />
    <Text style={styles.help}>{help}</Text>
  </View>
);

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.paper },
  keyboardView: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  kicker: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.4,
  },
  title: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.7,
    marginTop: 3,
  },
  close: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
  },
  content: { padding: 20, paddingBottom: 36 },
  label: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 8,
    marginTop: 18,
  },
  options: { flexDirection: "row", gap: 8 },
  option: {
    flex: 1,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 11,
    backgroundColor: colors.field,
  },
  optionActive: {
    borderColor: colors.mint,
    backgroundColor: colors.subtle,
  },
  optionText: { color: colors.muted, fontSize: 11, fontWeight: "800" },
  optionTextActive: { color: colors.mint },
  fieldRow: { flexDirection: "row", gap: 12 },
  fieldColumn: { flex: 1 },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: colors.field,
    color: colors.ink,
    fontSize: 14,
  },
  help: { color: colors.muted, fontSize: 9, marginTop: 6, lineHeight: 13 },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 15,
    marginTop: 24,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 13,
    backgroundColor: colors.card,
  },
  switchCopy: { flex: 1 },
  switchTitle: { color: colors.ink, fontSize: 13, fontWeight: "800" },
  error: {
    color: colors.danger,
    backgroundColor: colors.dangerSurface,
    padding: 12,
    borderRadius: 10,
    marginTop: 16,
    fontSize: 12,
    lineHeight: 17,
  },
  save: {
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 22,
    borderRadius: 14,
    backgroundColor: colors.lime,
  },
  saveDisabled: { opacity: 0.65 },
  saveText: { color: colors.onAccent, fontWeight: "900" },
});
