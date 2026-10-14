import { describe, expect, it } from "vitest";
import { readableChatColor } from "../src/chat-color";

describe("chat nickname contrast", () => {
  it("replaces dark blue and dark arbitrary colors with readable mint", () => {
    for (const color of ["#0000ff", "#000000", "#123456", "#152129"])
      expect(readableChatColor(color)).toBe("#b2f5d4");
  });
  it("preserves readable user colors", () => {
    for (const color of ["#ffffff", "#FFFF00", "#b2f5d4", "#ff786f"])
      expect(readableChatColor(color)).toBe(color);
  });
  it("rejects missing and non-hex colors", () => {
    for (const color of ["", "blue", "#gggggg", "var(--ink)"])
      expect(readableChatColor(color)).toBe("#b2f5d4");
  });
});
