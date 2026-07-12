import { openDB, type IDBPDatabase } from "idb";

export type BusinessSubType = "general" | "konveksi" | "percetakan" | "toko_hp" | "toko_laptop" | "kelontong" | "kedai_kopi" | "warung";

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  createdAt: number;
}

export interface Session {
  id: string;
  userId: string;
  createdAt: number;
}

export type WorkspaceType = "pribadi" | "usaha" | "modal" | "toko" | "hutang";

export interface Workspace {
  id: string;
  name: string;
  description: string;
  currency: string;
  icon: string;
  inviteCode: string;
  createdBy: string;
  type: WorkspaceType;
  businessSubType?: BusinessSubType;
  connectedWorkspaces: string[];
  businessProfile?: {
    name: string;
    whatsapp: string;
    address: string;
  };
  createdAt: number;
}

export interface WorkspaceMember {
  workspaceId: string;
  userId: string;
  role: "admin" | "viewer";
  joinedAt: number;
}

export interface Account {
  id: string;
  workspaceId: string;
  name: string;
  type: "bank" | "cash" | "ewallet" | "qris" | "custom";
  balance: number;
  currency: string;
  createdAt: number;
}

export interface Category {
  id: string;
  workspaceId: string;
  name: string;
  type: "income" | "expense";
  color: string;
  createdAt: number;
}

export interface Transaction {
  id: string;
  workspaceId: string;
  type: "income" | "expense" | "transfer" | "debt" | "receivable";
  amount: number;
  accountId: string;
  toAccountId?: string;
  categoryId?: string;
  description: string;
  date: string;
  createdAt: number;
  costCategory?: "modal_produk" | "gaji_karyawan" | "biaya_operasional" | "biaya_transportasi";
}

export interface Budget {
  id: string;
  workspaceId: string;
  categoryId: string;
  amount: number;
  period: "monthly" | "yearly";
  startDate: string;
  endDate?: string;
  createdAt: number;
}

export interface Customer {
  id: string;
  workspaceId: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
  createdAt: number;
}

export interface Supplier {
  id: string;
  workspaceId: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
  createdAt: number;
}

export interface InventoryItem {
  id: string;
  workspaceId: string;
  name: string;
  sku: string;
  category: string;
  unit: string;
  stock: number;
  price: number;
  createdAt: number;
}

export interface InventoryMutation {
  id: string;
  workspaceId: string;
  itemId: string;
  type: "in" | "out" | "adjustment";
  quantity: number;
  stockBefore: number;
  stockAfter: number;
  reference: string;
  note: string;
  createdAt: number;
}

export interface PaymentMethod {
  id: string;
  workspaceId: string;
  name: string;
  createdAt: number;
}

export interface Project {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  status: "active" | "completed" | "cancelled";
  startDate: string;
  endDate: string;
  createdAt: number;
}

export interface ProjectTask {
  id: string;
  projectId: string;
  title: string;
  completed: boolean;
  createdAt: number;
}

export interface CalendarEvent {
  id: string;
  workspaceId: string;
  title: string;
  description: string;
  date: string;
  time: string;
  remind: boolean;
  createdAt: number;
}

export interface WidgetLayout {
  id: string;
  workspaceId: string;
  widgets: string;
  createdAt: number;
}

export interface WorkspaceSettings {
  workspaceId: string;
  theme: "light" | "dark";
  language: string;
}

export interface AuditLog {
  id: string;
  workspaceId: string;
  userId: string;
  action: "create" | "update" | "delete";
  entity: string;
  entityId: string;
  before?: string;
  after?: string;
  createdAt: number;
}

export interface RecurringRule {
  id: string;
  workspaceId: string;
  type: Transaction["type"];
  amount: number;
  accountId: string;
  toAccountId?: string;
  categoryId?: string;
  description: string;
  frequency: "daily" | "weekly" | "monthly" | "yearly";
  interval: number;
  startDate: string;
  endDate?: string;
  nextDate: string;
  active: boolean;
  createdAt: number;
}

export interface Product {
  id: string;
  workspaceId: string;
  name: string;
  type: "service" | "goods";
  category: string;
  price: number;
  unit: string;
  stock: number;
  description: string;
  createdAt: number;
}

