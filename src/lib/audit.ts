import { createAuditLog, getAuditLogsByWorkspace, type AuditLog } from "@/lib/db";

export async function logAction(
  workspaceId: string,
  userId: string,
  action: AuditLog["action"],
  entity: string,
  entityId: string,
  before?: unknown,
  after?: unknown
) {
  await createAuditLog({
    id: crypto.randomUUID(),
    workspaceId,
    userId,
    action,
    entity,
    entityId,
    before: before ? JSON.stringify(before) : undefined,
    after: after ? JSON.stringify(after) : undefined,
    createdAt: Date.now(),
  });
}

export async function getLogs(workspaceId: string): Promise<AuditLog[]> {
  const logs = await getAuditLogsByWorkspace(workspaceId);
  return logs.sort((a, b) => b.createdAt - a.createdAt);
}
