import { describe, expect, it } from "vitest";
import { detectFixedStarConjunctions } from "./fixedStars";

describe("fixed-star proximity catalog", () => {
  it("applies the declared 2° royal-star threshold and 0.5° exact flag", () => {
    const hits = detectFixedStarConjunctions({
      Mars: { planet: "Mars", sign: "Leo", degree: 15, eclipticLon: 136.9 },
      Venus: { planet: "Venus", sign: "Leo", degree: 15, eclipticLon: 135.2 },
    });

    expect(hits).toEqual(expect.arrayContaining([
      expect.objectContaining({ planet: "Mars", star: expect.objectContaining({ name: "Regulus", isRoyal: true }), orb: 1.9, exact: false }),
      expect.objectContaining({ planet: "Venus", star: expect.objectContaining({ name: "Regulus", isRoyal: true }), orb: 0.2, exact: true }),
    ]));
  });

  it("excludes a position outside the declared star-specific orb", () => {
    const hits = detectFixedStarConjunctions({
      Mars: { planet: "Mars", sign: "Leo", degree: 17.01, eclipticLon: 137.01 },
    });
    expect(hits.some(hit => hit.star.name === "Regulus")).toBe(false);
  });
});