export interface Order {
  id: string;
  workspaceId: string;
  number: string;
  type: "print" | "laptop" | "handphone" | "tiktok" | "umum";
  status: "baru" | "proses" | "selesai" | "batal";
  paymentStatus: "Belum Lunas" | "DP" | "Lunas" | "Batal";
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  items: OrderItemData[];
  subtotal: number;
  discount: number;
  total: number;
  dp: number;
  remaining: number;
  walletId: string;
  specs: Record<string, string>;
  notes: string;
  date: string;
  dueDate: string;
  createdAt: number;
}

export interface OrderItemData {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Branch {
  id: string;
  workspaceId: string;
  name: string;
  address: string;
  createdAt: number;
}

export interface PinLock {
  userId: string;
  pin: string;
  createdAt: number;
}

export interface PpobCategory {
  id: string;
  workspaceId: string;
  name: string;
  icon: string;
  provider: string;
  createdAt: number;
}

export interface DigitalProduct {
  id: string;
  workspaceId: string;
  categoryId: string;
  name: string;
  description: string;
  buyPrice: number;
  sellPrice: number;
  provider: string;
  active: boolean;
  createdAt: number;
}

export interface PpobTransaction {
  id: string;
  workspaceId: string;
  productId: string;
  customerPhone: string;
  customerName: string;
  amount: number;
  profit: number;
  status: "sukses" | "gagal" | "pending";
  note: string;
  createdAt: number;
}

export interface QrisPayment {
  id: string;
  workspaceId: string;
  amount: number;
  description: string;
  customerName: string;
  status: "paid" | "unpaid";
  createdAt: number;
}

const DB_NAME = "mmcbank";
const DB_VERSION = 12;

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db, _oldVersion, _newVersion, _transaction) {
        if (!db.objectStoreNames.contains("users")) {
          const userStore = db.createObjectStore("users", { keyPath: "id" });
          userStore.createIndex("email", "email", { unique: true });
        }
        if (!db.objectStoreNames.contains("sessions")) {
          const sessionStore = db.createObjectStore("sessions", {
            keyPath: "id",
          });
          sessionStore.createIndex("userId", "userId", { unique: false });
        }
        if (!db.objectStoreNames.contains("workspaces")) {
          const wsStore = db.createObjectStore("workspaces", { keyPath: "id" });
          wsStore.createIndex("inviteCode", "inviteCode", { unique: true });
        }
        if (!db.objectStoreNames.contains("workspace_members")) {
          const memberStore = db.createObjectStore("workspace_members", {
            keyPath: ["workspaceId", "userId"],
          });
          memberStore.createIndex("userId", "userId", { unique: false });
          memberStore.createIndex("workspaceId", "workspaceId", {
            unique: false,
          });
        }
        if (!db.objectStoreNames.contains("accounts")) {
          const accStore = db.createObjectStore("accounts", { keyPath: "id" });
          accStore.createIndex("workspaceId", "workspaceId", {
            unique: false,
          });
        }
        if (!db.objectStoreNames.contains("categories")) {
          const catStore = db.createObjectStore("categories", { keyPath: "id" });
          catStore.createIndex("workspaceId", "workspaceId", {
            unique: false,
          });
        }
        if (!db.objectStoreNames.contains("transactions")) {
          const txStore = db.createObjectStore("transactions", {
            keyPath: "id",
          });
          txStore.createIndex("workspaceId", "workspaceId", {
            unique: false,
          });
          txStore.createIndex("accountId", "accountId", {
            unique: false,
          });
        }
        if (!db.objectStoreNames.contains("budgets")) {
          const budStore = db.createObjectStore("budgets", { keyPath: "id" });
          budStore.createIndex("workspaceId", "workspaceId", {
            unique: false,
          });
        }
        if (!db.objectStoreNames.contains("customers")) {
          const custStore = db.createObjectStore("customers", { keyPath: "id" });
          custStore.createIndex("workspaceId", "workspaceId", {
            unique: false,
          });
        }
        if (!db.objectStoreNames.contains("suppliers")) {
          const suppStore = db.createObjectStore("suppliers", { keyPath: "id" });
          suppStore.createIndex("workspaceId", "workspaceId", {
            unique: false,
          });
        }
        if (!db.objectStoreNames.contains("inventory_items")) {
          const invStore = db.createObjectStore("inventory_items", {
            keyPath: "id",
          });
          invStore.createIndex("workspaceId", "workspaceId", {
            unique: false,
          });
        }
        if (!db.objectStoreNames.contains("inventory_mutations")) {
          const mutStore = db.createObjectStore("inventory_mutations", {
            keyPath: "id",
          });
          mutStore.createIndex("workspaceId", "workspaceId", {
            unique: false,
          });
          mutStore.createIndex("itemId", "itemId", { unique: false });
        }
        if (!db.objectStoreNames.contains("payment_methods")) {
          const pmStore = db.createObjectStore("payment_methods", {
            keyPath: "id",
          });
          pmStore.createIndex("workspaceId", "workspaceId", {
            unique: false,
          });
        }
        if (!db.objectStoreNames.contains("projects")) {
          const projStore = db.createObjectStore("projects", { keyPath: "id" });
          projStore.createIndex("workspaceId", "workspaceId", {
            unique: false,
          });
        }
        if (!db.objectStoreNames.contains("project_tasks")) {
          const taskStore = db.createObjectStore("project_tasks", {
            keyPath: "id",
          });
          taskStore.createIndex("projectId", "projectId", {
            unique: false,
          });
        }
        if (!db.objectStoreNames.contains("calendar_events")) {
          const calStore = db.createObjectStore("calendar_events", {
            keyPath: "id",
          });
          calStore.createIndex("workspaceId", "workspaceId", {
            unique: false,
          });
        }
        if (!db.objectStoreNames.contains("widget_layouts")) {
          db.createObjectStore("widget_layouts", {
            keyPath: "id",
          });
        }
        if (!db.objectStoreNames.contains("workspace_settings")) {
          db.createObjectStore("workspace_settings", {
            keyPath: "workspaceId",
          });
        }
        if (!db.objectStoreNames.contains("audit_logs")) {
          const alStore = db.createObjectStore("audit_logs", { keyPath: "id" });
          alStore.createIndex("workspaceId", "workspaceId", { unique: false });
          alStore.createIndex("entityId", "entityId", { unique: false });
        }
        if (!db.objectStoreNames.contains("recurring_rules")) {
          const rrStore = db.createObjectStore("recurring_rules", { keyPath: "id" });
          rrStore.createIndex("workspaceId", "workspaceId", { unique: false });
          rrStore.createIndex("nextDate", "nextDate", { unique: false });
        }
        if (!db.objectStoreNames.contains("products")) {
          const prodStore = db.createObjectStore("products", { keyPath: "id" });
          prodStore.createIndex("workspaceId", "workspaceId", { unique: false });
        }
        if (!db.objectStoreNames.contains("orders")) {
          const ordStore = db.createObjectStore("orders", { keyPath: "id" });
          ordStore.createIndex("workspaceId", "workspaceId", { unique: false });
          ordStore.createIndex("customerId", "customerId", { unique: false });
        }
        if (!db.objectStoreNames.contains("branches")) {
          const brStore = db.createObjectStore("branches", { keyPath: "id" });
          brStore.createIndex("workspaceId", "workspaceId", { unique: false });
        }
        if (!db.objectStoreNames.contains("pin_locks")) {
          db.createObjectStore("pin_locks", { keyPath: "userId" });
        }
        if (!db.objectStoreNames.contains("ppob_categories")) {
          const pcStore = db.createObjectStore("ppob_categories", { keyPath: "id" });
          pcStore.createIndex("workspaceId", "workspaceId", { unique: false });
        }
        if (!db.objectStoreNames.contains("digital_products")) {
          const dpStore = db.createObjectStore("digital_products", { keyPath: "id" });
          dpStore.createIndex("workspaceId", "workspaceId", { unique: false });
          dpStore.createIndex("categoryId", "categoryId", { unique: false });
        }
        if (!db.objectStoreNames.contains("ppob_transactions")) {
          const ptStore = db.createObjectStore("ppob_transactions", { keyPath: "id" });
          ptStore.createIndex("workspaceId", "workspaceId", { unique: false });
          ptStore.createIndex("createdAt", "createdAt", { unique: false });
        }
        if (!db.objectStoreNames.contains("qris_payments")) {
          const qpStore = db.createObjectStore("qris_payments", { keyPath: "id" });
          qpStore.createIndex("workspaceId", "workspaceId", { unique: false });
          qpStore.createIndex("status", "status", { unique: false });
        }
      },
    });
  }
  return dbPromise;
}

