"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { useEffect } from "react";

interface TiptapEditorProps {
  content: string;
  onChange: (html: string) => void;
}

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
    className={`px-2 py-1 text-xs tracking-widest uppercase transition-colors ${
      active
        ? "text-warm-accent"
        : "text-muted-foreground hover:text-foreground"
    }`}
  >
    {children}
  </button>
);

export function TiptapEditor({ content, onChange }: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit, Image],
    content,
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "min-h-96 px-6 py-4 focus:outline-none prose prose-invert prose-sm max-w-none font-sans leading-relaxed",
      },
    },
  });

  // Sync external content changes (e.g. when navigating between posts)
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) return null;

  return (
    <div className="border border-border rounded-md overflow-hidden bg-surface">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 border-b border-border px-3 py-2 bg-background">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
        >
          Bold
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
        >
          Italic
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive("strike")}
        >
          Strike
        </ToolbarButton>
        <span className="text-border">|</span>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive("heading", { level: 2 })}
        >
          H2
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive("heading", { level: 3 })}
        >
          H3
        </ToolbarButton>
        <span className="text-border">|</span>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
        >
          List
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")}
        >
          Ordered
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive("blockquote")}
        >
          Quote
        </ToolbarButton>
        <span className="text-border">|</span>
        <ToolbarButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        >
          HR
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
        >
          Undo
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
        >
          Redo
        </ToolbarButton>
      </div>

      {/* Editor body */}
      <EditorContent editor={editor} />
    </div>
  );
}
