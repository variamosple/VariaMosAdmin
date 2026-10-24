import { useSession } from "@variamosple/variamos-components";

export const BUG_UPDATE_PERMISSION = "bugs::update";
export const BUG_SYNC_PERMISSION = "bugs::sync";

// The API refuses these actions without the permission: the interface hides
// their buttons instead of offering a request that ends in a 403 (UX-38)
export const useBugPermissions = () => {
  const permissions = useSession()?.user?.permissions ?? [];
  return {
    canUpdate: permissions.includes(BUG_UPDATE_PERMISSION),
    canSync: permissions.includes(BUG_SYNC_PERMISSION),
  };
};
