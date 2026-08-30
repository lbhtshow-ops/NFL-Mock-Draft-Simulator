const safe = (value, maximum = 160) => typeof value === "string" ? value.replace(/(?:postgres(?:ql)?:\/\/|password|token|secret|select|insert|update|delete)[^\s]*/gi, "[REDACTED]").slice(0, maximum) : null;
export function mapPgError(error, context = {}) {
  return Object.freeze({ code: safe(error?.code, 48) ?? "PG_DRIVER_FAILURE", severity: safe(error?.severity, 24), message: safe(error?.message) ?? "PostgreSQL driver operation failed", stageRef: context.stageRef ?? null, connectionPhase: context.connectionPhase ?? null, transactionPhase: context.transactionPhase ?? null, uncertainty: context.uncertainty === true || error?.uncertain === true });
}
