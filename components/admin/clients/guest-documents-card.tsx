"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Eye, FileText, Loader2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import {
  deleteGuestDocument,
  getGuestDocumentSignedUrl,
} from "@/lib/guest-documents-actions";
import type { GuestDocumentRow } from "@/lib/queries";
import type { GuestDocumentKind } from "@prisma/client";

interface Props {
  guestId: string;
  initial: GuestDocumentRow[];
}

const KIND_LABEL: Record<GuestDocumentKind, string> = {
  ID_CARD: "Carte d'identité",
  PASSPORT: "Passeport",
  DRIVING_LICENSE: "Permis de conduire",
  OTHER: "Autre",
};

const KIND_OPTIONS: GuestDocumentKind[] = [
  "ID_CARD",
  "PASSPORT",
  "DRIVING_LICENSE",
  "OTHER",
];

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`;
}

export function GuestDocumentsCard({ guestId, initial }: Props) {
  const router = useRouter();
  const [documents, setDocuments] = useState(initial);
  const [kind, setKind] = useState<GuestDocumentKind>("ID_CARD");
  const [docNumber, setDocNumber] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [uploading, setUploading] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("kind", kind);
      if (docNumber.trim()) form.append("docNumber", docNumber.trim());
      if (expiresAt) form.append("expiresAt", expiresAt);

      const res = await fetch(`/api/admin/guests/${guestId}/documents`, {
        method: "POST",
        body: form,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: "Upload échoué" }));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      toast.success("Document ajouté");
      setDocNumber("");
      setExpiresAt("");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur upload");
    } finally {
      setUploading(false);
    }
  }

  function view(documentId: string) {
    setPendingId(documentId);
    startTransition(async () => {
      try {
        const { url } = await getGuestDocumentSignedUrl({ documentId });
        window.open(url, "_blank", "noopener,noreferrer");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Erreur");
      } finally {
        setPendingId(null);
      }
    });
  }

  function remove(documentId: string) {
    if (
      !window.confirm("Supprimer ce document ? Cette action est définitive.")
    ) {
      return;
    }
    setPendingId(documentId);
    startTransition(async () => {
      try {
        await deleteGuestDocument({ documentId });
        setDocuments((prev) => prev.filter((d) => d.id !== documentId));
        toast.success("Document supprimé");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Erreur");
      } finally {
        setPendingId(null);
      }
    });
  }

  return (
    <section className="detail-section">
      <h3>
        <FileText className="size-3.5" />
        Documents d&apos;identité
      </h3>

      {documents.length === 0 ? (
        <p className="guest-documents-empty">
          Aucun document. Téléversez la pièce d&apos;identité du voyageur
          ci-dessous (PDF ou image, 8 Mo max).
        </p>
      ) : (
        <ul className="guest-documents-list">
          {documents.map((d) => {
            const isBusy = pendingId === d.id;
            return (
              <li key={d.id} className="guest-document-item">
                <FileText className="size-5" />
                <div className="guest-document-main">
                  <div className="guest-document-name">{d.filename}</div>
                  <div className="guest-document-sub">
                    {KIND_LABEL[d.kind]} · {formatSize(d.sizeBytes)}
                    {d.docNumber ? ` · n° ${d.docNumber}` : ""}
                    {d.expiresAt
                      ? ` · exp. ${new Date(d.expiresAt).toLocaleDateString("fr-FR")}`
                      : ""}
                  </div>
                  <div className="guest-document-meta">
                    Ajouté par {d.uploadedBy?.name ?? "—"} ·{" "}
                    {new Date(d.createdAt).toLocaleDateString("fr-FR")}
                  </div>
                </div>
                <div className="guest-document-actions">
                  <button
                    type="button"
                    className="btn-admin btn-admin-ghost btn-admin-sm"
                    disabled={isBusy}
                    onClick={() => view(d.id)}
                  >
                    {isBusy ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Eye className="size-3.5" />
                    )}
                    Voir
                  </button>
                  <button
                    type="button"
                    className="btn-admin btn-admin-ghost btn-admin-sm"
                    disabled={isBusy}
                    onClick={() => remove(d.id)}
                    aria-label="Supprimer"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="guest-document-upload">
        <div className="guest-document-upload-row">
          <select
            className="select-admin"
            value={kind}
            onChange={(e) => setKind(e.target.value as GuestDocumentKind)}
            disabled={uploading}
          >
            {KIND_OPTIONS.map((k) => (
              <option key={k} value={k}>
                {KIND_LABEL[k]}
              </option>
            ))}
          </select>
          <input
            type="text"
            className="input-admin"
            placeholder="N° du document (optionnel)"
            value={docNumber}
            onChange={(e) => setDocNumber(e.target.value)}
            maxLength={60}
            disabled={uploading}
          />
          <input
            type="date"
            className="input-admin"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            aria-label="Date d'expiration"
            disabled={uploading}
          />
        </div>
        <label className="btn-admin btn-admin-primary btn-admin-sm guest-document-upload-btn">
          {uploading ? (
            <>
              <Loader2 className="size-3.5 animate-spin" />
              Téléversement…
            </>
          ) : (
            <>
              <Upload className="size-3.5" />
              Téléverser
            </>
          )}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif,application/pdf"
            onChange={handleUpload}
            disabled={uploading}
            style={{ display: "none" }}
          />
        </label>
      </div>
    </section>
  );
}
