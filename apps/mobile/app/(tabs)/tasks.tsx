import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useAuth } from "../../src/auth/AuthContext";
import { colors } from "../../src/theme";
import type { Task } from "../../src/types";

export default function TasksScreen() {
  const { session, request } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [title, setTitle] = useState("");
  const [minutes, setMinutes] = useState("60");
  const load = useCallback(async () => {
    if (!session) return;
    try {
      setTasks(await request<Task[]>("/tasks?status=todo"));
    } finally {
      setLoading(false);
    }
  }, [request, session]);
  useEffect(() => { void load(); }, [load]);
  const create = async () => {
    if (!session || !title.trim()) return;
    const dueAt = new Date();
    dueAt.setDate(dueAt.getDate() + 7);
    const task = await request<Task>("/tasks", {
      method: "POST",
      body: JSON.stringify({
        title: title.trim(),
        category: "Study",
        dueAt,
        estimatedMinutes: Number(minutes) || 60,
        priority: 3,
        difficulty: 3,
      }),
    });
    setTasks((current) => [...current, task]);
    setTitle("");
    setModal(false);
  };
  return (
    <View style={styles.screen}>
      <View style={styles.header}><View><Text style={styles.kicker}>PRIORITIES</Text><Text style={styles.title}>Open tasks</Text></View><Pressable style={styles.add} onPress={() => setModal(true)}><Ionicons name="add" size={24} color="white" /></Pressable></View>
      {loading ? <ActivityIndicator color={colors.forest} /> : (
        <ScrollView contentContainerStyle={styles.list}>
          {tasks.map((task) => (
            <View style={styles.task} key={task.id}>
              <View style={styles.circle} />
              <View style={{ flex: 1 }}><Text style={styles.taskTitle}>{task.title}</Text><Text style={styles.meta}>{task.category} · {task.remainingMinutes} min</Text></View>
              <View style={[styles.priority, task.priority >= 4 && styles.urgent]}><Text style={styles.priorityText}>P{task.priority}</Text></View>
            </View>
          ))}
          {!tasks.length && <Text style={styles.empty}>No open tasks. That’s a good kind of quiet.</Text>}
        </ScrollView>
      )}
      <Modal visible={modal} transparent animationType="slide" onRequestClose={() => setModal(false)}>
        <View style={styles.backdrop}><View style={styles.sheet}>
          <View style={styles.sheetHead}><Text style={styles.sheetTitle}>Add a task</Text><Pressable onPress={() => setModal(false)}><Ionicons name="close" size={24} color={colors.ink} /></Pressable></View>
          <Text style={styles.label}>Task name</Text><TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Finish database chapter" />
          <Text style={styles.label}>Estimated minutes</Text><TextInput style={styles.input} value={minutes} onChangeText={setMinutes} keyboardType="number-pad" />
          <Pressable style={styles.save} onPress={() => void create()}><Text style={styles.saveText}>Add to FocusFlow</Text></Pressable>
        </View></View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper, paddingTop: 62, paddingHorizontal: 20 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  kicker: { fontSize: 10, letterSpacing: 1.5, fontWeight: "800", color: colors.muted },
  title: { fontSize: 30, fontWeight: "900", letterSpacing: -1.2, color: colors.ink, marginTop: 4 },
  add: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.forest, alignItems: "center", justifyContent: "center" },
  list: { paddingTop: 26, paddingBottom: 40, gap: 9 },
  task: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, borderRadius: 14, padding: 15 },
  circle: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: "#9aa39e" },
  taskTitle: { fontSize: 14, fontWeight: "800", color: colors.ink }, meta: { fontSize: 10, color: colors.muted, marginTop: 4 },
  priority: { backgroundColor: "#edf0ea", borderRadius: 7, paddingVertical: 5, paddingHorizontal: 8 }, urgent: { backgroundColor: "#fff0e5" }, priorityText: { fontSize: 10, fontWeight: "800", color: colors.muted },
  empty: { textAlign: "center", color: colors.muted, marginTop: 80 },
  backdrop: { flex: 1, backgroundColor: "#17251f66", justifyContent: "flex-end" }, sheet: { backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 42 },
  sheetHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, sheetTitle: { fontSize: 23, fontWeight: "900", color: colors.ink },
  label: { fontSize: 12, fontWeight: "700", color: colors.ink, marginTop: 20, marginBottom: 8 }, input: { height: 52, borderRadius: 12, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 14, backgroundColor: colors.paper },
  save: { height: 52, borderRadius: 14, backgroundColor: colors.forest, alignItems: "center", justifyContent: "center", marginTop: 24 }, saveText: { color: "white", fontWeight: "800" },
});
