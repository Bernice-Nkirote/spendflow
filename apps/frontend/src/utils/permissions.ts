export type AppUser = {
  id: string;
  name: string;
  email: string;
  company_id: string;
  role_id?: string | null;
  role_name?: string | null;
  company_name?: string | null;
  business_type?: string | null;
  is_company_owner?: boolean;
  permissions?: string[];
};

export function getStoredUser(): AppUser | null {
  const rawUser = localStorage.getItem("user");

  if (!rawUser) return null;

  try {
    return JSON.parse(rawUser) as AppUser;
  } catch {
    return null;
  }
}

export function userHasPermission(permission: string): boolean {
  const user = getStoredUser();

  if (!user) return false;

  return user.permissions?.includes(permission) ?? false;
}

export function userHasAnyPermission(permissions: string[]): boolean {
  const user = getStoredUser();

  if (!user) return false;

  return permissions.some((permission) =>
    user.permissions?.includes(permission),
  );
}
