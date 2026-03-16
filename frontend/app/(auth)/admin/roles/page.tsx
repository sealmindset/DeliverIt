"use client";

import { useEffect, useState, useCallback } from "react";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";
import type { RoleWithPermissions, Permission } from "@/lib/types";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { Plus, Shield, Trash2, Save, X, Lock } from "lucide-react";

// All resources and actions from app-context
const RESOURCES = [
  "dashboard",
  "projects",
  "tasks",
  "checklists",
  "users",
  "roles",
];
const ACTIONS = ["view", "create", "edit", "delete"];

function PermissionMatrix({
  role,
  allPermissions,
  onUpdate,
  readOnly,
}: {
  role: RoleWithPermissions;
  allPermissions: Permission[];
  onUpdate: (roleId: string, permissionIds: string[]) => void;
  readOnly: boolean;
}) {
  const rolePermIds = new Set(role.permissions.map((p) => p.id));

  const findPermission = (resource: string, action: string): Permission | undefined => {
    return allPermissions.find(
      (p) => p.resource === resource && p.action === action
    );
  };

  const togglePermission = (perm: Permission) => {
    if (readOnly) return;
    const newSet = new Set(rolePermIds);
    if (newSet.has(perm.id)) {
      newSet.delete(perm.id);
    } else {
      newSet.add(perm.id);
    }
    onUpdate(role.id, Array.from(newSet));
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="px-3 py-2 text-left font-medium text-[var(--muted-foreground)]">
              Resource
            </th>
            {ACTIONS.map((action) => (
              <th
                key={action}
                className="px-3 py-2 text-center font-medium text-[var(--muted-foreground)] capitalize"
              >
                {action}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]">
          {RESOURCES.map((resource) => (
            <tr key={resource} className="hover:bg-[var(--muted)]/50">
              <td className="px-3 py-2 font-medium capitalize">{resource}</td>
              {ACTIONS.map((action) => {
                const perm = findPermission(resource, action);
                if (!perm) {
                  return (
                    <td key={action} className="px-3 py-2 text-center">
                      <span className="text-xs text-[var(--muted-foreground)]">
                        --
                      </span>
                    </td>
                  );
                }
                const checked = rolePermIds.has(perm.id);
                return (
                  <td key={action} className="px-3 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => togglePermission(perm)}
                      disabled={readOnly}
                      className={cn(
                        "h-4 w-4 rounded border-[var(--input)] text-[var(--primary)] focus:ring-[var(--ring)]",
                        readOnly && "opacity-60 cursor-not-allowed"
                      )}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CreateRoleDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await apiPost("/roles", {
        name: name.trim(),
        description: description.trim(),
      });
      setName("");
      setDescription("");
      onClose();
      onCreated();
    } catch {
      // handle error
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-lg border border-[var(--border)] bg-[var(--card)] p-6 shadow-lg">
        <h2 className="text-lg font-semibold text-[var(--card-foreground)]">
          Create Custom Role
        </h2>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-md border border-[var(--input)] bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
              placeholder="Role name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-md border border-[var(--input)] bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
              placeholder="Role description"
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-[var(--input)] px-4 py-2 text-sm hover:bg-[var(--accent)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !name.trim()}
              className="rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

export default function RolesPage() {
  const [roles, setRoles] = useState<RoleWithPermissions[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRole, setExpandedRole] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [savingRole, setSavingRole] = useState<string | null>(null);
  const { hasPermission } = useAuth();

  const fetchData = useCallback(() => {
    setLoading(true);
    Promise.all([
      apiGet<RoleWithPermissions[]>("/roles?include_permissions=true"),
      apiGet<Permission[]>("/permissions"),
    ])
      .then(([r, p]) => {
        setRoles(r);
        setAllPermissions(p);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateRolePermissions = useCallback(
    async (roleId: string, permissionIds: string[]) => {
      setSavingRole(roleId);
      try {
        await apiPut(`/roles/${roleId}/permissions`, {
          permission_ids: permissionIds,
        });
        fetchData();
      } catch {
        // handle error
      } finally {
        setSavingRole(null);
      }
    },
    [fetchData]
  );

  const deleteRole = useCallback(
    async (roleId: string) => {
      if (!confirm("Are you sure you want to delete this role?")) return;
      try {
        await apiDelete(`/roles/${roleId}`);
        fetchData();
      } catch {
        // handle error
      }
    },
    [fetchData]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--primary)] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">
            Role Management
          </h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Manage roles and their permissions
          </p>
        </div>
        {hasPermission("roles", "create") && (
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            New Role
          </button>
        )}
      </div>

      <div className="space-y-4">
        {roles.map((role) => {
          const isExpanded = expandedRole === role.id;
          const isSuperAdmin = role.name === "Super Admin";

          return (
            <div
              key={role.id}
              className="rounded-lg border border-[var(--border)] bg-[var(--card)] overflow-hidden"
            >
              {/* Role header */}
              <button
                onClick={() =>
                  setExpandedRole(isExpanded ? null : role.id)
                }
                className="flex w-full items-center justify-between p-4 hover:bg-[var(--muted)]/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Shield
                    className={cn(
                      "h-5 w-5",
                      role.is_system
                        ? "text-[var(--primary)]"
                        : "text-[var(--muted-foreground)]"
                    )}
                  />
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[var(--card-foreground)]">
                        {role.name}
                      </span>
                      {role.is_system && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[var(--secondary)] px-2 py-0.5 text-[10px] font-medium text-[var(--muted-foreground)]">
                          <Lock className="h-3 w-3" />
                          System
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-[var(--muted-foreground)]">
                      {role.description}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[var(--muted-foreground)]">
                    {role.permissions?.length || 0} permissions
                  </span>
                  {!role.is_system && hasPermission("roles", "delete") && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteRole(role.id);
                      }}
                      className="rounded-md p-1 text-[var(--muted-foreground)] hover:text-[var(--destructive)] hover:bg-[var(--accent)]"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </button>

              {/* Permission matrix */}
              {isExpanded && (
                <div className="border-t border-[var(--border)] p-4">
                  {savingRole === role.id && (
                    <div className="mb-2 text-xs text-[var(--primary)]">
                      Saving...
                    </div>
                  )}
                  <PermissionMatrix
                    role={role}
                    allPermissions={allPermissions}
                    onUpdate={updateRolePermissions}
                    readOnly={
                      isSuperAdmin || !hasPermission("roles", "edit")
                    }
                  />
                  {isSuperAdmin && (
                    <p className="mt-2 text-xs text-[var(--muted-foreground)]">
                      Super Admin has all permissions and cannot be modified.
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <CreateRoleDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={fetchData}
      />
    </div>
  );
}
