"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { MoreHorizontal, X } from "lucide-react";
import { toast } from "sonner";
import type { UserRole } from "@prisma/client";
import { inviteUser } from "@/lib/settings-actions";

export interface UserRow {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  lastLoginAt: Date | null;
  isCurrent: boolean;
}

interface SectionUsersProps {
  users: UserRow[];
}

interface RoleStyle {
  className: string;
  label: string;
}

const ROLE_STYLE: Record<UserRole, RoleStyle> = {
  ADMIN: { className: "role-pill role-admin", label: "Administrateur" },
  MANAGER: { className: "role-pill role-front", label: "Gestionnaire" },
  RECEPTION: { className: "role-pill role-front", label: "Réception" },
  VIEWER: { className: "role-pill role-viewer", label: "Lecture seule" },
};

const ROLE_OPTIONS: readonly { value: UserRole; label: string }[] = [
  { value: "ADMIN", label: "Administrateur" },
  { value: "MANAGER", label: "Gestionnaire" },
  { value: "RECEPTION", label: "Réception" },
  { value: "VIEWER", label: "Lecture seule" },
] as const;

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => part[0] ?? "")
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatLastLogin(date: Date | null): string {
  if (!date) return "Jamais";
  return formatDistanceToNow(date, { addSuffix: true, locale: fr });
}

export function SectionUsers({ users }: SectionUsersProps) {
  const [open, setOpen] = useState(false);

  const distinctRoles = useMemo(
    () => new Set(users.map((u) => u.role)).size,
    [users],
  );

  return (
    <div className="small-card">
      <div className="users-card-head">
        <div>
          <h3>Utilisateurs &amp; rôles</h3>
          <div className="sub">
            {users.length} utilisateur{users.length > 1 ? "s" : ""} ·{" "}
            {distinctRoles} rôle{distinctRoles > 1 ? "s" : ""} configuré
            {distinctRoles > 1 ? "s" : ""}
          </div>
        </div>
        <button
          type="button"
          className="btn-admin btn-admin-primary"
          onClick={() => setOpen(true)}
        >
          + Nouvel utilisateur
        </button>
      </div>

      <div className="users-table">
        <div className="user-row header">
          <div />
          <div>Utilisateur</div>
          <div>Rôle</div>
          <div>Dernière connexion</div>
          <div>Statut</div>
          <div />
        </div>

        {users.length === 0 ? (
          <div className="user-row" style={{ gridTemplateColumns: "1fr" }}>
            <div style={{ color: "var(--text-muted)" }}>
              Aucun utilisateur — invitez votre première coéquipière.
            </div>
          </div>
        ) : (
          users.map((user) => <UserRowItem key={user.id} user={user} />)
        )}
      </div>

      {open ? <InviteUserModal onClose={() => setOpen(false)} /> : null}
    </div>
  );
}

function UserRowItem({ user }: { user: UserRow }) {
  const roleStyle = ROLE_STYLE[user.role];
  const initials = initialsOf(user.name);
  const avatarStyle = user.isCurrent
    ? {
        background:
          "linear-gradient(135deg, var(--primary), var(--primary-deep))",
        color: "var(--bg-app)",
      }
    : undefined;

  return (
    <div className="user-row">
      <div className="avatar" style={avatarStyle}>
        {initials || "?"}
      </div>
      <div className="info">
        <div className="name">
          {user.name}
          {user.isCurrent ? (
            <span
              style={{
                color: "var(--text-muted)",
                fontWeight: 400,
                fontSize: "0.78rem",
                marginLeft: 6,
              }}
            >
              (vous)
            </span>
          ) : null}
        </div>
        <div className="email">{user.email}</div>
      </div>
      <div>
        <span className={roleStyle.className}>{roleStyle.label}</span>
      </div>
      <div style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>
        {formatLastLogin(user.lastLoginAt)}
      </div>
      <div>
        <span className="tag tag-confirmed">Actif</span>
      </div>
      <div>
        <button
          type="button"
          className="icon-btn"
          style={{ width: 24, height: 24 }}
          aria-label={`Actions sur ${user.name}`}
        >
          <MoreHorizontal aria-hidden style={{ width: 14, height: 14 }} />
        </button>
      </div>
    </div>
  );
}

function InviteUserModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("RECEPTION");
  const [pending, startTransition] = useTransition();

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      try {
        await inviteUser({ name, email, role });
        toast.success("Invitation envoyée", {
          description:
            "L'utilisateur a été créé. Email d'invitation à brancher avec Resend.",
        });
        onClose();
        router.refresh();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erreur inconnue";
        toast.error("Échec de l'invitation", { description: message });
      }
    });
  }

  return (
    <div
      className="settings-invite-modal-backdrop"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="settings-invite-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="invite-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <h3 id="invite-modal-title">Inviter un utilisateur</h3>
          <button
            type="button"
            className="icon-btn"
            onClick={onClose}
            aria-label="Fermer"
          >
            <X aria-hidden style={{ width: 16, height: 16 }} />
          </button>
        </div>

        <form onSubmit={submit} className="modal-body">
          <div className="field">
            <label htmlFor="invite-name">Nom complet</label>
            <input
              id="invite-name"
              className="input-admin"
              type="text"
              required
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Leïla Mansour"
            />
          </div>
          <div className="field">
            <label htmlFor="invite-email">Email</label>
            <input
              id="invite-email"
              className="input-admin"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="prenom@diaryasmine.tn"
            />
          </div>
          <div className="field">
            <label htmlFor="invite-role">Rôle</label>
            <select
              id="invite-role"
              className="select-admin"
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
            >
              {ROLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn-admin btn-admin-ghost"
              onClick={onClose}
              disabled={pending}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="btn-admin btn-admin-primary"
              disabled={pending}
            >
              {pending ? "Création..." : "Inviter"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
