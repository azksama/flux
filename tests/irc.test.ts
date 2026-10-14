import { describe, it, expect } from "vitest";
import { parseIrc, messageFromIrc } from "../src/irc";
describe("Twitch IRC protocol", () => {
  it("preserves text with colons and escaped display names", () => {
    const line = parseIrc(
      "@display-name=Demo\\sName;color=#A1B2C3;id=message-1;user-id=42;badges=moderator/1;emotes=25:0-4 :demo!d@d PRIVMSG #room :Kappa : hello",
    );
    expect(line?.command).toBe("PRIVMSG");
    const m = messageFromIrc(line!);
    expect(m.name).toBe("Demo Name");
    expect(m.text).toBe("Kappa : hello");
    expect(m.emotes).toEqual([{ id: "25", start: 0, end: 4 }]);
    expect(m.badges).toContain("moderator/1");
  });
  it("handles server ping and moderation identifiers", () => {
    expect(parseIrc("PING :tmi.twitch.tv\r\n")?.trailing).toBe("tmi.twitch.tv");
    expect(
      parseIrc("@target-msg-id=abc :tmi.twitch.tv CLEARMSG #room :deleted")
        ?.tags["target-msg-id"],
    ).toBe("abc");
  });
  it("does not interpret arbitrary CSS in color tags", () => {
    expect(
      messageFromIrc(
        parseIrc(
          "@color=url(evil);display-name=Alice :x PRIVMSG #room :<script>alert(1)</script>",
        )!,
      ).color,
    ).toBe("#B2F5D4");
  });
  it("handles missing tags, empty packets and duplicated emote ranges", () => {
    expect(parseIrc("")).toBeNull();
    expect(parseIrc("@broken")).toBeNull();
    const m = messageFromIrc(
      parseIrc("@emotes=25:0-4,6-10 :x PRIVMSG #c :Kappa Kappa")!,
    );
    expect(m.emotes).toHaveLength(2);
    expect(m.name).toBe("Twitch");
  });
});
