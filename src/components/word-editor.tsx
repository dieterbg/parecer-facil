"use client";

import { Editor } from '@tinymce/tinymce-react';
import { useTheme } from 'next-themes';

interface WordEditorProps {
    content: string;
    onChange: (content: string) => void;
    editable?: boolean;
}

export function WordEditor({ content, onChange, editable = true }: WordEditorProps) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <div className="border rounded-md overflow-hidden shadow-sm">
            <Editor
                licenseKey='gpl'
                tinymceScriptSrc="https://cdnjs.cloudflare.com/ajax/libs/tinymce/7.6.0/tinymce.min.js"
                value={content}
                onEditorChange={(newValue) => onChange(newValue)}
                disabled={!editable}
                init={{
                    height: 600,
                    menubar: true,
                    plugins: [
                        'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                        'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                        'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
                    ],
                    toolbar: 'undo redo | blocks | ' +
                        'bold italic forecolor | alignleft aligncenter ' +
                        'alignright alignjustify | bullist numlist outdent indent | ' +
                        'removeformat | help',
                    content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
                    skin: isDark ? "oxide-dark" : "oxide",
                    content_css: isDark ? "dark" : "default",
                    branding: false, // Tenta esconder a marca TinyMCE
                    promotion: false, // Tenta esconder o botão de upgrade
                }}
            />
        </div>
    );
}
