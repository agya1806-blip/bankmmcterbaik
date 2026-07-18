import { db, type DbUser, type UserRole, type UnitId } from "@/lib/db-v4";
import { validResult, ValidationResult, requiredError } from "@/services/types";

export interface IAuthService {
  login(nama: string, pin: string): Promise<DbUser | null>;
  register(data: RegisterInput): Promise<DbUser>;
  getUser(id: string): Promise<DbUser | undefined>;
  getUserByName(nama: string): Promise<DbUser | undefined>;
  getAllUsers(): Promise<DbUser[]>;
  updateUser(id: string, data: UpdateUserInput): Promise<void>;
  deleteUser(id: string): Promise<void>;
  changePin(id: string, newPin: string): Promise<void>;
  validatePin(pin: string): boolean;
  validateRegister(data: RegisterInput): ValidationResult;
}

export interface RegisterInput {
  nama: string;
  pin: string;
  role?: UserRole;
  allowedUnits?: string[];
}

export interface UpdateUserInput {
  nama?: string;
  pinHash?: string;
  fotoUrl?: string;
  role?: UserRole;
  allowedUnits?: string[];
  isActive?: boolean;
}

class AuthService implements IAuthService {
  async login(nama: string, pin: string): Promise<DbUser | null> {
    const user = await db.users.where("nama").equals(nama).first();
    if (!user) return null;
    if (user.pinHash !== pin) return null;
    if (!user.isActive) return null;
    return user;
  }

  async register(data: RegisterInput): Promise<DbUser> {
    const now = new Date().toISOString();
    const user: DbUser = {
      id: crypto.randomUUID(),
      bookOrBranchId: "usaha-warkop" as UnitId,
      nama: data.nama,
      pinHash: data.pin,
      fotoUrl: "",
      role: data.role || "admin",
      allowedUnits: data.allowedUnits || [],
      isActive: true,
      createdAt: now,
    };
    await db.users.add(user);
    return user;
  }

  async getUser(id: string): Promise<DbUser | undefined> {
    return db.users.get(id);
  }

  async getUserByName(nama: string): Promise<DbUser | undefined> {
    return db.users.where("nama").equals(nama).first();
  }

  async getAllUsers(): Promise<DbUser[]> {
    return db.users.toArray();
  }

  async updateUser(id: string, data: UpdateUserInput): Promise<void> {
    await db.users.update(id, data as any);
  }

  async deleteUser(id: string): Promise<void> {
    await db.users.delete(id);
  }

  async changePin(id: string, newPin: string): Promise<void> {
    await db.users.update(id, { pinHash: newPin });
  }

  validatePin(pin: string): boolean {
    return pin.length >= 4 && /^\d+$/.test(pin);
  }

  validateRegister(data: RegisterInput): ValidationResult {
    if (!data.nama || !data.nama.trim()) {
      return { valid: false, errors: [requiredError("nama")] };
    }
    if (!data.pin || !this.validatePin(data.pin)) {
      return { valid: false, errors: [{ field: "pin", message: "PIN harus minimal 4 digit angka" }] };
    }
    return validResult();
  }
}

export const authService = new AuthService();