// --- Users ---

export async function createUser(user: User): Promise<void> {
  const db = await getDb();
  await db.add("users", user);
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  const db = await getDb();
  const tx = db.transaction("users", "readonly");
  const index = tx.objectStore("users").index("email");
  return index.get(email);
}

export async function getUserById(id: string): Promise<User | undefined> {
  const db = await getDb();
  return db.get("users", id);
}

export async function updateUser(user: User): Promise<void> {
  const db = await getDb();
  await db.put("users", user);
}

// --- Sessions ---

export async function createSession(session: Session): Promise<void> {
  const db = await getDb();
  await db.add("sessions", session);
}

export async function deleteSession(sessionId: string): Promise<void> {
  const db = await getDb();
  await db.delete("sessions", sessionId);
}

export async function getAllSessions(): Promise<Session[]> {
  const db = await getDb();
  return db.getAll("sessions");
}

// --- Workspaces ---

export async function createWorkspace(
  workspace: Workspace
): Promise<void> {
  const db = await getDb();
  await db.add("workspaces", workspace);
}

export async function updateWorkspace(
  workspace: Workspace
): Promise<void> {
  const db = await getDb();
  await db.put("workspaces", workspace);
}

export async function deleteWorkspace(id: string): Promise<void> {
  const db = await getDb();
  await db.delete("workspaces", id);
}

