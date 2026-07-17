import { db, type UnitId, type DbAuditLog } from "@/lib/db-v4";

export interface AuditInput {
  bookOrBranchId: UnitId;
  action: DbAuditLog["action"];
  entityType: DbAuditLog["entityType"];
  entityId: string;
  userId: string;
  userName: string;
  dataBefore?: string;
  dataAfter?: string;
  nominal?: number;
  alasan?: string;
}

export async function writeAuditLog(input: AuditInput): Promise<void> {
  const now = new Date().toISOString();
  const log: DbAuditLog = {
    id: crypto.randomUUID(),
    bookOrBranchId: input.bookOrBranchId,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    userId: input.userId,
    userName: input.userName,
    dataBefore: input.dataBefore ?? "",
    dataAfter: input.dataAfter ?? "",
    nominal: input.nominal ?? 0,
    alasan: input.alasan ?? "",
    createdAt: now,
  };
  await db.auditLogs.add(log);
}

export async function getAuditLogs(
  branch?: UnitId,
  entityType?: DbAuditLog["entityType"],
  entityId?: string,
  limit = 50
): Promise<DbAuditLog[]> {
  let collection = db.auditLogs.orderBy("createdAt").reverse();

  if (branch) {
    collection = db.auditLogs
      .where("bookOrBranchId")
      .equals(branch)
      .reverse() as typeof collection;
  }

  let results = await collection.toArray();

  if (entityType) {
    results = results.filter((r) => r.entityType === entityType);
  }
  if (entityId) {
    results = results.filter((r) => r.entityId === entityId);
  }

  return results.slice(0, limit);
}
