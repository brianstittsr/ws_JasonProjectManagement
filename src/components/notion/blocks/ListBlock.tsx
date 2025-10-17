import React, { useRef, useEffect } from 'react';

interface ListBlockProps {
  type: 'bullet' | 'number';
  content: string;
  onChange: (content: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}

const ListBlock: React.FC<ListBlockProps> = ({ type, content, onChange, onKeyDown }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      // Auto-resize the textarea
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [content]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className="flex items-start gap-2">
      <div className="mt-1.5">
        {type === 'bullet' ? (
          <div className="h-1.5 w-1.5 rounded-full bg-foreground mt-1.5" />
        ) : (
          <span className="text-sm">1.</span>
        )}
      </div>
      <textarea
        ref={textareaRef}
        className="w-full resize-none overflow-hidden bg-transparent text-base outline-none placeholder:text-muted-foreground"
        placeholder="List item"
        value={content}
        onChange={handleChange}
        onKeyDown={onKeyDown}
        rows={1}
      />
    </div>
  );
};

export default ListBlock;
