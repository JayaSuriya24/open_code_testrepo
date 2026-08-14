import { describe, expect, it } from "vitest";
import { decodeAws } from "./aws";

describe("decodeAws", () => {
  it("decodes a mild-steel E6013 code into four segments", () => {
    const segments = decodeAws("E6013");
    expect(segments?.map((s) => s.code)).toEqual(["E", "60", "1", "3"]);
    expect(segments?.[1]?.meaning).toContain("60 ksi");
    expect(segments?.[2]?.meaning).toBe("All positions");
  });

  it("decodes E7018 coating digit 8", () => {
    const segments = decodeAws("E7018");
    expect(segments?.[3]?.meaning).toContain("Low hydrogen, iron powder");
  });

  it("decodes E7024 as a flat-position electrode", () => {
    const segments = decodeAws("E7024");
    expect(segments?.[2]?.meaning).toBe("Flat and horizontal fillet");
  });

  it("decodes a stainless E308L-16 code", () => {
    const segments = decodeAws("E308L-16");
    expect(segments?.map((s) => s.code)).toEqual(["E", "308", "L", "1", "6"]);
    expect(segments?.[1]?.meaning).toContain("308");
    expect(segments?.[3]?.meaning).toBe("All positions");
  });

  it("returns null for a standard reference rather than a code", () => {
    expect(decodeAws("A5.13")).toBeNull();
  });

  it("returns null for an unknown shape", () => {
    expect(decodeAws("E7018-1")).toBeNull();
  });
});
