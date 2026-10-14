import { describe, it, expect } from "vitest";
import { restore } from "../src/storage";
import { defaultSettings } from "../src/types";
describe("recover persisted state", () => {
  it("migrates older preferences without losing defaults", () => {
    expect(
      restore("settings", { contrast: true }, defaultSettings),
    ).toMatchObject({ contrast: true, chatSize: 14, autoplay: true });
  });
  it("rejects malformed collections and invalid names", () => {
    expect(restore("follows", {}, [])).toEqual([]);
    expect(
      restore(
        "follows",
        [null, { id: "1", login: "\r\nJOIN #room", displayName: "bad" }],
        [],
      ),
    ).toEqual([]);
  });
  it("bounds invalid scalar preferences", () => {
    expect(
      restore("settings", { chatSize: 900, quality: -200 }, defaultSettings),
    ).toMatchObject({ chatSize: 22, quality: -1 });
  });
});
