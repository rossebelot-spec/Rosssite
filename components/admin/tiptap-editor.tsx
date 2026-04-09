"use client";

import { useEditor, EditorContent, useEditorState } from "@tiptap/react";
import type { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { TextStyleKit } from "@tiptap/extension-text-style";
import { useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";

interface TiptapEditorProps {
  content: string;
  onChange: (html: string) => void;
  /** Match public essay reading layout (folio paper, Lora/stone typography). */
  readingTheme?: boolean;
}

/**
 * Replaces each paragraph boundary (</p> followed by <p…>) with a soft break (<br>),
 * merging consecutive paragraphs into one block. Runs until no more boundaries match.
 */
function fixParagraphSpacingToSoftBreaks(html: string): string {
  const boundary = /<\/p>\s*<p\b[^>]*>/gi;
  let result = html;
  let prev = "";
  while (result !== prev) {
    prev = result;
    result = result.replace(boundary, "<br>");
  }
  return result;
}

/** Normalize color from span style (hex, rgb) for <input type="color"> */
/** Same behavior as Color extension commands, using core `setMark` (avoids missing chain helpers in some builds). */
function applyTextStyleColor(editor: Editor, hex: string) {
  editor.chain().focus().setMark("textStyle", { color: hex }).run();
}

function clearTextStyleColor(editor: Editor) {
  editor
    .chain()
    .focus()
    .setMark("textStyle", { color: null })
    .removeEmptyTextStyle()
    .run();
}

function colorToHexForInput(raw: string | undefined): string {
  if (!raw?.trim()) return "#1c1917";
  const t = raw.trim();
  if (t.startsWith("#")) {
    if (t.length === 4) {
      return (
        "#" +
        [t[1], t[2], t[3]]
          .map((c) => c + c)
          .join("")
      );
    }
    return t.slice(0, 7);
  }
  const m = t.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (m) {
    const r = +m[1];
    const g = +m[2];
    const b = +m[3];
    return (
      "#" +
      [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("")
    );
  }
  return "#1c1917";
}

const FONT_OPTIONS: { label: string; value: string }[] = [
  { label: "Default", value: "" },
  { label: "Cormorant", value: "var(--font-cormorant), Georgia, serif" },
  { label: "Lora", value: "var(--font-lora), Georgia, serif" },
  { label: "Inter", value: "var(--font-inter), system-ui, sans-serif" },
  {
    label: "JetBrains Mono",
    value: "var(--font-jetbrains-mono), ui-monospace, monospace",
  },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "System UI", value: "system-ui, sans-serif" },
];

const FONT_SIZE_OPTIONS: { label: string; value: string }[] = [
  { label: "Default", value: "" },
  { label: "12px", value: "12px" },
  { label: "14px", value: "14px" },
  { label: "16px", value: "16px" },
  { label: "18px", value: "18px" },
  { label: "20px", value: "20px" },
  { label: "24px", value: "24px" },
];

/** Unitless multipliers; stored as inline line-height on the textStyle span. */
const LINE_SPACING_OPTIONS: { label: string; value: string }[] = [
  { label: "Default", value: "" },
  { label: "1.15", value: "1.15" },
  { label: "1.2", value: "1.2" },
  { label: "1.35", value: "1.35" },
  { label: "1.5", value: "1.5" },
  { label: "1.65", value: "1.65" },
  { label: "1.75", value: "1.75" },
  { label: "2", value: "2" },
];

const ToolbarButton = ({
  onClick,
  active,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "px-2 py-1 text-xs tracking-widest uppercase transition-colors",
      active
        ? "text-warm-accent"
        : "text-muted-foreground hover:text-foreground",
    )}
  >
    {children}
  </button>
);

type ToolbarChrome = "reading" | "admin";

function TiptapToolbar({
  editor,
  chrome,
}: {
  editor: Editor;
  chrome: ToolbarChrome;
}) {
  const state = useEditorState({
    editor,
    selector: ({ editor: ed }) => {
      const ts = ed.getAttributes("textStyle");
      return {
        fontFamily: (ts.fontFamily as string | undefined) ?? "",
        fontSize: (ts.fontSize as string | undefined) ?? "",
        lineHeight: (ts.lineHeight as string | undefined) ?? "",
        color: (ts.color as string | undefined) ?? "",
        bold: ed.isActive("bold"),
        italic: ed.isActive("italic"),
        strike: ed.isActive("strike"),
        underline: ed.isActive("underline"),
        h2: ed.isActive("heading", { level: 2 }),
        h3: ed.isActive("heading", { level: 3 }),
        bulletList: ed.isActive("bulletList"),
        orderedList: ed.isActive("orderedList"),
        blockquote: ed.isActive("blockquote"),
      };
    },
  });

  const { fontFamily, fontSize, lineHeight, color } = state;
  const hasExplicitColor = Boolean(color?.trim());
  const colorHex = colorToHexForInput(color);

  const selectClass = cn(
    "h-7 max-w-[9rem] rounded border px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring",
    chrome === "reading"
      ? "border-[var(--color-folio-border)] bg-[color-mix(in_srgb,var(--color-folio-paper)_92%,var(--color-stone-900))] text-[var(--color-stone-900)]"
      : "border-border bg-background text-muted-foreground",
  );

  const toolbarBg =
    chrome === "reading"
      ? "bg-[color-mix(in_srgb,var(--color-folio-paper)_96%,transparent)] backdrop-blur-sm"
      : "bg-background/95 backdrop-blur-sm";

  return (
    <div
      className={cn(
        "admin-tiptap-toolbar sticky z-40 flex flex-wrap items-center gap-1 border-b px-3 py-2 rounded-t-md",
        toolbarBg,
        chrome === "reading"
          ? "border-[var(--color-folio-border)]"
          : "border-border",
      )}
      style={{ top: "var(--site-header-height)" }}
    >
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={state.bold}
      >
        Bold
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={state.italic}
      >
        Italic
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        active={state.underline}
      >
        Underline
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        active={state.strike}
      >
        Strike
      </ToolbarButton>
      <span
        className={cn(
          "text-border",
          chrome === "reading" && "text-[var(--color-accent-border)]",
        )}
      >
        |
      </span>
      <label
        className={cn(
          "flex items-center gap-1.5 text-xs",
          chrome === "reading"
            ? "text-[var(--color-accent-muted)]"
            : "text-muted-foreground",
        )}
      >
        <span className="tracking-widest uppercase">Font</span>
        <select
          className={selectClass}
          value={fontFamily}
          onChange={(e) => {
            const v = e.target.value;
            const chain = editor.chain().focus();
            if (v === "") chain.unsetFontFamily().run();
            else chain.setFontFamily(v).run();
          }}
        >
          {FONT_OPTIONS.map((o) => (
            <option key={o.label} value={o.value}>
              {o.label}
            </option>
          ))}
          {fontFamily &&
            !FONT_OPTIONS.some((o) => o.value === fontFamily) && (
              <option value={fontFamily}>Current selection</option>
            )}
        </select>
      </label>
      <label
        className={cn(
          "flex items-center gap-1.5 text-xs",
          chrome === "reading"
            ? "text-[var(--color-accent-muted)]"
            : "text-muted-foreground",
        )}
      >
        <span className="tracking-widest uppercase">Size</span>
        <select
          className={cn(selectClass, "max-w-[5.5rem]")}
          value={fontSize}
          onChange={(e) => {
            const v = e.target.value;
            const chain = editor.chain().focus();
            if (v === "") chain.unsetFontSize().run();
            else chain.setFontSize(v).run();
          }}
        >
          {FONT_SIZE_OPTIONS.map((o) => (
            <option key={o.label} value={o.value}>
              {o.label}
            </option>
          ))}
          {fontSize &&
            !FONT_SIZE_OPTIONS.some((o) => o.value === fontSize) && (
              <option value={fontSize}>Current</option>
            )}
        </select>
      </label>
      <label
        className={cn(
          "flex items-center gap-1.5 text-xs",
          chrome === "reading"
            ? "text-[var(--color-accent-muted)]"
            : "text-muted-foreground",
        )}
      >
        <span className="tracking-widest uppercase">Spacing</span>
        <select
          className={cn(selectClass, "max-w-[5.5rem]")}
          value={lineHeight}
          onChange={(e) => {
            const v = e.target.value;
            const chain = editor.chain().focus();
            if (v === "") chain.unsetLineHeight().run();
            else chain.setLineHeight(v).run();
          }}
        >
          {LINE_SPACING_OPTIONS.map((o) => (
            <option key={o.label} value={o.value}>
              {o.label}
            </option>
          ))}
          {lineHeight &&
            !LINE_SPACING_OPTIONS.some((o) => o.value === lineHeight) && (
              <option value={lineHeight}>Current</option>
            )}
        </select>
      </label>
      <div
        className={cn(
          "flex items-center gap-1.5",
          chrome === "reading"
            ? "text-[var(--color-accent-muted)]"
            : "text-muted-foreground",
        )}
      >
        <span className="text-xs tracking-widest uppercase">Color</span>
        <input
          type="color"
          className={cn(
            "h-7 w-9 cursor-pointer rounded border p-0.5",
            chrome === "reading"
              ? "border-[var(--color-folio-border)] bg-transparent"
              : "border-border bg-transparent",
          )}
          value={colorHex}
          title={hasExplicitColor ? colorHex : "Default (reading theme)"}
          onChange={(e) => applyTextStyleColor(editor, e.target.value)}
        />
        <ToolbarButton
          onClick={() => clearTextStyleColor(editor)}
          active={!hasExplicitColor}
        >
          Default
        </ToolbarButton>
      </div>
      <span
        className={cn(
          "text-border",
          chrome === "reading" && "text-[var(--color-accent-border)]",
        )}
      >
        |
      </span>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        active={state.h2}
      >
        H2
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        active={state.h3}
      >
        H3
      </ToolbarButton>
      <span
        className={cn(
          "text-border",
          chrome === "reading" && "text-[var(--color-accent-border)]",
        )}
      >
        |
      </span>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={state.bulletList}
      >
        List
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={state.orderedList}
      >
        Ordered
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        active={state.blockquote}
      >
        Quote
      </ToolbarButton>
      <span
        className={cn(
          "text-border",
          chrome === "reading" && "text-[var(--color-accent-border)]",
        )}
      >
        |
      </span>
      <ToolbarButton
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
      >
        HR
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().undo().run()}>
        Undo
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().redo().run()}>
        Redo
      </ToolbarButton>
      <span
        className={cn(
          "text-border",
          chrome === "reading" && "text-[var(--color-accent-border)]",
        )}
      >
        |
      </span>
      <ToolbarButton
        onClick={() => {
          const ok = window.confirm(
            "Fix Spacing will replace every paragraph break with a soft line break (<br>) throughout the entire document. Undo may not restore the previous structure. Continue?",
          );
          if (!ok) return;
          const html = editor.getHTML();
          const fixed = fixParagraphSpacingToSoftBreaks(html);
          editor.commands.setContent(fixed);
        }}
      >
        Fix Spacing
      </ToolbarButton>
    </div>
  );
}

