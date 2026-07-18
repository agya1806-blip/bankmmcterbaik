/**
 * Tests for accounting formulas used across the app.
 */
describe("Accounting Formulas", () => {
  // These mirror the formulas in db-helpers.ts and laporan/page.tsx

  function computeLabaBersih(
    transactions: Array<{ grandTotal: number; sedekahNominal: number; status: string }>,
    hppItems: Array<{ total: number }>,
    cashflows: Array<{ tipe: string; kategori: string; nominal: number }>
  ) {
    const totalPendapatan = transactions
      .filter(tx => tx.status !== "BATAL")
      .reduce((sum, tx) => sum + (tx.grandTotal - (tx.sedekahNominal || 0)), 0);
    
    const totalHpp = hppItems.reduce((sum, item) => sum + item.total, 0);
    
    const labaKotor = totalPendapatan - totalHpp;
    
    const totalPengeluaranOperasional = cashflows
      .filter(cf => 
        cf.tipe === "keluar" && 
        !["HPP", "Retur/Batal", "Transfer_Keluar", "Transfer_Masuk"].includes(cf.kategori)
      )
      .reduce((sum, cf) => sum + cf.nominal, 0);
    
    const labaBersih = labaKotor - totalPengeluaranOperasional;
    
    return { totalPendapatan, totalHpp, labaKotor, totalPengeluaranOperasional, labaBersih };
  }

  it("computes laba bersih correctly", () => {
    const transactions = [
      { grandTotal: 100000, sedekahNominal: 5000, status: "LUNAS" },
      { grandTotal: 50000, sedekahNominal: 0, status: "LUNAS" },
      { grandTotal: 20000, sedekahNominal: 0, status: "BATAL" }, // excluded
    ];
    
    const hppItems = [
      { total: 30000 }, // HPP for first tx
      { total: 15000 }, // HPP for second tx
    ];
    
    const cashflows = [
      { tipe: "keluar", kategori: "Listrik", nominal: 10000 },
      { tipe: "keluar", kategori: "Sewa", nominal: 50000 },
      { tipe: "keluar", kategori: "HPP", nominal: 45000 }, // excluded
      { tipe: "keluar", kategori: "Retur/Batal", nominal: 20000 }, // excluded
      { tipe: "keluar", kategori: "Transfer_Keluar", nominal: 30000 }, // excluded
      { tipe: "masuk", kategori: "Penjualan", nominal: 150000 }, // income, not expense
    ];
    
    const result = computeLabaBersih(transactions, hppItems, cashflows);
    
    expect(result.totalPendapatan).toBe(145000); // 100000-5000 + 50000-0 = 145000
    expect(result.totalHpp).toBe(45000); // 30000 + 15000
    expect(result.labaKotor).toBe(100000); // 145000 - 45000
    expect(result.totalPengeluaranOperasional).toBe(60000); // 10000 + 50000
    expect(result.labaBersih).toBe(40000); // 100000 - 60000
  });

  it("excludes BATAL transactions from revenue", () => {
    const transactions = [
      { grandTotal: 100000, sedekahNominal: 0, status: "LUNAS" },
      { grandTotal: 200000, sedekahNominal: 0, status: "BATAL" },
    ];
    const result = computeLabaBersih(transactions, [], []);
    expect(result.totalPendapatan).toBe(100000);
  });

  it("handles sedekah deduction correctly", () => {
    const transactions = [
      { grandTotal: 100000, sedekahNominal: 10000, status: "LUNAS" },
    ];
    const result = computeLabaBersih(transactions, [], []);
    expect(result.totalPendapatan).toBe(90000); // grandTotal - sedekah
  });

  it("returns 0 for empty data", () => {
    const result = computeLabaBersih([], [], []);
    expect(result.totalPendapatan).toBe(0);
    expect(result.totalHpp).toBe(0);
    expect(result.labaKotor).toBe(0);
    expect(result.totalPengeluaranOperasional).toBe(0);
    expect(result.labaBersih).toBe(0);
  });
});
