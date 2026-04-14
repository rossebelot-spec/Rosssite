"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  createPressItem,
  updatePressItem,
  deletePressItem,
  publishPressItem,
} from "@/lib/actions";

interface FormData {
  id?: number;
  title: string;
  outlet: string;
  date: string;
  url: string;
  description: string;
}

const empty: FormData = {
  title: "",
  outlet: "",
  date: "",
  url: "",
  description: "",
};

export default function AdminPressEditorPage() {
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
    data.outlet.trim() !== "" &&
    data.date.trim() !== "";

  useEffect(() => {
    if (isNew) return;
    fetch(`/api/admin/press/${id}`)
      .then((r) => r.json())
      .then((row) => {
        if (!row?.id) return;
        setData({
          id: row.id,
          title: row.title ?? "",
          outlet: row.outlet ?? "",
          date: row.date ?? "",
          url: row.url ?? "",
          description: row.description ?? "",
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
        outlet: data.outlet.trim(),
        date: data.date.trim(),
        url: data.url.trim() || null,
        description: data.description.trim(),
      };
      if (isNew) {
        await createPressItem(payload);
        router.push("/admin/press");
      } else {
        await updatePressItem(data.id!, payload);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!data.id || !confirm("Delete this press entry?")) return;
    await deletePressItem(data.id);
    router.push("/admin/press");
  }

  async function handlePublish() {
    if (!data.id) return;
    setPublishing(true);
    try {
      await publishPressItem(data.id, !published);
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
            href="/admin/press"
            className="text-xs tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Press
          </Link>
          <h1 className="font-heading text-3xl">
            {isNew ? "New press entry" : "Edit press entry"}
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
            Title
          </label>
          <Input
            value={data.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="Headline"
          />
        </div>
        <div>
          <label className="text-xs tracking-widest uppercase text-muted-foreground block mb-1">
            Outlet
          </label>
          <Input
            value={data.outlet}
            onChange={(e) => set("outlet", e.target.value)}
            placeholder="Publication or program"
          />
        </div>
        <div>
          <label className="text-xs tracking-widest uppercase text-muted-foreground block mb-1">
            Date
          </label>
          <Input
            type="date"
            value={data.date}
            onChange={(e) => set("date", e.target.value)}
          />
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
            placeholder="Short excerpt shown on the public page"
            rows={5}
            className="min-h-[120px]"
          />
        </div>
      </div>
    </div>
  );
}
