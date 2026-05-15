"use client";

import { useState, useTransition } from "react";
import { Star, X } from "lucide-react";
import { toast } from "sonner";
import { setGuestVip, setGuestTags } from "@/lib/guest-actions";

interface Props {
  guestId: string;
  initialIsVip: boolean;
  initialTags: string[];
}

export function VipTagsEditor({ guestId, initialIsVip, initialTags }: Props) {
  const [isVip, setIsVip] = useState(initialIsVip);
  const [tags, setTags] = useState<string[]>(initialTags);
  const [draftTag, setDraftTag] = useState("");
  const [pending, startTransition] = useTransition();

  function toggleVip() {
    const next = !isVip;
    const prev = isVip;
    setIsVip(next);
    startTransition(async () => {
      try {
        await setGuestVip({ guestId, isVip: next });
        toast.success(next ? "Marqué comme VIP" : "VIP retiré");
      } catch (err) {
        setIsVip(prev);
        toast.error(err instanceof Error ? err.message : "Erreur");
      }
    });
  }

  function commitTags(nextTags: string[]) {
    const prev = tags;
    setTags(nextTags);
    startTransition(async () => {
      try {
        const res = await setGuestTags({ guestId, tags: nextTags });
        setTags(res.tags);
      } catch (err) {
        setTags(prev);
        toast.error(err instanceof Error ? err.message : "Erreur");
      }
    });
  }

  function addTag(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = draftTag.trim();
    if (!trimmed) return;
    if (tags.includes(trimmed)) {
      setDraftTag("");
      return;
    }
    if (tags.length >= 20) {
      toast.error("20 tags maximum");
      return;
    }
    setDraftTag("");
    commitTags([...tags, trimmed]);
  }

  function removeTag(tag: string) {
    commitTags(tags.filter((t) => t !== tag));
  }

  return (
    <div className="vip-tags-editor">
      <button
        type="button"
        onClick={toggleVip}
        disabled={pending}
        className={`vip-toggle${isVip ? " active" : ""}`}
        aria-pressed={isVip}
      >
        <Star
          className="size-3.5"
          fill={isVip ? "currentColor" : "none"}
          strokeWidth={1.5}
        />
        {isVip ? "VIP" : "Marquer VIP"}
      </button>

      <div className="guest-tags-wrap">
        {tags.map((t) => (
          <span key={t} className="guest-tag-chip removable">
            {t}
            <button
              type="button"
              onClick={() => removeTag(t)}
              disabled={pending}
              aria-label={`Retirer ${t}`}
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
        <form onSubmit={addTag} className="guest-tag-add-form">
          <input
            type="text"
            placeholder="Ajouter un tag…"
            value={draftTag}
            onChange={(e) => setDraftTag(e.target.value)}
            maxLength={40}
            disabled={pending}
          />
        </form>
      </div>
    </div>
  );
}