export async function getWorkspaceById(
  id: string
): Promise<Workspace | undefined> {
  const db = await getDb();
  return db.get("workspaces", id);
}

export async function getWorkspaceByInviteCode(
  code: string
): Promise<Workspace | undefined> {
  const db = await getDb();
  const tx = db.transaction("workspaces", "readonly");
  const index = tx.objectStore("workspaces").index("inviteCode");
  return index.get(code);
}

export async function getAllWorkspaces(): Promise<Workspace[]> {
  const db = await getDb();
  return db.getAll("workspaces");
}

// --- Workspace Members ---

export async function addWorkspaceMember(
  member: WorkspaceMember
): Promise<void> {
  const db = await getDb();
  await db.add("workspace_members", member);
}

export async function removeWorkspaceMember(
  workspaceId: string,
  userId: string
): Promise<void> {
  const db = await getDb();
  await db.delete("workspace_members", [workspaceId, userId]);
}

export async function getWorkspaceMembers(
  workspaceId: string
): Promise<WorkspaceMember[]> {
  const db = await getDb();
  const tx = db.transaction("workspace_members", "readonly");
  const index = tx.objectStore("workspace_members").index("workspaceId");
  return index.getAll(workspaceId);
}

export async function getUserWorkspaces(
  userId: string
): Promise<WorkspaceMember[]> {
  const db = await getDb();
  const tx = db.transaction("workspace_members", "readonly");
  const index = tx.objectStore("workspace_members").index("userId");
  return index.getAll(userId);
}

export async function getWorkspaceMember(
  workspaceId: string,
  userId: string
): Promise<WorkspaceMember | undefined> {
  const db = await getDb();
  return db.get("workspace_members", [workspaceId, userId]);
}

export async function updateWorkspaceMember(
  member: WorkspaceMember
): Promise<void> {
  const db = await getDb();
  await db.put("workspace_members", member);
}

export async function deleteAllWorkspaceMembers(
  workspaceId: string
): Promise<void> {
  const db = await getDb();
  const tx = db.transaction("workspace_members", "readwrite");
  const index = tx.objectStore("workspace_members").index("workspaceId");
  let cursor = await index.openCursor(workspaceId);
  while (cursor) {
    cursor.delete();
    cursor = await cursor.continue();
  }
  await tx.done;
}

// --- Accounts ---

export async function createAccount(account: Account): Promise<void> {
  const db = await getDb();
  await db.add("accounts", account);
}

export async function updateAccount(account: Account): Promise<void> {
  const db = await getDb();
  await db.put("accounts", account);
}

export async function deleteAccount(id: string): Promise<void> {
  const db = await getDb();
  await db.delete("accounts", id);
}

export async function getAccountById(
  id: string
): Promise<Account | undefined> {
  const db = await getDb();
  return db.get("accounts", id);
}

export async function getAccountsByWorkspace(
  workspaceId: string
): Promise<Account[]> {
  const db = await getDb();
  const tx = db.transaction("accounts", "readonly");
  const index = tx.objectStore("accounts").index("workspaceId");
  return index.getAll(workspaceId);
}

// --- Categories ---

export async function createCategory(category: Category): Promise<void> {
  const db = await getDb();
  await db.add("categories", category);
}

export async function updateCategory(category: Category): Promise<void> {
  const db = await getDb();
  await db.put("categories", category);
}

