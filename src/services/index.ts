// Auth
export { authService } from "./auth";
export type { IAuthService, RegisterInput, UpdateUserInput } from "./auth";

// Product
export { productService } from "./product";
export type { IProductService, CreateProductInput, UpdateProductInput, ProductDTO, ProductFormData } from "./product";
export { emptyFormData } from "./product";

// Inventory
export { inventoryService } from "./inventory";
export type { IInventoryService, AdjustStockInput, StockStats } from "./inventory";

// Customer
export { customerService } from "./customer";
export type { ICustomerService, CreateCustomerInput, UpdateCustomerInput, CustomerDTO } from "./customer";

// Supplier
export { supplierService } from "./supplier";
export type { ISupplierService, CreateSupplierInput, UpdateSupplierInput } from "./supplier";

// Wallet
export { walletService } from "./wallet";
export type { IWalletService, CreateWalletInput, UpdateWalletInput } from "./wallet";

// Cashflow
export { cashflowService } from "./cashflow";
export type { ICashflowService, CreateCashflowInput, UpdateCashflowInput } from "./cashflow";

// Transaction
export { transactionService } from "./transaction";
export type { ITransactionService } from "./transaction";

// Production
export { productionService } from "./production";
export type { IProductionService } from "./production";

// Purchase Order
export { purchaseOrderService } from "./purchase-order";
export type { IPurchaseOrderService, CreatePOInput } from "./purchase-order";

// Report
export { reportService } from "./report";
export type { IReportService, LabaRugiReport, KategoriSummary, StokReport } from "./report";

// Backup
export { backupService } from "./backup";
export type { IBackupService, BackupData } from "./backup";

// Notification
export { notificationService } from "./notification";
export type { INotificationService, DuePiutangItem, LowStockAlert, NotificationSummary } from "./notification";

// Setting
export { settingService } from "./setting";
export type { ISettingService, UpsertProfileInput } from "./setting";
