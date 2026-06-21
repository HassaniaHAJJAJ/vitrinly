"use client";

import { useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

export function DescriptionField({ defaultValue }: { defaultValue?: string }) {
  const [html, setHtml] = useState(defaultValue ?? "");

  const editor = useEditor({
    extensions: [StarterKit],
    content: defaultValue ?? "",
    immediatelyRender: false,
    onUpdate: ({ editor }) => setHtml(editor.getHTML()),
    editorProps: {
      attributes: {
        class:
          "min-h-[120px] rounded-b border border-t-0 px-3 py-2 focus:outline-none [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5",
      },
    },
  });

  return (
    <div className="flex flex-col gap-1">
      <label className="text-base font-semibold">Description</label>

      {editor && (
        <div className="flex flex-wrap gap-1 rounded-t border border-b-0 bg-gray-50 p-1">
          <ToolbarButton
            label="Gras"
            active={editor.isActive("bold")}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <strong>G</strong>
          </ToolbarButton>
          <ToolbarButton
            label="Italique"
            active={editor.isActive("italic")}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <em>I</em>
          </ToolbarButton>
          <ToolbarButton
            label="Liste à puces"
            active={editor.isActive("bulletList")}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            •••
          </ToolbarButton>
          <ToolbarButton
            label="Liste numérotée"
            active={editor.isActive("orderedList")}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            1.2.
          </ToolbarButton>
        </div>
      )}

      <EditorContent editor={editor} />

      <input type="hidden" name="description" value={html} />
    </div>
  );
}

function ToolbarButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      onClick={onClick}
      className={`rounded px-2 py-1 text-xs ${
        active ? "bg-gray-300" : "hover:bg-gray-200"
      }`}
    >
      {children}
    </button>
  );
}
