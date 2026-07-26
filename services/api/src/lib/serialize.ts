import type { HydratedDocument } from "mongoose";

export const serialize = (value: unknown): unknown => {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map(serialize);
  }

  if (
    value &&
    typeof value === "object" &&
    "toHexString" in value &&
    typeof (value as { toHexString(): string }).toHexString === "function"
  ) {
    return (value as { toHexString(): string }).toHexString();
  }

  if (
    value &&
    typeof value === "object" &&
    "toObject" in value &&
    typeof (value as HydratedDocument<unknown>).toObject === "function"
  ) {
    return serialize((value as HydratedDocument<unknown>).toObject());
  }

  if (value && typeof value === "object") {
    const object = value as Record<string, unknown>;
    const result: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(object)) {
      if (key === "__v" || key === "passwordHash" || key === "tokenVersion") {
        continue;
      }
      result[key === "_id" ? "id" : key] = serialize(item);
    }
    return result;
  }

  return value;
};
