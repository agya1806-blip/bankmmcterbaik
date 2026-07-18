describe("Shared Constants", () => {
  it("ALL_UNITS contains 9 units", () => {
    const { ALL_UNITS } = require("@/lib/db-v4");
    expect(ALL_UNITS.length).toBe(9);
  });

  it("UNIT_LABELS has all 9 units", () => {
    const { UNIT_LABELS, ALL_UNITS } = require("@/lib/db-v4");
    for (const unit of ALL_UNITS) {
      expect(UNIT_LABELS[unit]).toBeDefined();
      expect(typeof UNIT_LABELS[unit]).toBe("string");
    }
  });

  it("NON_BIZ_UNITS contains only pribadi and keluarga", () => {
    const { NON_BIZ_UNITS } = require("@/lib/db-v4");
    expect(NON_BIZ_UNITS).toEqual(["pribadi", "keluarga"]);
  });

  it("MAX_WALLET_PER_UNIT is 4", () => {
    const { MAX_WALLET_PER_UNIT } = require("@/lib/db-v4");
    expect(MAX_WALLET_PER_UNIT).toBe(4);
  });
});
