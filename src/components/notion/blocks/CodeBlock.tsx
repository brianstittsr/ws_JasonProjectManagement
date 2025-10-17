import React, { useRef, useEffect } from 'react';
import { Select } from '../../ui/select';

interface CodeBlockProps {
  code: string;
  language: string;
  onChange: (content: { code: string; language: string }) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ code, language, onChange, onKeyDown }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      // Auto-resize the textarea
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [code]);

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange({ code: e.target.value, language });
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ code, language: e.target.value });
  };

  const languages = [
    'javascript',
    'typescript',
    'python',
    'java',
    'c',
    'cpp',
    'csharp',
    'go',
    'rust',
    'ruby',
    'php',
    'html',
    'css',
    'json',
    'yaml',
    'markdown',
    'sql',
    'bash',
    'plaintext',
  ];

  return (
    <div className="rounded-md border border-border bg-muted overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5 bg-muted border-b border-border">
        <select
          value={language}
          onChange={handleLanguageChange}
          className="text-xs bg-transparent border-none outline-none"
        >
          {languages.map((lang) => (
            <option key={lang} value={lang}>
              {lang}
            </option>
          ))}
        </select>
      </div>
      <div className="p-3">
        <textarea
          ref={textareaRef}
          value={code}
          onChange={handleCodeChange}
          onKeyDown={onKeyDown}
          className="w-full resize-none overflow-hidden bg-transparent font-mono text-sm outline-none"
          placeholder="Enter code..."
          rows={1}
        />
      </div>
    </div>
  );
};

export default CodeBlock;
