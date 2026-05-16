export type Permission = {
  id: string;
  company_id: string;
  name: string;
  description: string | null;
  is_active: boolean;
};

export type RolePermission = {
  id: string;
  role_id: string;
  role_name: string;
  permission_id: string;
  permission_name: string;
  permission_description: string | null;
  permission_is_active: boolean;
};

export type AssignPermissionPayload = {
  role_id: string;
  permission_id: string;
};
