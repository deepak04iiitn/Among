// Backend-only — user role definitions and role hierarchy utilities.

export const USER_ROLE = {
  USER: 'user',
  MODERATOR: 'moderator',
  ADMIN: 'admin',
} as const;

export type UserRole = (typeof USER_ROLE)[keyof typeof USER_ROLE];

export const ADMIN_ROLES: ReadonlySet<UserRole> = new Set([
  USER_ROLE.MODERATOR,
  USER_ROLE.ADMIN,
]);

export const PERMANENT_BAN_ROLES: ReadonlySet<UserRole> = new Set([USER_ROLE.ADMIN]);

export const ROLE_HIERARCHY: readonly UserRole[] = [
  USER_ROLE.USER,
  USER_ROLE.MODERATOR,
  USER_ROLE.ADMIN,
];

export function hasMinimumRole(userRole: UserRole, minimumRole: UserRole): boolean {
  return ROLE_HIERARCHY.indexOf(userRole) >= ROLE_HIERARCHY.indexOf(minimumRole);
}
