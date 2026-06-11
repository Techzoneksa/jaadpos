import { AppShell } from "@/components/app-shell";
import { PosTerminal } from "@/components/pos-terminal";

export default function PosPage() {
  return (
    <AppShell title="شاشة نقاط البيع" allowedRoles={["TENANT_OWNER", "BRANCH_MANAGER", "CASHIER"]}>
      <PosTerminal />
    </AppShell>
  );
}