export function TiptapEditor({
  content,
  onChange,
  readingTheme = false,
}: TiptapEditorProps) {
  const extensions = useMemo(
    () => [
      StarterKit,
      TextStyleKit.configure({
        backgroundColor: false,
      }),
      Image,
    ],
    [],
  );

  const editor = useEditor(
    {
      immediatelyRender: false,
      extensions,
      content,
      onUpdate({ editor: ed }) {
        onChange(ed.getHTML());
      },
      editorProps: {
        attributes: {
          class: readingTheme
            ? "essay-body tiptap-editor-root min-h-[28rem] px-6 py-6 max-w-none text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]/30 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-folio-paper)] [&_img]:max-w-full [&_img]:h-auto"
            : "min-h-96 px-6 py-4 focus:outline-none prose prose-invert prose-sm max-w-none font-sans leading-relaxed",
        },
      },
    },
    [],
  );

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) return null;

  const chrome: ToolbarChrome = readingTheme ? "reading" : "admin";

  const shell = (
    <>
      <TiptapToolbar editor={editor} chrome={chrome} />
      <EditorContent
        editor={editor}
        className={cn(
          "rounded-b-md [&_.ProseMirror]:rounded-b-md",
          readingTheme && "[&_.ProseMirror]:min-h-[28rem]",
        )}
      />
    </>
  );

  if (readingTheme) {
    return (
      <div className="reading-theme w-full">
        <div
          className="journal-folio-paper admin-essay-editor-paper w-full max-w-none overflow-visible rounded-xl border"
          style={{ boxShadow: "var(--essay-folio-shadow)" }}
        >
          {shell}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-border bg-surface overflow-visible">
      {shell}
    </div>
  );
}
