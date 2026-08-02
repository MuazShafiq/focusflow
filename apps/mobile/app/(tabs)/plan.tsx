import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
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
import { ScheduleCalendar } from "../../src/components/ScheduleCalendar";
import { schedulePlanNotifications } from "../../src/lib/notifications";
import { colors } from "../../src/theme";
import type { Plan } from "../../src/types";

const dateKey = (value: Date) => {
  const local = new Date(value.getTime() - value.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
};

const planDates = (plan: Plan | null) => {
  if (!plan) return [];
  const start = new Date(plan.rangeStart);
  start.setHours(0, 0, 0, 0);
  const count = Math.max(
    1,
    Math.min(
      14,
      Math.ceil(
        (new Date(plan.rangeEnd).getTime() -
          new Date(plan.rangeStart).getTime()) /
          86_400_000,
      ),
    ),
  );
  return Array.from({ length: count }, (_, index) => {
    const value = new Date(start);
    value.setDate(start.getDate() + index);
    return value;
  });
};

export default function PlanScreen() {
  const { session, request } = useAuth();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [horizon, setHorizon] = useState<7 | 14>(7);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    if (!session) return;
    try {
      const next = await request<Plan | null>("/plans/current");
      setPlan(next);
      const dates = planDates(next);
      const today = new Date();
      setSelectedDate(
        dates.find((date) => dateKey(date) === dateKey(today)) ??
          dates[0] ??
          today,
      );
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
    setMessage("");
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + horizon);
    try {
      const next = await request<Plan>("/plans/generate", {
        method: "POST",
        body: JSON.stringify({ rangeStart: start, rangeEnd: end }),
      });
      setPlan(next);
      setSelectedDate(start);
      await schedulePlanNotifications(next.blocks);
      setMessage(`Your next ${horizon} days are ready.`);
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
    try {
      const next = await request<Plan>(
        `/plans/${plan.id}/blocks/${blockId}/feedback`,
        {
          method: "POST",
          body: JSON.stringify({ outcome: "completed", satisfaction: 4 }),
        },
      );
      setPlan(next);
      setMessage("Done. Future plans will learn from that.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not update the block",
      );
    }
  };

  const dates = useMemo(() => planDates(plan), [plan]);
  const selectedKey = dateKey(selectedDate);
  const blocks =
    plan?.blocks.filter(
      (block) => dateKey(new Date(block.startAt)) === selectedKey,
    ) ?? [];
  const clockFormat = session?.user.preferences.clockFormat ?? "12h";

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={() => void load()}
          tintColor={colors.mint}
        />
      }
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.kicker}>YOUR CALENDAR</Text>
          <Text style={styles.title}>My plan</Text>
        </View>
        <Pressable
          style={styles.generateButton}
          onPress={() => void generate()}
          disabled={generating}
          accessibilityLabel={`Generate a ${horizon} day plan`}
        >
          {generating ? (
            <ActivityIndicator color={colors.onAccent} size="small" />
          ) : (
            <Ionicons name="sparkles" size={18} color={colors.onAccent} />
          )}
        </Pressable>
      </View>

      <View style={styles.controls}>
        <Text style={styles.controlLabel}>PLAN LENGTH</Text>
        <View style={styles.segmented}>
          {([7, 14] as const).map((days) => (
            <Pressable
              key={days}
              onPress={() => setHorizon(days)}
              style={[styles.segment, horizon === days && styles.segmentActive]}
            >
              <Text
                style={[
                  styles.segmentText,
                  horizon === days && styles.segmentTextActive,
                ]}
              >
                {days} days
              </Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.controlHint}>
          Tap the sparkle button to rebuild using this length.
        </Text>
      </View>

      {message ? (
        <View style={styles.notice}>
          <Ionicons name="sparkles-outline" size={16} color={colors.mint} />
          <Text style={styles.noticeText}>{message}</Text>
        </View>
      ) : null}

      {loading ? (
        <ActivityIndicator style={styles.loader} color={colors.mint} />
      ) : plan ? (
        <>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dateStrip}
            style={styles.dateStripScroll}
          >
            {dates.map((date) => {
              const selected = dateKey(date) === selectedKey;
              const today = dateKey(date) === dateKey(new Date());
              return (
                <Pressable
                  key={dateKey(date)}
                  style={[styles.datePill, selected && styles.datePillSelected]}
                  onPress={() => setSelectedDate(date)}
                >
                  <Text
                    style={[
                      styles.dateDay,
                      selected && styles.dateTextSelected,
                    ]}
                  >
                    {new Intl.DateTimeFormat(undefined, {
                      weekday: "short",
                    }).format(date)}
                  </Text>
                  <Text
                    style={[
                      styles.dateNumber,
                      selected && styles.dateTextSelected,
                    ]}
                  >
                    {date.getDate()}
                  </Text>
                  {today ? <View style={styles.todayDot} /> : null}
                </Pressable>
              );
            })}
          </ScrollView>
          <View style={styles.sectionHead}>
            <View>
              <Text style={styles.kicker}>DAY VIEW</Text>
              <Text style={styles.sectionTitle}>
                {new Intl.DateTimeFormat(undefined, {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                }).format(selectedDate)}
              </Text>
            </View>
            <Text style={styles.blockCount}>
              {blocks.length} {blocks.length === 1 ? "block" : "blocks"}
            </Text>
          </View>
          {blocks.length ? (
            <ScheduleCalendar
              blocks={blocks}
              date={selectedDate}
              clockFormat={clockFormat}
              dayStart={session?.user.preferences.dayStart ?? "07:00"}
              dayEnd={session?.user.preferences.dayEnd ?? "23:00"}
              onComplete={(blockId) => void completeBlock(blockId)}
            />
          ) : (
            <View style={styles.empty}>
              <Ionicons name="leaf-outline" size={30} color={colors.mint} />
              <Text style={styles.emptyTitle}>Nothing planned here.</Text>
              <Text style={styles.emptyText}>
                This day is open, or your tasks did not need this slot.
              </Text>
            </View>
          )}
        </>
      ) : (
        <View style={styles.empty}>
          <Ionicons name="calendar-outline" size={32} color={colors.mint} />
          <Text style={styles.emptyTitle}>No plan yet.</Text>
          <Text style={styles.emptyText}>
            Choose seven or fourteen days and build your first plan.
          </Text>
          <Pressable style={styles.emptyButton} onPress={() => void generate()}>
            <Text style={styles.emptyButtonText}>Generate my plan</Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  content: { paddingHorizontal: 18, paddingTop: 58, paddingBottom: 42 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  kicker: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  title: {
    marginTop: 4,
    color: colors.ink,
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: -1.2,
  },
  generateButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: colors.lime,
  },
  controls: {
    marginTop: 21,
    padding: 13,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    backgroundColor: colors.card,
  },
  controlLabel: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.1,
  },
  segmented: {
    flexDirection: "row",
    gap: 5,
    marginTop: 9,
    padding: 4,
    borderRadius: 10,
    backgroundColor: colors.field,
  },
  segment: {
    flex: 1,
    height: 31,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  segmentActive: { backgroundColor: colors.subtle },
  segmentText: { color: colors.muted, fontSize: 11, fontWeight: "700" },
  segmentTextActive: { color: colors.mint },
  controlHint: { marginTop: 7, color: colors.muted, fontSize: 9 },
  notice: {
    flexDirection: "row",
    gap: 8,
    marginTop: 13,
    padding: 11,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 11,
    backgroundColor: colors.subtle,
  },
  noticeText: { flex: 1, color: colors.mint, fontSize: 11 },
  loader: { marginTop: 60 },
  dateStripScroll: { marginHorizontal: -18, marginTop: 17 },
  dateStrip: { gap: 8, paddingHorizontal: 18, paddingBottom: 4 },
  datePill: {
    width: 54,
    height: 68,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    backgroundColor: colors.card,
  },
  datePillSelected: {
    borderColor: colors.mint,
    backgroundColor: colors.subtle,
  },
  dateDay: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  dateNumber: {
    marginTop: 3,
    color: colors.ink,
    fontSize: 18,
    fontWeight: "800",
  },
  dateTextSelected: { color: colors.mint },
  todayDot: {
    position: "absolute",
    bottom: 5,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.lime,
  },
  sectionHead: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 22,
    marginBottom: 13,
  },
  sectionTitle: {
    marginTop: 4,
    color: colors.ink,
    fontSize: 17,
    fontWeight: "800",
  },
  blockCount: { color: colors.muted, fontSize: 10 },
  empty: {
    alignItems: "center",
    marginTop: 18,
    padding: 34,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 17,
    backgroundColor: colors.card,
  },
  emptyTitle: {
    marginTop: 10,
    color: colors.ink,
    fontSize: 18,
    fontWeight: "800",
  },
  emptyText: {
    marginTop: 5,
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },
  emptyButton: {
    marginTop: 16,
    paddingHorizontal: 17,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: colors.lime,
  },
  emptyButtonText: { color: colors.onAccent, fontSize: 11, fontWeight: "800" },
});
