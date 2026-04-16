"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  createLiteraryPublication,
  updateLiteraryPublication,
  deleteLiteraryPublication,
  publishLiteraryPublication,
} from "@/lib/actions";

const KIND_OPTIONS = [
  { value: "journal", label: "Journal" },
  { value: "anthology", label: "Anthology" },
  { value: "translation", label: "Translation" },
  { value: "prize", label: "Prize / Shortlist" },
  { value: "award", label: "Award" },
];

interface FormData {
  id?: number;
  title: string;
  publication: string;
  date: string;
  kind: string;
  url: string;
  description: string;
  displayOrder: string;
}

const empty: FormData = {
  title: "",
  publication: "",
  date: "",
  kind: "journal",
  url: "",
  description: "",
  displayOrder: "0",
};

export default function AdminLiteraryPublicationEditorPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const isNew = id === "new";

  const [data, setData] = useState<FormData>(empty);
  const [saving, setSaving] = useState(false);
  const [published, setPublished] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const isValid =
    data.title.trim() !== "" &&
    data.publication.trim() !== "" &&
    data.date.trim() !== "";

  useEffect(() => {
    if (isNew) return;
    fetch(`/api/admin/literary-publications/${id}`)
      .then((r) => r.json())
      .then((row) => {
        if (!row?.id) return;
        setData({
          id: row.id,
          title: row.title ?? "",
          publication: row.publication ?? "",
          date: row.date ?? "",
          kind: row.kind ?? "journal",
          url: row.url ?? "",
          description: row.description ?? "",
          displayOrder: String(row.displayOrder ?? 0),
        });
        setPublished(row.published ?? false);
      });
  }, [id, isNew]);

  function set<K extends keyof FormData>(field: K, value: FormData[K]) {
    setData((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    if (!isValid) return;
    setSaving(true);
    try {
      const payload = {
        title: data.title.trim(),
        publication: data.publication.trim(),
        date: data.date.trim(),
        kind: data.kind,
        url: data.url.trim() || null,
        description: data.description.trim(),
        displayOrder: parseInt(data.displayOrder, 10) || 0,
      };
      if (isNew) {
        await createLiteraryPublication(payload);
        router.push("/admin/literary-publications");
      } else {
        await updateLiteraryPublication(data.id!, payload);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!data.id || !confirm("Delete this entry?")) return;
    await deleteLiteraryPublication(data.id);
    router.push("/admin/literary-publications");
  }

  async function handlePublish() {
    if (!data.id) return;
    setPublishing(true);
    try {
      await publishLiteraryPublication(data.id, !published);
      setPublished(!published);
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div className="space-y-6 max-w-screen-md">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <Link
            href="/admin/literary-publications"
            className="text-xs tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Publications
          </Link>
          <h1 className="font-heading text-3xl">
            {isNew ? "New entry" : "Edit entry"}
          </h1>
          {!isNew && (
            <span
              className={`text-xs tracking-widest uppercase px-2 py-0.5 border ${
                published
                  ? "border-green-600 text-green-600"
                  : "border-muted-foreground text-muted-foreground"
              }`}
            >
              {published ? "Published" : "Draft"}
            </span>
          )}
        </div>
        <div className="flex gap-3">
          {!isNew && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePublish}
                disabled={publishing || !isValid}
              >
                {publishing
                  ? published
                    ? "Unpublishing…"
                    : "Publishing…"
                  : published
                    ? "Unpublish"
                    : "Publish"}
              </Button>
              <Button variant="destructive" size="sm" onClick={handleDelete}>
                Delete
              </Button>
            </>
          )}
          <Button size="sm" onClick={handleSave} disabled={saving || !isValid}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-xs tracking-widest uppercase text-muted-foreground block mb-1">
            Poem / piece title *
          </label>
          <Input
            value={data.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="e.g. O'Hare, Terminal Two, Concourse E, Gate E1"
          />
        </div>
        <div>
          <label className="text-xs tracking-widest uppercase text-muted-foreground block mb-1">
            Publication / prize name *
          </label>
          <Input
            value={data.publication}
            onChange={(e) => set("publication", e.target.value)}
            placeholder="e.g. Best Canadian Poetry in English"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs tracking-widest uppercase text-muted-foreground block mb-1">
              Date * (YYYY or YYYY-MM-DD)
            </label>
            <Input
              value={data.date}
              onChange={(e) => set("date", e.target.value)}
              placeholder="e.g. 2013"
            />
          </div>
          <div>
            <label className="text-xs tracking-widest uppercase text-muted-foreground block mb-1">
              Kind
            </label>
            <select
              value={data.kind}
              onChange={(e) => set("kind", e.target.value)}
              className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {KIND_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="text-xs tracking-widest uppercase text-muted-foreground block mb-1">
            URL (optional)
          </label>
          <Input
            value={data.url}
            onChange={(e) => set("url", e.target.value)}
            placeholder="https://…"
          />
        </div>
        <div>
          <label className="text-xs tracking-widest uppercase text-muted-foreground block mb-1">
            Description (optional)
          </label>
          <Textarea
            value={data.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Brief context or note…"
            rows={4}
            className="min-h-[100px]"
          />
        </div>
        <div>
          <label className="text-xs tracking-widest uppercase text-muted-foreground block mb-1">
            Display order
          </label>
          <Input
            type="number"
            value={data.displayOrder}
            onChange={(e) => set("displayOrder", e.target.value)}
            className="w-24"
          />
        </div>
      </div>
    </div>
  );
}
