export type RoleKey = "PLATFORM_ADMIN" | "TENANT_OWNER" | "BRANCH_MANAGER" | "CASHIER" | "ACCOUNTANT";

export type PermissionKey =
  | "platform.manage"
  | "tenant.manage"
  | "branches.manage"
  | "users.manage"
  | "products.manage"
  | "pos.use"
  | "orders.read"
  | "reports.read"
  | "refunds.manage"
  | "settings.manage";

export const rolePermissions: Record<RoleKey, PermissionKey[]> = {
  PLATFORM_ADMIN: ["platform.manage", "reports.read"],
  TENANT_OWNER: ["tenant.manage", "branches.manage", "users.manage", "products.manage", "pos.use", "orders.read", "reports.read", "refunds.manage", "settings.manage"],
  BRANCH_MANAGER: ["pos.use", "orders.read", "reports.read", "refunds.manage"],
  CASHIER: ["pos.use"],
  ACCOUNTANT: ["orders.read", "reports.read", "refunds.manage"]
};

export function hasPermission(role: RoleKey, permission: PermissionKey) {
  return rolePermissions[role].includes(permission);
}
