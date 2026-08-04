export interface CommitmentTemplate {
  id: string;
  title: string;
  category: string;
  startAt: Date;
  endAt: Date;
  recurrence?: "none" | "weekly";
  recurrenceDays?: number[];
}

export interface ExpandedCommitment {
  id: string;
  title: string;
  category: string;
  startAt: Date;
  endAt: Date;
}

interface DateParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

const partsInTimeZone = (date: Date, timeZone: string): DateParts => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hourCycle: "h23",
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);

  return {
    year: value("year"),
    month: value("month"),
    day: value("day"),
    hour: value("hour"),
    minute: value("minute"),
    second: value("second"),
  };
};

const timeZoneOffset = (date: Date, timeZone: string) => {
  const parts = partsInTimeZone(date, timeZone);
  return (
    Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second,
    ) - date.getTime()
  );
};

const localDateTimeToUtc = (parts: DateParts, timeZone: string) => {
  const guess = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );
  let result = new Date(guess - timeZoneOffset(new Date(guess), timeZone));
  const correctedOffset = timeZoneOffset(result, timeZone);
  result = new Date(guess - correctedOffset);
  return result;
};

const calendarKey = ({ year, month, day }: DateParts) =>
  year * 10_000 + month * 100 + day;

export const expandCommitments = (
  commitments: CommitmentTemplate[],
  rangeStart: Date,
  rangeEnd: Date,
  timeZone: string,
): ExpandedCommitment[] =>
  commitments.flatMap((commitment) => {
    if (
      commitment.recurrence !== "weekly" ||
      !commitment.recurrenceDays?.length
    ) {
      return [{
        id: commitment.id,
        title: commitment.title,
        category: commitment.category,
        startAt: commitment.startAt,
        endAt: commitment.endAt,
      }];
    }

    const firstDate = partsInTimeZone(commitment.startAt, timeZone);
    const startTime = partsInTimeZone(commitment.startAt, timeZone);
    const endTime = partsInTimeZone(commitment.endAt, timeZone);
    const rangeDate = partsInTimeZone(rangeStart, timeZone);
    const cursor = new Date(
      Date.UTC(rangeDate.year, rangeDate.month - 1, rangeDate.day),
    );
    const lastDate = partsInTimeZone(rangeEnd, timeZone);
    const lastCalendarKey = calendarKey(lastDate);
    const occurrences: ExpandedCommitment[] = [];

    while (
      calendarKey({
        ...rangeDate,
        year: cursor.getUTCFullYear(),
        month: cursor.getUTCMonth() + 1,
        day: cursor.getUTCDate(),
      }) <= lastCalendarKey
    ) {
      const dateParts = {
        year: cursor.getUTCFullYear(),
        month: cursor.getUTCMonth() + 1,
        day: cursor.getUTCDate(),
      };
      if (
        calendarKey({ ...rangeDate, ...dateParts }) >=
          calendarKey(firstDate) &&
        commitment.recurrenceDays.includes(cursor.getUTCDay())
      ) {
        const startAt = localDateTimeToUtc(
          { ...dateParts, hour: startTime.hour, minute: startTime.minute, second: 0 },
          timeZone,
        );
        const endAt = localDateTimeToUtc(
          { ...dateParts, hour: endTime.hour, minute: endTime.minute, second: 0 },
          timeZone,
        );
        if (startAt < rangeEnd && endAt > rangeStart) {
          occurrences.push({
            id: `${commitment.id}:${startAt.toISOString()}`,
            title: commitment.title,
            category: commitment.category,
            startAt,
            endAt,
          });
        }
      }
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }

    return occurrences;
  });