export async function deleteCategory(id: string): Promise<void> {
  const db = await getDb();
  await db.delete("categories", id);
}

export async function getCategoryById(
  id: string
): Promise<Category | undefined> {
  const db = await getDb();
  return db.get("categories", id);
}

export async function getCategoriesByWorkspace(
  workspaceId: string
): Promise<Category[]> {
  const db = await getDb();
  const tx = db.transaction("categories", "readonly");
  const index = tx.objectStore("categories").index("workspaceId");
  return index.getAll(workspaceId);
}

// --- Transactions ---

export async function createTransaction(
  transaction: Transaction
): Promise<void> {
  const db = await getDb();
  await db.add("transactions", transaction);
}

export async function getTransactionsByWorkspace(
  workspaceId: string
): Promise<Transaction[]> {
  const db = await getDb();
  const tx = db.transaction("transactions", "readonly");
  const index = tx.objectStore("transactions").index("workspaceId");
  return index.getAll(workspaceId);
}

export async function updateTransaction(
  transaction: Transaction
): Promise<void> {
  const db = await getDb();
  await db.put("transactions", transaction);
}

export async function deleteTransaction(id: string): Promise<void> {
  const db = await getDb();
  await db.delete("transactions", id);
}

export async function getTransactionById(
  id: string
): Promise<Transaction | undefined> {
  const db = await getDb();
  return db.get("transactions", id);
}

// --- Budgets ---

export async function createBudget(budget: Budget): Promise<void> {
  const db = await getDb();
  await db.add("budgets", budget);
}

export async function updateBudget(budget: Budget): Promise<void> {
  const db = await getDb();
  await db.put("budgets", budget);
}

export async function deleteBudget(id: string): Promise<void> {
  const db = await getDb();
  await db.delete("budgets", id);
}

export async function getBudgetsByWorkspace(
  workspaceId: string
): Promise<Budget[]> {
  const db = await getDb();
  const tx = db.transaction("budgets", "readonly");
  const index = tx.objectStore("budgets").index("workspaceId");
  return index.getAll(workspaceId);
}

// --- Customers ---

export async function createCustomer(customer: Customer): Promise<void> {
  const db = await getDb();
  await db.add("customers", customer);
}

export async function updateCustomer(customer: Customer): Promise<void> {
  const db = await getDb();
  await db.put("customers", customer);
}

export async function deleteCustomer(id: string): Promise<void> {
  const db = await getDb();
  await db.delete("customers", id);
}

export async function getCustomerById(
  id: string
): Promise<Customer | undefined> {
  const db = await getDb();
  return db.get("customers", id);
}

export async function getCustomersByWorkspace(
  workspaceId: string
): Promise<Customer[]> {
  const db = await getDb();
  const tx = db.transaction("customers", "readonly");
  const index = tx.objectStore("customers").index("workspaceId");
  return index.getAll(workspaceId);
}

// --- Suppliers ---

export async function createSupplier(supplier: Supplier): Promise<void> {
  const db = await getDb();
  await db.add("suppliers", supplier);
}

export async function updateSupplier(supplier: Supplier): Promise<void> {
  const db = await getDb();
  await db.put("suppliers", supplier);
}

export async function deleteSupplier(id: string): Promise<void> {
  const db = await getDb();
  await db.delete("suppliers", id);
}

export async function getSupplierById(
  id: string
): Promise<Supplier | undefined> {
  const db = await getDb();
  return db.get("suppliers", id);
}

export async function getSuppliersByWorkspace(
  workspaceId: string
): Promise<Supplier[]> {
  const db = await getDb();
  const tx = db.transaction("suppliers", "readonly");
  const index = tx.objectStore("suppliers").index("workspaceId");
  return index.getAll(workspaceId);
}

// --- Inventory Items ---

export async function createInventoryItem(
  item: InventoryItem
): Promise<void> {
  const db = await getDb();
  await db.add("inventory_items", item);
}

export async function updateInventoryItem(
  item: InventoryItem
): Promise<void> {
  const db = await getDb();
  await db.put("inventory_items", item);
}

export async function deleteInventoryItem(id: string): Promise<void> {
  const db = await getDb();
  await db.delete("inventory_items", id);
}

export async function getInventoryItemsByWorkspace(
  workspaceId: string
): Promise<InventoryItem[]> {
  const db = await getDb();
  const tx = db.transaction("inventory_items", "readonly");
  const index = tx.objectStore("inventory_items").index("workspaceId");
  return index.getAll(workspaceId);
}

