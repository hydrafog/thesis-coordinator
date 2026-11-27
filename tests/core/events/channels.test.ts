import { describe, it, expect } from "vitest";
import {
  EVENT_CHANNELS,
  REALTIME_EVENTS,
  isRealtimeEvent,
  parseChannel,
} from "../../../src/core/events/channels";

describe("channel parsing", () => {
  it("round-trips every server-built channel", () => {
    expect(parseChannel(EVENT_CHANNELS.conversation("abc123"))).toEqual({
      kind: "conversation",
      id: "abc123",
    });
    expect(parseChannel(EVENT_CHANNELS.coordinator("c_1"))).toEqual({
      kind: "coordinator",
      id: "c_1",
    });
  });

  it("rejects client-controlled names that could broaden access", () => {
    for (const name of [
      "conversation:*",
      "conversation:",
      "conversation:a b",
      "admin:all",
      "conversation:abc:def",
      "",
      42,
      null,
    ]) {
      expect(parseChannel(name)).toBeNull();
    }
  });

  it("recognizes only catalogued events", () => {
    expect(isRealtimeEvent(REALTIME_EVENTS.MESSAGE_CREATED)).toBe(true);
    expect(isRealtimeEvent("message.deleted")).toBe(false);
  });
});
