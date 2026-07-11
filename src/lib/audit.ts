import { createAuditLog, type AuditLog } from "@/lib/db";

export async function audit(opts: {
  workspaceId: string;
  userId: string;
  action: AuditLog["action"];
  entity: string;
  entityId: string;
  before?: unknown;
  after?: unknown;
}) {
  const log: AuditLog = {
    id: crypto.randomUUID(),
    workspaceId: opts.workspaceId,
    userId: opts.userId,
    action: opts.action,
    entity: opts.entity,
    entityId: opts.entityId,
    before: opts.before ? JSON.stringify(opts.before) : undefined,
    after: opts.after ? JSON.stringify(opts.after) : undefined,
    createdAt: Date.now(),
  };
  await createAuditLog(log);
}