// --- Inventory Mutations ---

export async function createInventoryMutation(
  mutation: InventoryMutation
): Promise<void> {
  const db = await getDb();
  await db.add("inventory_mutations", mutation);
}

export async function getMutationsByItem(
  itemId: string
): Promise<InventoryMutation[]> {
  const db = await getDb();
  const tx = db.transaction("inventory_mutations", "readonly");
  const index = tx.objectStore("inventory_mutations").index("itemId");
  return index.getAll(itemId);
}

export async function getMutationsByWorkspace(
  workspaceId: string
): Promise<InventoryMutation[]> {
  const db = await getDb();
  const tx = db.transaction("inventory_mutations", "readonly");
  const index = tx.objectStore("inventory_mutations").index("workspaceId");
  return index.getAll(workspaceId);
}

// --- Payment Methods ---

export async function createPaymentMethod(pm: PaymentMethod): Promise<void> {
  const db = await getDb();
  await db.add("payment_methods", pm);
}

export async function getPaymentMethodsByWorkspace(
  workspaceId: string
): Promise<PaymentMethod[]> {
  const db = await getDb();
  const tx = db.transaction("payment_methods", "readonly");
  const index = tx.objectStore("payment_methods").index("workspaceId");
  return index.getAll(workspaceId);
}

export async function deletePaymentMethod(id: string): Promise<void> {
  const db = await getDb();
  await db.delete("payment_methods", id);
}

// --- Projects ---

export async function createProject(project: Project): Promise<void> {
  const db = await getDb();
  await db.add("projects", project);
}

export async function updateProject(project: Project): Promise<void> {
  const db = await getDb();
  await db.put("projects", project);
}

export async function deleteProject(id: string): Promise<void> {
  const db = await getDb();
  await db.delete("projects", id);
}

export async function getProjectsByWorkspace(
  workspaceId: string
): Promise<Project[]> {
  const db = await getDb();
  const tx = db.transaction("projects", "readonly");
  const index = tx.objectStore("projects").index("workspaceId");
  return index.getAll(workspaceId);
}

// --- Project Tasks ---

export async function createProjectTask(task: ProjectTask): Promise<void> {
  const db = await getDb();
  await db.add("project_tasks", task);
}

export async function updateProjectTask(task: ProjectTask): Promise<void> {
  const db = await getDb();
  await db.put("project_tasks", task);
}

export async function deleteProjectTask(id: string): Promise<void> {
  const db = await getDb();
  await db.delete("project_tasks", id);
}

export async function getTasksByProject(
  projectId: string
): Promise<ProjectTask[]> {
  const db = await getDb();
  const tx = db.transaction("project_tasks", "readonly");
  const index = tx.objectStore("project_tasks").index("projectId");
  return index.getAll(projectId);
}

// --- Calendar Events ---

export async function createCalendarEvent(event: CalendarEvent): Promise<void> {
  const db = await getDb();
  await db.add("calendar_events", event);
}

export async function getCalendarEventsByWorkspace(
  workspaceId: string
): Promise<CalendarEvent[]> {
  const db = await getDb();
  const tx = db.transaction("calendar_events", "readonly");
  const index = tx.objectStore("calendar_events").index("workspaceId");
  return index.getAll(workspaceId);
}

export async function deleteCalendarEvent(id: string): Promise<void> {
  const db = await getDb();
  await db.delete("calendar_events", id);
}

// --- Widget Layouts ---

export async function saveWidgetLayout(layout: WidgetLayout): Promise<void> {
  const db = await getDb();
  await db.put("widget_layouts", layout);
}

// --- Workspace Settings ---

export async function saveWorkspaceSettings(
  settings: WorkspaceSettings
): Promise<void> {
  const db = await getDb();
  await db.put("workspace_settings", settings);
}

export async function getWorkspaceSettings(
  workspaceId: string
): Promise<WorkspaceSettings | undefined> {
  const db = await getDb();
  return db.get("workspace_settings", workspaceId);
}

// --- Audit Logs ---

export async function createAuditLog(log: AuditLog): Promise<void> {
  const db = await getDb();
  await db.add("audit_logs", log);
}

