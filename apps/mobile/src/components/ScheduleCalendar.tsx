import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme";
import type { ScheduleBlock, UserPreferences } from "../types";

const HOUR_HEIGHT = 76;
const TIME_AXIS_WIDTH = 52;

const accents: Record<ScheduleBlock["type"], string> = {
  task: colors.mint,
  commitment: "#91A6BB",
  exercise: colors.lime,
  meal: colors.apricot,
  break: colors.violet,
  leisure: colors.violet,
};

const surfaces: Record<ScheduleBlock["type"], string> = {
  task: "#102A3A",
  commitment: "#1B2936",
  exercise: "#073344",
  meal: "#30241D",
  break: "#25243A",
  leisure: "#25243A",
};

const minutesSinceMidnight = (date: Date) =>
  date.getHours() * 60 + date.getMinutes();

const clockMinutes = (value: string) => {
  const [hour = "0", minute = "0"] = value.split(":");
  return Number(hour) * 60 + Number(minute);
};

const formatTime = (
  value: string | Date,
  clockFormat: UserPreferences["clockFormat"],
) =>
  new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    hour12: clockFormat === "12h",
  }).format(new Date(value));

export function ScheduleCalendar({
  blocks,
  date,
  clockFormat,
  dayStart,
  dayEnd,
  onComplete,
}: {
  blocks: ScheduleBlock[];
  date: Date;
  clockFormat: UserPreferences["clockFormat"];
  dayStart: string;
  dayEnd: string;
  onComplete(blockId: string): void;
}) {
  const [selected, setSelected] = useState<ScheduleBlock | null>(null);
  const { startHour, endHour, hours } = useMemo(() => {
    const blockStarts = blocks.map((block) =>
      minutesSinceMidnight(new Date(block.startAt)),
    );
    const blockEnds = blocks.map((block) =>
      minutesSinceMidnight(new Date(block.endAt)),
    );
    const first = Math.max(
      0,
      Math.floor(Math.min(clockMinutes(dayStart), ...blockStarts) / 60),
    );
    const last = Math.min(
      24,
      Math.max(
        first + 4,
        Math.ceil(Math.max(clockMinutes(dayEnd), ...blockEnds) / 60),
      ),
    );
    return {
      startHour: first,
      endHour: last,
      hours: Array.from({ length: last - first }, (_, index) => first + index),
    };
  }, [blocks, dayEnd, dayStart]);

  const height = (endHour - startHour) * HOUR_HEIGHT;
  const now = new Date();
  const showNow =
    date.toDateString() === now.toDateString() &&
    minutesSinceMidnight(now) >= startHour * 60 &&
    minutesSinceMidnight(now) <= endHour * 60;

  return (
    <View>
      <View style={styles.frame}>
        <View style={styles.dayHeader}>
          <Text style={styles.dayName}>
            {new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(
              date,
            )}
          </Text>
          <Text style={styles.dayNumber}>{date.getDate()}</Text>
          <Text style={styles.dayDate}>
            {new Intl.DateTimeFormat(undefined, {
              month: "short",
              day: "numeric",
            }).format(date)}
          </Text>
        </View>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{ minHeight: height }}
          nestedScrollEnabled
          showsVerticalScrollIndicator
        >
          <View style={[styles.timeline, { height }]}>
            <View style={[styles.axis, { width: TIME_AXIS_WIDTH, height }]}>
              {hours.map((hour) => {
                const value = new Date();
                value.setHours(hour, 0, 0, 0);
                return (
                  <Text
                    key={hour}
                    style={[
                      styles.hourLabel,
                      { top: (hour - startHour) * HOUR_HEIGHT - 6 },
                    ]}
                  >
                    {new Intl.DateTimeFormat(undefined, {
                      hour: "numeric",
                      hour12: clockFormat === "12h",
                    }).format(value)}
                  </Text>
                );
              })}
            </View>
            <View style={[styles.canvas, { height }]}>
              {hours.map((hour) => (
                <View
                  key={hour}
                  style={[
                    styles.hourLine,
                    { top: (hour - startHour) * HOUR_HEIGHT },
                  ]}
                />
              ))}
              {showNow ? (
                <View
                  style={[
                    styles.nowLine,
                    {
                      top:
                        ((minutesSinceMidnight(now) - startHour * 60) / 60) *
                        HOUR_HEIGHT,
                    },
                  ]}
                >
                  <View style={styles.nowDot} />
                </View>
              ) : null}
              {blocks.map((block) => {
                const start = new Date(block.startAt);
                const end = new Date(block.endAt);
                const duration = Math.max(
                  1,
                  (end.getTime() - start.getTime()) / 60_000,
                );
                const top =
                  ((minutesSinceMidnight(start) - startHour * 60) / 60) *
                  HOUR_HEIGHT;
                const blockHeight = Math.max(
                  22,
                  (duration / 60) * HOUR_HEIGHT - 3,
                );
                const compact = blockHeight < 43;
                return (
                  <Pressable
                    key={block.id}
                    onPress={() => setSelected(block)}
                    style={[
                      styles.event,
                      {
                        top,
                        height: blockHeight,
                        borderLeftColor: accents[block.type],
                        backgroundColor: surfaces[block.type],
                      },
                      selected?.id === block.id && {
                        borderColor: accents[block.type],
                      },
                      block.status === "completed" && styles.completedEvent,
                    ]}
                  >
                    <Text
                      style={styles.eventTitle}
                      numberOfLines={compact ? 1 : 2}
                    >
                      {block.title}
                    </Text>
                    {!compact ? (
                      <Text
                        style={[
                          styles.eventTime,
                          { color: accents[block.type] },
                        ]}
                        numberOfLines={1}
                      >
                        {formatTime(start, clockFormat)}–
                        {formatTime(end, clockFormat)}
                      </Text>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          </View>
        </ScrollView>
      </View>
      {selected ? (
        <View style={styles.details}>
          <View
            style={[
              styles.detailAccent,
              { backgroundColor: accents[selected.type] },
            ]}
          />
          <View style={styles.detailCopy}>
            <Text style={styles.detailTitle}>{selected.title}</Text>
            <Text
              style={[styles.detailTime, { color: accents[selected.type] }]}
            >
              {formatTime(selected.startAt, clockFormat)}–
              {formatTime(selected.endAt, clockFormat)}
            </Text>
            <Text style={styles.detailReason}>{selected.rationale}</Text>
          </View>
          <View style={styles.detailActions}>
            {selected.status === "planned" ? (
              <Pressable
                style={styles.complete}
                onPress={() => {
                  onComplete(selected.id);
                  setSelected(null);
                }}
                accessibilityLabel="Mark block complete"
              >
                <Ionicons name="checkmark" size={17} color={colors.mint} />
              </Pressable>
            ) : null}
            <Pressable
              style={styles.close}
              onPress={() => setSelected(null)}
              accessibilityLabel="Close block details"
            >
              <Ionicons name="close" size={17} color={colors.muted} />
            </Pressable>
          </View>
        </View>
      ) : (
        <Text style={styles.hint}>Tap any block for full details.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 16,
    backgroundColor: "#08131D",
  },
  dayHeader: {
    height: 62,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    backgroundColor: "#0C1924",
  },
  dayName: {
    color: colors.mint,
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  dayNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    textAlign: "center",
    textAlignVertical: "center",
    backgroundColor: colors.lime,
    color: colors.onAccent,
    fontSize: 15,
    fontWeight: "900",
  },
  dayDate: { color: colors.muted, fontSize: 10 },
  scroll: { maxHeight: 570 },
  timeline: { flexDirection: "row" },
  axis: {
    position: "relative",
    borderRightWidth: 1,
    borderRightColor: colors.line,
    backgroundColor: "#091720",
  },
  hourLabel: {
    position: "absolute",
    right: 7,
    color: colors.muted,
    fontSize: 9,
  },
  canvas: { flex: 1, position: "relative" },
  hourLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "#263A4D",
  },
  nowLine: {
    position: "absolute",
    zIndex: 4,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.danger,
  },
  nowDot: {
    position: "absolute",
    left: -4,
    top: -4,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.danger,
  },
  event: {
    position: "absolute",
    zIndex: 2,
    left: 6,
    right: 6,
    overflow: "hidden",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "transparent",
    borderLeftWidth: 4,
    borderRadius: 8,
  },
  completedEvent: { opacity: 0.55 },
  eventTitle: {
    color: colors.ink,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "800",
  },
  eventTime: { marginTop: 2, fontSize: 9, fontWeight: "700" },
  details: {
    flexDirection: "row",
    gap: 11,
    marginTop: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 13,
    backgroundColor: colors.card,
  },
  detailAccent: { width: 4, borderRadius: 3 },
  detailCopy: { flex: 1 },
  detailTitle: { color: colors.ink, fontSize: 13, fontWeight: "800" },
  detailTime: { marginTop: 3, fontSize: 10, fontWeight: "700" },
  detailReason: {
    marginTop: 5,
    color: colors.muted,
    fontSize: 10,
    lineHeight: 15,
  },
  detailActions: { gap: 6 },
  complete: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: colors.subtle,
  },
  close: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  hint: {
    marginTop: 9,
    color: colors.muted,
    fontSize: 10,
    textAlign: "center",
  },
});
