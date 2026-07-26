import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useAuth } from "../../src/auth/AuthContext";
import { schedulePlanNotifications } from "../../src/lib/notifications";
import { colors } from "../../src/theme";
import type { Plan, ScheduleBlock, Task } from "../../src/types";

const formatTime = (value: string) =>
  new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));

const accents: Record<ScheduleBlock["type"], string> = {
  task: colors.mint,
  commitment: "#c8d3df",
  exercise: colors.lime,
  meal: colors.apricot,
  break: colors.violet,
  leisure: colors.violet,
};

export default function TodayScreen() {
  const { session, request } = useAuth();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    if (!session) return;
    try {
      const [nextPlan, nextTasks] = await Promise.all([
        request<Plan | null>("/plans/current"),
        request<Task[]>("/tasks?status=todo"),
      ]);
      setPlan(nextPlan);
      setTasks(nextTasks);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not sync");
    } finally {
      setLoading(false);
    }
  }, [request, session]);

  useEffect(() => {
    void load();
  }, [load]);

  const generate = async () => {
    if (!session) return;
    setGenerating(true);
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    try {
      const nextPlan = await request<Plan>("/plans/generate", {
        method: "POST",
        body: JSON.stringify({ rangeStart: start, rangeEnd: end }),
      });
      setPlan(nextPlan);
      await schedulePlanNotifications(nextPlan.blocks);
      setMessage("Your week is ready.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not create your plan",
      );
    } finally {
      setGenerating(false);
    }
  };

  const completeBlock = async (blockId: string) => {
    if (!plan) return;
    const next = await request<Plan>(
      `/plans/${plan.id}/blocks/${blockId}/feedback`,
      {
        method: "POST",
        body: JSON.stringify({ outcome: "completed", satisfaction: 4 }),
      },
    );
    setPlan(next);
    setMessage("Done. Your next plan will learn from that.");
  };

  const now = new Date();
  const today =
    plan?.blocks.filter(
      (block) => new Date(block.startAt).toDateString() === now.toDateString(),
    ) ?? [];
  const firstName = session?.user.displayName.split(" ")[0] ?? "there";

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={() => void load()}
          tintColor={colors.forest}
        />
      }
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.kicker}>YOUR DAY</Text>
          <Text style={styles.title}>Morning, {firstName}.</Text>
        </View>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{firstName[0]?.toUpperCase()}</Text>
        </View>
      </View>
      {message ? (
        <View style={styles.notice}>
          <Ionicons
            name="sparkles-outline"
            size={16}
            color={colors.forest}
          />
          <Text style={styles.noticeText}>{message}</Text>
        </View>
      ) : null}
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>OPEN TASKS</Text>
          <Text style={styles.summaryValue}>{tasks.length}</Text>
          <Text style={styles.summaryMeta}>across your week</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>TODAY</Text>
          <Text style={styles.summaryValue}>{today.length}</Text>
          <Text style={styles.summaryMeta}>balanced blocks</Text>
        </View>
      </View>
      <Pressable
        style={styles.planButton}
        onPress={() => void generate()}
        disabled={generating}
      >
        {generating ? (
          <ActivityIndicator color={colors.forest} />
        ) : (
          <Ionicons name="sparkles" size={18} color={colors.forest} />
        )}
        <Text style={styles.planButtonText}>
          {generating ? "Finding your best rhythm…" : "Plan my week"}
        </Text>
      </Pressable>
      <View style={styles.sectionHead}>
        <View>
          <Text style={styles.kicker}>YOUR RHYTHM</Text>
          <Text style={styles.sectionTitle}>Today’s flow</Text>
        </View>
        <Text style={styles.date}>
          {new Intl.DateTimeFormat(undefined, {
            month: "short",
            day: "numeric",
          }).format(now)}
        </Text>
      </View>
      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.forest} />
      ) : today.length ? (
        today.map((block) => (
          <View style={styles.blockRow} key={block.id}>
            <Text style={styles.blockTime}>{formatTime(block.startAt)}</Text>
            <View
              style={[
                styles.blockCard,
                { borderLeftColor: accents[block.type] },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.blockTitle}>{block.title}</Text>
                <Text style={styles.blockReason} numberOfLines={2}>
                  {block.rationale}
                </Text>
              </View>
              <View style={styles.blockAside}>
                <Text style={styles.blockMinutes}>
                  {Math.round(
                    (new Date(block.endAt).getTime() -
                      new Date(block.startAt).getTime()) /
                      60_000,
                  )}
                  m
                </Text>
                {block.status === "planned" ? (
                  <Pressable
                    style={styles.complete}
                    onPress={() => void completeBlock(block.id)}
                  >
                    <Ionicons name="checkmark" size={15} color={colors.forest} />
                  </Pressable>
                ) : null}
              </View>
            </View>
          </View>
        ))
      ) : (
        <View style={styles.empty}>
          <Ionicons name="leaf-outline" size={30} color={colors.forest} />
          <Text style={styles.emptyTitle}>Your day is open.</Text>
          <Text style={styles.emptyText}>
            Add tasks, then let FocusFlow build a balanced first week.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  content: { paddingHorizontal: 20, paddingTop: 62, paddingBottom: 40 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  kicker: {
    fontSize: 10,
    letterSpacing: 1.5,
    fontWeight: "800",
    color: colors.muted,
  },
  title: {
    fontSize: 30,
    letterSpacing: -1.2,
    fontWeight: "800",
    color: colors.ink,
    marginTop: 4,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.mint,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontWeight: "800", color: colors.forest },
  notice: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: "#e9f1df",
    padding: 12,
    borderRadius: 12,
    marginTop: 18,
  },
  noticeText: { flex: 1, fontSize: 12, color: colors.forest },
  summaryRow: { flexDirection: "row", gap: 12, marginTop: 24 },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
  },
  summaryLabel: {
    fontSize: 9,
    letterSpacing: 1.2,
    fontWeight: "800",
    color: colors.muted,
  },
  summaryValue: {
    fontSize: 30,
    fontWeight: "800",
    color: colors.ink,
    marginTop: 5,
  },
  summaryMeta: { fontSize: 10, color: colors.muted },
  planButton: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    backgroundColor: colors.lime,
    borderRadius: 15,
    marginTop: 13,
  },
  planButtonText: { fontWeight: "800", color: colors.forest },
  sectionHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 30,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 21,
    fontWeight: "800",
    color: colors.ink,
    marginTop: 3,
  },
  date: { color: colors.muted, fontSize: 12 },
  blockRow: {
    flexDirection: "row",
    gap: 11,
    marginBottom: 9,
    alignItems: "flex-start",
  },
  blockTime: {
    width: 52,
    fontSize: 11,
    color: colors.muted,
    marginTop: 15,
  },
  blockCard: {
    flex: 1,
    minHeight: 64,
    flexDirection: "row",
    gap: 8,
    backgroundColor: colors.card,
    borderRadius: 12,
    borderLeftWidth: 5,
    padding: 13,
  },
  blockTitle: { fontSize: 13, fontWeight: "800", color: colors.ink },
  blockReason: {
    fontSize: 10,
    color: colors.muted,
    marginTop: 3,
    lineHeight: 14,
  },
  blockMinutes: { fontSize: 10, color: colors.muted },
  blockAside: { alignItems: "flex-end", gap: 8 },
  complete: {
    width: 27,
    height: 27,
    borderRadius: 8,
    backgroundColor: "#eef3e7",
    alignItems: "center",
    justifyContent: "center",
  },
  empty: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 17,
    padding: 35,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginTop: 10,
    color: colors.ink,
  },
  emptyText: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    color: colors.muted,
    marginTop: 5,
  },
});
