"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  createSiteEvent,
  updateSiteEvent,
  deleteSiteEvent,
  publishSiteEvent,
} from "@/lib/actions";

interface FormData {
  id?: number;
  title: string;
  date: string;
  location: string;
  description: string;
  link: string;
}

const empty: FormData = {
  title: "",
  date: "",
  location: "",
  description: "",
  link: "",
};

export default function AdminSiteEventEditorPage() {
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
    data.date.trim() !== "" &&
    data.location.trim() !== "";

  useEffect(() => {
    if (isNew) return;
    fetch(`/api/admin/events/${id}`)
      .then((r) => r.json())
      .then((row) => {
        if (!row?.id) return;
        setData({
          id: row.id,
          title: row.title ?? "",
          date: row.date ?? "",
          location: row.location ?? "",
          description: row.description ?? "",
          link: row.link ?? "",
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
        date: data.date.trim(),
        location: data.location.trim(),
        description: data.description.trim(),
        link: data.link.trim() || null,
      };
      if (isNew) {
        await createSiteEvent(payload);
        router.push("/admin/events");
      } else {
        await updateSiteEvent(data.id!, payload);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!data.id || !confirm("Delete this event?")) return;
    await deleteSiteEvent(data.id);
    router.push("/admin/events");
  }

  async function handlePublish() {
    if (!data.id) return;
    setPublishing(true);
    try {
      await publishSiteEvent(data.id, !published);
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
            href="/admin/events"
            className="text-xs tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Events
          </Link>
          <h1 className="font-heading text-3xl">
            {isNew ? "New event" : "Edit event"}
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
            placeholder="Event name"
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
            Location / venue
          </label>
          <Input
            value={data.location}
            onChange={(e) => set("location", e.target.value)}
            placeholder="City, venue, or Online"
          />
        </div>
        <div>
          <label className="text-xs tracking-widest uppercase text-muted-foreground block mb-1">
            Link (optional)
          </label>
          <Input
            value={data.link}
            onChange={(e) => set("link", e.target.value)}
            placeholder="Ticket page, recording, etc."
          />
        </div>
        <div>
          <label className="text-xs tracking-widest uppercase text-muted-foreground block mb-1">
            Description (optional)
          </label>
          <Textarea
            value={data.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Time, format, participants…"
            rows={5}
            className="min-h-[120px]"
          />
        </div>
      </div>
    </div>
  );
}
