export type TenantScopedRecord = {
  tenantId: string;
};

export function assertTenantAccess(record: TenantScopedRecord | null | undefined, tenantId: string) {
  if (!record || record.tenantId !== tenantId) {
    throw new Error("Tenant access denied");
  }

  return record;
}

export function tenantWhere<T extends object>(tenantId: string, where?: T) {
  return {
    tenantId,
    ...(where ?? {})
  };
}
