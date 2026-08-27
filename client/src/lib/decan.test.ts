import { describe, expect, it } from "vitest";
import { getDecan, getDecanFlavor, getDecanLord, getDecanRuler } from "./decan";

describe("Atlas Chaldean decan lookup", () => {
  it("uses fixed 10° sign-relative divisions and preserves exact boundaries", () => {
    expect(getDecanRuler("Aries", 0)).toBe("Mars");
    expect(getDecanFlavor("Aries", 9.999)).toBe("raw impulse");
    expect(getDecanRuler("Aries", 10)).toBe("Sun");
    expect(getDecanRuler("Aries", 20)).toBe("Jupiter");
    expect(getDecanFlavor("Aries", 29.999)).toBe("expansive risk");
  });

  it("keeps the compatibility helpers on the same zero-based sign convention", () => {
    expect(getDecan(0, 0)).toBe(1);
    expect(getDecan(0, 10)).toBe(2);
    expect(getDecanLord(7, 20)).toBe("Venus");
  });
});
