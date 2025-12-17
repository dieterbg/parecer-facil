"use client";

import { useEditor, EditorContent, Extension } from '@tiptap/react';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { useEffect } from 'react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { Button } from "@/components/ui/button";
import {
    Bold,
    Italic,
    Underline as UnderlineIcon,
    List,
    ListOrdered,
    Undo,
    Redo,
    Heading1,
    Heading2,
    AlignLeft,
    AlignCenter,
    AlignRight,
    AlignJustify
} from "lucide-react";

interface RichTextEditorProps {
    content: string;
    onChange: (content: string) => void;
    editable?: boolean;
}

const TabIndent = Extension.create({
    name: 'tabIndent',
    addProseMirrorPlugins() {
        return [
            new Plugin({
                key: new PluginKey('tab-indent'),
                props: {
                    handleKeyDown: (view, event) => {
                        if (event.key === 'Tab' && !event.shiftKey) {
                            if (this.editor.isActive('listItem')) {
                                return false;
                            }
                            event.preventDefault();
                            this.editor.commands.insertContent('\u00A0\u00A0\u00A0\u00A0');
                            return true;
                        }
                        return false;
                    }
                }
            })
        ];
    },
});

export function RichTextEditor({ content, onChange, editable = true }: RichTextEditorProps) {
    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit,
            Underline,
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
            Placeholder.configure({
                placeholder: 'Comece a escrever ou aguarde o texto da IA...',
            }),
            TabIndent,
        ],
        content: content,
        editable: editable,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'prose prose-zinc max-w-none focus:outline-none min-h-[500px] p-8 text-black leading-relaxed',
            },
        },
    });

    // Update editor content if prop changes
    useEffect(() => {
        if (editor && content !== editor.getHTML()) {
            if (editor.getText() === '' && content) {
                editor.commands.setContent(content);
            }
        }
    }, [content, editor]);

    if (!editor) {
        return null;
    }

    return (
        <div className="border rounded-md overflow-hidden shadow-sm bg-white text-black">
            {editable && (
                <div className="flex flex-wrap items-center gap-1 p-2 border-b bg-gray-50 text-gray-700 sticky top-0 z-10">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        disabled={!editor.can().chain().focus().toggleBold().run()}
                        className={editor.isActive('bold') ? 'bg-gray-200' : 'hover:bg-gray-200'}
                    >
                        <Bold className="w-4 h-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                        disabled={!editor.can().chain().focus().toggleItalic().run()}
                        className={editor.isActive('italic') ? 'bg-gray-200' : 'hover:bg-gray-200'}
                    >
                        <Italic className="w-4 h-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => editor.chain().focus().toggleUnderline().run()}
                        disabled={!editor.can().chain().focus().toggleUnderline().run()}
                        className={editor.isActive('underline') ? 'bg-gray-200' : 'hover:bg-gray-200'}
                    >
                        <UnderlineIcon className="w-4 h-4" />
                    </Button>

                    <div className="w-px h-6 bg-gray-300 mx-1" />

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => editor.chain().focus().setTextAlign('left').run()}
                        className={editor.isActive({ textAlign: 'left' }) ? 'bg-gray-200' : 'hover:bg-gray-200'}
                    >
                        <AlignLeft className="w-4 h-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => editor.chain().focus().setTextAlign('center').run()}
                        className={editor.isActive({ textAlign: 'center' }) ? 'bg-gray-200' : 'hover:bg-gray-200'}
                    >
                        <AlignCenter className="w-4 h-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => editor.chain().focus().setTextAlign('right').run()}
                        className={editor.isActive({ textAlign: 'right' }) ? 'bg-gray-200' : 'hover:bg-gray-200'}
                    >
                        <AlignRight className="w-4 h-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => editor.chain().focus().setTextAlign('justify').run()}
                        className={editor.isActive({ textAlign: 'justify' }) ? 'bg-gray-200' : 'hover:bg-gray-200'}
                    >
                        <AlignJustify className="w-4 h-4" />
                    </Button>

                    <div className="w-px h-6 bg-gray-300 mx-1" />

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                        className={editor.isActive('heading', { level: 1 }) ? 'bg-gray-200' : 'hover:bg-gray-200'}
                    >
                        <Heading1 className="w-4 h-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                        className={editor.isActive('heading', { level: 2 }) ? 'bg-gray-200' : 'hover:bg-gray-200'}
                    >
                        <Heading2 className="w-4 h-4" />
                    </Button>

                    <div className="w-px h-6 bg-gray-300 mx-1" />

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                        className={editor.isActive('bulletList') ? 'bg-gray-200' : 'hover:bg-gray-200'}
                    >
                        <List className="w-4 h-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => editor.chain().focus().toggleOrderedList().run()}
                        className={editor.isActive('orderedList') ? 'bg-gray-200' : 'hover:bg-gray-200'}
                    >
                        <ListOrdered className="w-4 h-4" />
                    </Button>

                    <div className="w-px h-6 bg-gray-300 mx-1" />

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => editor.chain().focus().undo().run()}
                        disabled={!editor.can().chain().focus().undo().run()}
                        className="hover:bg-gray-200"
                    >
                        <Undo className="w-4 h-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => editor.chain().focus().redo().run()}
                        disabled={!editor.can().chain().focus().redo().run()}
                        className="hover:bg-gray-200"
                    >
                        <Redo className="w-4 h-4" />
                    </Button>
                </div>
            )}
            <div className="bg-white">
                <EditorContent editor={editor} />
            </div>
        </div>
    );
}
