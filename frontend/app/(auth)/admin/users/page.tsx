"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { apiGet, apiPost, apiPut } from "@/lib/api";
import type {
  User,
  Role,
  OidcDirectoryUser,
} from "@/lib/types";
import { DataTable } from "@/components/data-table";
import { DataTableColumnHeader } from "@/components/data-table-column-header";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { type ColumnDef } from "@tanstack/react-table";
import { Plus, UserPlus, Search } from "lucide-react";

function AddUserDialog({
  open,
  onClose,
  onAdded,
}: {
  open: boolean;
  onClose: () => void;
  onAdded: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<OidcDirectoryUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedUser, setSelectedUser] = useState<OidcDirectoryUser | null>(null);
  const [selectedRole, setSelectedRole] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      apiGet<Role[]>("/roles").then(setRoles).catch(() => {});
    }
  }, [open]);

  const searchUsers = async () => {
    if (!query.trim()) return;
    setSearching(true);
    try {
      const res = await apiGet<OidcDirectoryUser[]>(
        `/users/directory?q=${encodeURIComponent(query)}`
      );
      setResults(res);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const provisionUser = async () => {
    if (!selectedUser || !selectedRole) return;
    setSubmitting(true);
    try {
      await apiPost("/users", {
        oidc_subject: selectedUser.oidc_subject,
        email: selectedUser.email,
        display_name: selectedUser.display_name,
        role_id: selectedRole,
      });
      setSelectedUser(null);
      setSelectedRole("");
      setQuery("");
      setResults([]);
      onClose();
      onAdded();
    } catch {
      // handle error
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-lg border border-[var(--border)] bg-[var(--card)] p-6 shadow-lg max-h-[80vh] overflow-y-auto">
        <h2 className="text-lg font-semibold text-[var(--card-foreground)]">
          Add User from Directory
        </h2>
        <div className="mt-4 space-y-4">
          {/* Search */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchUsers()}
                placeholder="Search by name or email..."
                className="w-full rounded-md border border-[var(--input)] bg-transparent pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
              />
            </div>
            <button
              onClick={searchUsers}
              disabled={searching || !query.trim()}
              className="rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50"
            >
              {searching ? "..." : "Search"}
            </button>
          </div>

          {/* Results */}
          {results.length > 0 && (
            <div className="border border-[var(--border)] rounded-md divide-y divide-[var(--border)]">
              {results.map((u) => (
                <button
                  key={u.oidc_subject}
                  onClick={() => setSelectedUser(u)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[var(--accent)] transition-colors",
                    selectedUser?.oidc_subject === u.oidc_subject &&
                      "bg-[var(--accent)]"
                  )}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--primary)]/10 text-sm font-medium text-[var(--primary)]">
                    {u.display_name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)}
                  </div>
                  <div>
                    <div className="text-sm font-medium">
                      {u.display_name}
                    </div>
                    <div className="text-xs text-[var(--muted-foreground)]">
                      {u.email}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Role selection */}
          {selectedUser && (
            <div>
              <label className="block text-sm font-medium mb-1">
                Assign Role
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full rounded-md border border-[var(--input)] bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
              >
                <option value="">Select role...</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-[var(--input)] px-4 py-2 text-sm hover:bg-[var(--accent)]"
            >
              Cancel
            </button>
            <button
              onClick={provisionUser}
              disabled={submitting || !selectedUser || !selectedRole}
              className="inline-flex items-center gap-1 rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50"
            >
              <UserPlus className="h-4 w-4" />
              {submitting ? "Adding..." : "Add User"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function EditRoleDialog({
  user,
  open,
  onClose,
  onSaved,
}: {
  user: User | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [roleId, setRoleId] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && user) {
      setRoleId(user.role_id);
      apiGet<Role[]>("/roles").then(setRoles).catch(() => {});
    }
  }, [open, user]);

  if (!open || !user) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiPut(`/users/${user.id}`, { role_id: roleId });
      onClose();
      onSaved();
    } catch {
      // handle error
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-lg border border-[var(--border)] bg-[var(--card)] p-6 shadow-lg">
        <h2 className="text-lg font-semibold text-[var(--card-foreground)]">
          Edit Role for {user.display_name}
        </h2>
        <div className="mt-4 space-y-4">
          <select
            value={roleId}
            onChange={(e) => setRoleId(e.target.value)}
            className="w-full rounded-md border border-[var(--input)] bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
          >
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="rounded-md border border-[var(--input)] px-4 py-2 text-sm hover:bg-[var(--accent)]"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const { hasPermission } = useAuth();

  const fetchUsers = useCallback(() => {
    setLoading(true);
    apiGet<User[]>("/users")
      .then((res) => setUsers(res))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const toggleActive = useCallback(
    async (user: User) => {
      await apiPut(`/users/${user.id}`, {
        is_active: !user.is_active,
      });
      fetchUsers();
    },
    [fetchUsers]
  );

  const columns: ColumnDef<User, unknown>[] = useMemo(
    () => [
      {
        accessorKey: "display_name",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Name" />
        ),
        cell: ({ row }) => {
          const name = row.getValue("display_name") as string;
          return (
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--primary)]/10 text-sm font-medium text-[var(--primary)]">
                {name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)}
              </div>
              <span className="font-medium">{name}</span>
            </div>
          );
        },
      },
      {
        accessorKey: "email",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Email" />
        ),
        cell: ({ row }) => (
          <span className="text-sm text-[var(--muted-foreground)]">
            {row.getValue("email")}
          </span>
        ),
      },
      {
        id: "role",
        accessorFn: (row) => row.role_name || "Unknown",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Role" />
        ),
        cell: ({ row }) => {
          const roleName = row.original.role_name || "Unknown";
          return (
            <span className="inline-flex rounded-full bg-[var(--secondary)] px-2.5 py-0.5 text-xs font-medium">
              {roleName}
            </span>
          );
        },
        filterFn: "equals",
      },
      {
        accessorKey: "is_active",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Status" />
        ),
        cell: ({ row }) => {
          const active = row.getValue("is_active") as boolean;
          return (
            <span
              className={cn(
                "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                active
                  ? "bg-[var(--success)]/15 text-[var(--success)]"
                  : "bg-[var(--muted)] text-[var(--muted-foreground)]"
              )}
            >
              {active ? "Active" : "Inactive"}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const user = row.original;
          return (
            <div className="flex items-center gap-2">
              {hasPermission("users", "edit") && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingUser(user);
                    }}
                    className="rounded-md px-2 py-1 text-xs text-[var(--primary)] hover:bg-[var(--accent)]"
                  >
                    Edit Role
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleActive(user);
                    }}
                    className={cn(
                      "rounded-md px-2 py-1 text-xs hover:bg-[var(--accent)]",
                      user.is_active
                        ? "text-[var(--destructive)]"
                        : "text-[var(--success)]"
                    )}
                  >
                    {user.is_active ? "Deactivate" : "Activate"}
                  </button>
                </>
              )}
            </div>
          );
        },
      },
    ],
    [hasPermission, toggleActive]
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
            User Management
          </h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Manage user accounts and role assignments
          </p>
        </div>
        {hasPermission("users", "create") && (
          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-2 rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Add User
          </button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={users}
        searchKey="display_name"
        searchPlaceholder="Search users..."
        storageKey="admin-users"
      />

      <AddUserDialog
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onAdded={fetchUsers}
      />
      <EditRoleDialog
        user={editingUser}
        open={!!editingUser}
        onClose={() => setEditingUser(null)}
        onSaved={fetchUsers}
      />
    </div>
  );
}
