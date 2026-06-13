export type RoleKey = "PLATFORM_OWNER" | "PLATFORM_STAFF" | "TENANT_OWNER" | "BRANCH_MANAGER" | "CASHIER" | "ACCOUNTANT";

export type PermissionKey =
  | "platform.manage"
  | "tenant.manage"
  | "branches.manage"
  | "devices.manage"
  | "users.manage"
  | "products.manage"
  | "pos.use"
  | "orders.read"
  | "reports.read"
  | "refunds.manage"
  | "settings.manage";

export const rolePermissions: Record<RoleKey, PermissionKey[]> = {
  PLATFORM_OWNER: ["platform.manage", "reports.read"],
  PLATFORM_STAFF: ["platform.manage", "reports.read"],
  TENANT_OWNER: ["tenant.manage", "branches.manage", "devices.manage", "users.manage", "products.manage", "pos.use", "orders.read", "reports.read", "refunds.manage", "settings.manage"],
  BRANCH_MANAGER: ["pos.use", "orders.read", "reports.read", "refunds.manage"],
  CASHIER: ["pos.use"],
  ACCOUNTANT: ["orders.read", "reports.read", "refunds.manage"]
};

export function hasPermission(role: RoleKey, permission: PermissionKey) {
  return rolePermissions[role].includes(permission);
}
