import { db, type BookOrBranch, type DbAuditLog } from "@/lib/db-v4";

type AuditAction = DbAuditLog["action"];
type EntityType = DbAuditLog["entityType"];

interface AuditInput {
  bookOrBranchId: BookOrBranch;
  action: AuditAction;
  entityType: EntityType;
  entityId: string;
  userId: string;
  userName: string;
  dataBefore?: unknown;
  dataAfter?: unknown;
  nominal?: number;
  alasan?: string;
}

export async function writeAuditLog(input: AuditInput) {
  const log: DbAuditLog = {
    id: crypto.randomUUID(),
    bookOrBranchId: input.bookOrBranchId,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    userId: input.userId,
    userName: input.userName,
    dataBefore: input.dataBefore ? JSON.stringify(input.dataBefore) : "",
    dataAfter: input.dataAfter ? JSON.stringify(input.dataAfter) : "",
    nominal: input.nominal ?? 0,
    alasan: input.alasan ?? "",
    createdAt: new Date().toISOString(),
  };
  await db.auditLogs.add(log);
  return log;
}

export async function getAuditLogs(
  branch?: BookOrBranch,
  entityType?: EntityType,
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