export async function getAuditLogsByWorkspace(
  workspaceId: string
): Promise<AuditLog[]> {
  const db = await getDb();
  const tx = db.transaction("audit_logs", "readonly");
  const index = tx.objectStore("audit_logs").index("workspaceId");
  return index.getAll(workspaceId);
}

// --- Recurring Rules ---

export async function createRecurringRule(rule: RecurringRule): Promise<void> {
  const db = await getDb();
  await db.add("recurring_rules", rule);
}

export async function updateRecurringRule(rule: RecurringRule): Promise<void> {
  const db = await getDb();
  await db.put("recurring_rules", rule);
}

export async function deleteRecurringRule(id: string): Promise<void> {
  const db = await getDb();
  await db.delete("recurring_rules", id);
}

export async function getRecurringRulesByWorkspace(
  workspaceId: string
): Promise<RecurringRule[]> {
  const db = await getDb();
  const tx = db.transaction("recurring_rules", "readonly");
  const index = tx.objectStore("recurring_rules").index("workspaceId");
  return index.getAll(workspaceId);
}

export async function getPendingRecurringRules(): Promise<RecurringRule[]> {
  const db = await getDb();
  const today = new Date().toISOString().split("T")[0];
  const tx = db.transaction("recurring_rules", "readonly");
  const index = tx.objectStore("recurring_rules").index("nextDate");
  const range = IDBKeyRange.upperBound(today);
  return index.getAll(range);
}

// --- Products ---

export async function createProduct(product: Product): Promise<void> {
  const db = await getDb();
  await db.add("products", product);
}

export async function updateProduct(product: Product): Promise<void> {
  const db = await getDb();
  await db.put("products", product);
}

export async function deleteProduct(id: string): Promise<void> {
  const db = await getDb();
  await db.delete("products", id);
}

export async function getProductsByWorkspace(workspaceId: string): Promise<Product[]> {
  const db = await getDb();
  const tx = db.transaction("products", "readonly");
  const index = tx.objectStore("products").index("workspaceId");
  return index.getAll(workspaceId);
}

// --- Orders ---

export async function createOrder(order: Order): Promise<void> {
  const db = await getDb();
  await db.add("orders", order);
}

export async function updateOrder(order: Order): Promise<void> {
  const db = await getDb();
  await db.put("orders", order);
}

export async function deleteOrder(id: string): Promise<void> {
  const db = await getDb();
  await db.delete("orders", id);
}

export async function getOrdersByWorkspace(workspaceId: string): Promise<Order[]> {
  const db = await getDb();
  const tx = db.transaction("orders", "readonly");
  const index = tx.objectStore("orders").index("workspaceId");
  return index.getAll(workspaceId);
}

export async function getOrdersByCustomer(customerId: string): Promise<Order[]> {
  const db = await getDb();
  const tx = db.transaction("orders", "readonly");
  const index = tx.objectStore("orders").index("customerId");
  return index.getAll(customerId);
}

// --- Branches ---

export async function createBranch(branch: Branch): Promise<void> {
  const db = await getDb();
  await db.add("branches", branch);
}

export async function updateBranch(branch: Branch): Promise<void> {
  const db = await getDb();
  await db.put("branches", branch);
}

export async function deleteBranch(id: string): Promise<void> {
  const db = await getDb();
  await db.delete("branches", id);
}

export async function getBranchesByWorkspace(workspaceId: string): Promise<Branch[]> {
  const db = await getDb();
  const tx = db.transaction("branches", "readonly");
  const index = tx.objectStore("branches").index("workspaceId");
  return index.getAll(workspaceId);
}

// --- PIN Locks ---

export async function savePinLock(pin: PinLock): Promise<void> {
  const db = await getDb();
  await db.put("pin_locks", pin);
}

export async function getPinLock(userId: string): Promise<PinLock | undefined> {
  const db = await getDb();
  return db.get("pin_locks", userId);
}

export async function deletePinLock(userId: string): Promise<void> {
  const db = await getDb();
  await db.delete("pin_locks", userId);
}

// --- PPOB Categories ---

export async function createPpobCategory(cat: PpobCategory): Promise<void> {
  const db = await getDb();
  await db.add("ppob_categories", cat);
}

export async function getPpobCategoriesByWorkspace(workspaceId: string): Promise<PpobCategory[]> {
  const db = await getDb();
  const tx = db.transaction("ppob_categories", "readonly");
  const index = tx.objectStore("ppob_categories").index("workspaceId");
  return index.getAll(workspaceId);
}

