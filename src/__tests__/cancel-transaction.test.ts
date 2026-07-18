/**
 * Tests for cancel-transaction helper functions.
 * Tests the calculation/reversal logic independent of Dexie.
 */
describe("Cancel Transaction Logic", () => {
  // Stock revert: cancel adds qty back
  function calculateRevertedStock(currentStok: number, canceledQty: number): number {
    return currentStok + canceledQty;
  }

  // Wallet revert: cancel subtracts the amount
  function calculateRevertedWallet(currentSaldo: number, dpDibayar: number): number {
    return currentSaldo - dpDibayar;
  }

  // Sedekah reverse: subtract from correct bucket
  function calculateSedekahReverse(currentBalance: number, sedekahNominal: number): number {
    return Math.max(0, currentBalance - sedekahNominal);
  }

  it("reverts stock correctly (adds qty back)", () => {
    expect(calculateRevertedStock(10, 3)).toBe(13); // +3
    expect(calculateRevertedStock(0, 5)).toBe(5); // +5
    expect(calculateRevertedStock(100, 0)).toBe(100); // no change
  });

  it("reverts wallet correctly (subtracts dp)", () => {
    expect(calculateRevertedWallet(50000, 20000)).toBe(30000);
    expect(calculateRevertedWallet(100000, 0)).toBe(100000);
    expect(calculateRevertedWallet(10000, 50000)).toBe(-40000); // can go negative
  });

  it("reverses sedekah correctly", () => {
    expect(calculateSedekahReverse(10000, 5000)).toBe(5000);
    expect(calculateSedekahReverse(5000, 10000)).toBe(0); // capped at 0
    expect(calculateSedekahReverse(0, 1000)).toBe(0);
  });

  it("handles full cancel scenario", () => {
    const originalStok = 15;
    const qtySold = 3;
    const walletSaldo = 100000;
    const dpDibayar = 25000;
    const sedekahBalance = 20000;
    const sedekahNominal = 5000;

    const revertedStok = calculateRevertedStock(originalStok, qtySold);
    const revertedWallet = calculateRevertedWallet(walletSaldo, dpDibayar);
    const reversedSedekah = calculateSedekahReverse(sedekahBalance, sedekahNominal);

    expect(revertedStok).toBe(18);
    expect(revertedWallet).toBe(75000);
    expect(reversedSedekah).toBe(15000);
  });
});
