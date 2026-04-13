"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  createOpEdCollection,
  updateOpEdCollection,
  deleteOpEdCollection,
} from "@/lib/actions";

interface CollectionData {
  id?: number;
  publication: string;
  slug: string;
  mastheadUrl: string;
  description: string;
  displayOrder: number;
}

const empty: CollectionData = {
  publication: "",
  slug: "",
  mastheadUrl: "",
  description: "",
  displayOrder: 0,
};

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function AdminOpEdCollectionEditor() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const isNew = id === "new";

  const [data, setData] = useState<CollectionData>(empty);
  const [saving, setSaving] = useState(false);

  const isValid = data.publication.trim() !== "" && data.slug.trim() !== "";

  useEffect(() => {
    if (!isNew) {
      fetch(`/api/admin/op-ed-collections/${id}`)
        .then((r) => r.json())
        .then((coll) => {
          setData({
            id: coll.id,
            publication: coll.publication,
            slug: coll.slug,
            mastheadUrl: coll.mastheadUrl ?? "",
            description: coll.description ?? "",
            displayOrder: coll.displayOrder ?? 0,
          });
        });
    }
  }, [id, isNew]);

  function set<K extends keyof CollectionData>(
    field: K,
    value: CollectionData[K]
  ) {
    setData((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload = {
        publication: data.publication.trim(),
        slug: data.slug.trim(),
        mastheadUrl: data.mastheadUrl.trim() || null,
        description: data.description.trim(),
        displayOrder: data.displayOrder,
      };
      if (isNew) {
        const created = await createOpEdCollection(payload);
        router.push(`/admin/op-ed-collections/${created.id}`);
      } else {
        await updateOpEdCollection(data.id!, payload);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!data.id || !confirm("Delete this collection? Articles will remain but lose their collection assignment.")) return;
    await deleteOpEdCollection(data.id);
    router.push("/admin/op-ed-collections");
  }

  return (
    <div className="space-y-6 max-w-screen-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/op-ed-collections"
            className="text-xs tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Collections
          </Link>
          <h1 className="font-heading text-3xl">
            {isNew ? "New Collection" : "Edit Collection"}
          </h1>
        </div>
        <div className="flex gap-3">
          {!isNew && (
            <Button variant="destructive" size="sm" onClick={handleDelete}>
              Delete
            </Button>
          )}
          <Button size="sm" onClick={handleSave} disabled={saving || !isValid}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-xs tracking-widest uppercase text-muted-foreground block mb-1">
            Publication Name
          </label>
          <Input
            value={data.publication}
            onChange={(e) => {
              set("publication", e.target.value);
              if (isNew) set("slug", slugify(e.target.value));
            }}
            placeholder="Canada's National Observer"
          />
        </div>

        <div>
          <label className="text-xs tracking-widest uppercase text-muted-foreground block mb-1">
            Slug
          </label>
          <Input
            value={data.slug}
            onChange={(e) => set("slug", e.target.value)}
            placeholder="national-observer"
          />
        </div>

        <div>
          <label className="text-xs tracking-widest uppercase text-muted-foreground block mb-1">
            Masthead Image URL
          </label>
          <Input
            value={data.mastheadUrl}
            onChange={(e) => set("mastheadUrl", e.target.value)}
            placeholder="/mastheads/national-observer.svg"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Path under /public (e.g. /mastheads/national-observer.svg) or a full URL.
          </p>
        </div>

        <div>
          <label className="text-xs tracking-widest uppercase text-muted-foreground block mb-1">
            Description (optional)
          </label>
          <Textarea
            value={data.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Brief description of this publication's op-eds"
            rows={2}
          />
        </div>

        <div>
          <label className="text-xs tracking-widest uppercase text-muted-foreground block mb-1">
            Display Order
          </label>
          <Input
            type="number"
            value={data.displayOrder}
            onChange={(e) => set("displayOrder", Number(e.target.value))}
            className="w-24"
          />
        </div>
      </div>

      {!isNew && (
        <div className="pt-6 border-t border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-xl">Articles in this Collection</h2>
            <Link
              href={`/admin/op-eds/new?collectionId=${data.id}`}
              className="text-xs tracking-widest uppercase px-4 py-2 border border-border hover:border-warm-accent hover:text-warm-accent transition-colors"
            >
              Add Article
            </Link>
          </div>
          <p className="text-xs text-muted-foreground">
            Manage individual articles from the{" "}
            <Link href="/admin/op-eds" className="underline hover:text-warm-accent">
              Op-eds list
            </Link>
            .
          </p>
        </div>
      )}
    </div>
  );
}