export async function deletePpobCategory(id: string): Promise<void> {
  const db = await getDb();
  await db.delete("ppob_categories", id);
}

// --- Digital Products ---

export async function createDigitalProduct(prod: DigitalProduct): Promise<void> {
  const db = await getDb();
  await db.add("digital_products", prod);
}

export async function updateDigitalProduct(prod: DigitalProduct): Promise<void> {
  const db = await getDb();
  await db.put("digital_products", prod);
}

export async function deleteDigitalProduct(id: string): Promise<void> {
  const db = await getDb();
  await db.delete("digital_products", id);
}

export async function getDigitalProductsByWorkspace(workspaceId: string): Promise<DigitalProduct[]> {
  const db = await getDb();
  const tx = db.transaction("digital_products", "readonly");
  const index = tx.objectStore("digital_products").index("workspaceId");
  return index.getAll(workspaceId);
}

export async function getDigitalProductsByCategory(categoryId: string): Promise<DigitalProduct[]> {
  const db = await getDb();
  const tx = db.transaction("digital_products", "readonly");
  const index = tx.objectStore("digital_products").index("categoryId");
  return index.getAll(categoryId);
}

// --- PPOB Transactions ---

export async function createPpobTransaction(tx: PpobTransaction): Promise<void> {
  const db = await getDb();
  await db.add("ppob_transactions", tx);
}

export async function getPpobTransactionsByWorkspace(workspaceId: string): Promise<PpobTransaction[]> {
  const db = await getDb();
  const tx = db.transaction("ppob_transactions", "readonly");
  const index = tx.objectStore("ppob_transactions").index("workspaceId");
  return index.getAll(workspaceId);
}

// --- QRIS Payments ---

export async function createQrisPayment(qp: QrisPayment): Promise<void> {
  const db = await getDb();
  await db.add("qris_payments", qp);
}

export async function updateQrisPayment(qp: QrisPayment): Promise<void> {
  const db = await getDb();
  await db.put("qris_payments", qp);
}

export async function getQrisPaymentsByWorkspace(workspaceId: string): Promise<QrisPayment[]> {
  const db = await getDb();
  const tx = db.transaction("qris_payments", "readonly");
  const index = tx.objectStore("qris_payments").index("workspaceId");
  return index.getAll(workspaceId);
}

export async function getQrisPaymentsByStatus(workspaceId: string, status: "paid" | "unpaid"): Promise<QrisPayment[]> {
  const db = await getDb();
  const tx = db.transaction("qris_payments", "readonly");
  const index = tx.objectStore("qris_payments").index("status");
  return index.getAll(status);
}

export async function deleteQrisPayment(id: string): Promise<void> {
  const db = await getDb();
  await db.delete("qris_payments", id);
}

const RESET_TABLES: { name: string; index: string }[] = [
  { name: "accounts", index: "workspaceId" },
  { name: "categories", index: "workspaceId" },
  { name: "transactions", index: "workspaceId" },
  { name: "budgets", index: "workspaceId" },
  { name: "customers", index: "workspaceId" },
  { name: "suppliers", index: "workspaceId" },
  { name: "inventory_items", index: "workspaceId" },
  { name: "inventory_mutations", index: "workspaceId" },
  { name: "payment_methods", index: "workspaceId" },
  { name: "projects", index: "workspaceId" },
  { name: "calendar_events", index: "workspaceId" },
  { name: "recurring_rules", index: "workspaceId" },
  { name: "products", index: "workspaceId" },
  { name: "orders", index: "workspaceId" },
  { name: "branches", index: "workspaceId" },
  { name: "ppob_categories", index: "workspaceId" },
  { name: "digital_products", index: "workspaceId" },
  { name: "ppob_transactions", index: "workspaceId" },
  { name: "qris_payments", index: "workspaceId" },
  { name: "audit_logs", index: "workspaceId" },
];

export async function resetWorkspaceData(workspaceId: string): Promise<void> {
  const db = await getDb();
  for (const table of RESET_TABLES) {
    const ids: string[] = [];
    const tx = db.transaction(table.name, "readonly");
    const index = tx.objectStore(table.name).index(table.index);
    const records = await index.getAllKeys(workspaceId);
    ids.push(...records.map((k) => String(k)));
    await tx.done;
    const tx2 = db.transaction(table.name, "readwrite");
    for (const id of ids) {
      await tx2.objectStore(table.name).delete(id);
    }
    await tx2.done;
  }
}
