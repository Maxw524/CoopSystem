export function getUserRoles(user) {
  const rawRoles = Array.isArray(user?.roles) ? user.roles : [];

  return Array.from(
    new Set(
      rawRoles
        .filter((role) => typeof role === "string")
        .map((role) => role.trim())
        .filter(Boolean)
    )
  );
}

export function getUserPermissions(user) {
  const rawPermissions = Array.isArray(user?.permissions)
    ? user.permissions
    : Array.isArray(user?.permissoes)
      ? user.permissoes
      : [];

  return Array.from(
    new Set(
      rawPermissions
        .filter((permission) => typeof permission === "string")
        .map((permission) => permission.trim())
        .filter(Boolean)
    )
  );
}

export function hasAnyRole(user, roles) {
  const userRoles = getUserRoles(user);
  return roles.some((role) => userRoles.includes(role));
}

export function hasPermission(user, permissionKey) {
  if (!user || !permissionKey) return false;
  if (user.admin === true || hasAnyRole(user, ["Admin"])) return true;

  return getUserPermissions(user).includes(permissionKey);
}

export function canAccessModule(user, moduleKey) {
  if (!user) return false;
  if (user.admin === true || hasAnyRole(user, ["Admin"])) return true;

  switch (moduleKey) {
    case "juridico":
      return user.permiteJuridico === true || hasAnyRole(user, ["Juridico"]);
    case "sistrawts":
      return user.permiteSistrawts === true || hasAnyRole(user, ["Sistrawts"]);
    case "simuladorTaxa":
      return user.permiteSimuladorTaxa === true || hasAnyRole(user, ["Credito I"]);
    default:
      return false;
  }
}
