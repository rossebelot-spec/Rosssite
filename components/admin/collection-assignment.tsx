"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createCollectionForPicker,
  createCollectionWithFirstItem,
} from "@/lib/actions";
import type { CollectionItemLinkedType } from "@/db/schema";

export interface CollectionRef {
  id: number;
  title: string;
  slug: string;
}

interface Props {
  linkedType: CollectionItemLinkedType;
  linkedId: number | null;
  /** When true with `linkedId === null`, pick existing collections into `value` before the row exists (save applies membership). */
  staging?: boolean;
  value: CollectionRef[];
  allCollections: CollectionRef[];
  onChange: (value: CollectionRef[]) => void;
  onCollectionCreated: (coll: CollectionRef) => void;
}

function slugify(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function CollectionAssignment({
  linkedType,
  linkedId,
  staging = false,
  value,
  allCollections,
  onChange,
  onCollectionCreated,
}: Props) {
  const [addingNew, setAddingNew] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [creating, setCreating] = useState(false);
  /** Controlled value avoids uncontrolled select + DOM resets fighting React after option list changes (server actions / refresh). */
  const [pickValue, setPickValue] = useState("");

  if (linkedId === null && !staging) {
    return (
      <p className="text-xs text-muted-foreground">
        Save this item first to assign collections.
      </p>
    );
  }

  const memberIds = new Set(value.map((c) => c.id));
  const available = allCollections.filter((c) => !memberIds.has(c.id));

  function handleRemove(id: number) {
    onChange(value.filter((c) => c.id !== id));
  }

  function handlePick(val: string) {
    setPickValue("");
    if (!val || val === "") return;
    if (val === "__new__") {
      setAddingNew(true);
      return;
    }
    const id = Number(val);
    if (Number.isNaN(id)) return;
    const coll = allCollections.find((c) => c.id === id);
    if (coll) onChange([...value, coll]);
  }

  async function handleCreate() {
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    setCreating(true);
    try {
      const coll =
        linkedId !== null
          ? await createCollectionWithFirstItem({
              title: trimmed,
              slug: slugify(trimmed),
              linkedType,
              linkedId,
            })
          : await createCollectionForPicker({
              title: trimmed,
              slug: slugify(trimmed),
            });
      onChange([...value, coll]);
      onCollectionCreated(coll);
      setNewTitle("");
      setAddingNew(false);
      setPickValue("");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-3">
      {staging ? (
        <p className="text-xs text-muted-foreground">
          Existing and new collections are linked to this video when you save.
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {value.map((coll) => (
          <span
            key={coll.id}
            className="inline-flex items-center gap-1 rounded border border-border bg-surface px-2 py-1 text-sm"
          >
            {coll.title}
            <button
              type="button"
              onClick={() => handleRemove(coll.id)}
              className="text-muted-foreground hover:text-destructive transition-colors"
              aria-label={`Remove ${coll.title}`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}

        {!addingNew && (
          <select
            value={pickValue}
            onChange={(e) => handlePick(e.target.value)}
            className="rounded border border-border bg-background px-2 py-1 text-sm text-muted-foreground cursor-pointer focus:outline-none focus:border-foreground"
          >
            <option value="" disabled>
              + Add to collection
            </option>
            {available.map((c) => (
              <option key={c.id} value={String(c.id)}>
                {c.title}
              </option>
            ))}
            <option value="__new__">+ New Collection</option>
          </select>
        )}
      </div>

      {addingNew && (
        <div className="flex items-center gap-2">
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Collection title"
            className="h-8 text-sm max-w-xs"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreate();
              if (e.key === "Escape") {
                setAddingNew(false);
                setNewTitle("");
                setPickValue("");
              }
            }}
          />
          <Button
            size="sm"
            onClick={handleCreate}
            disabled={creating || !newTitle.trim()}
          >
            {creating ? "Creating…" : "Create"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setAddingNew(false);
              setNewTitle("");
              setPickValue("");
            }}
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}
