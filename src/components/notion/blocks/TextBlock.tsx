import React, { useRef, useEffect } from 'react';

interface TextBlockProps {
  content: string;
  onChange: (content: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}

const TextBlock: React.FC<TextBlockProps> = ({ content, onChange, onKeyDown }) => {
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
    <textarea
      ref={textareaRef}
      className="w-full resize-none overflow-hidden bg-transparent text-base outline-none placeholder:text-muted-foreground"
      placeholder="Type '/' for commands"
      value={content}
      onChange={handleChange}
      onKeyDown={onKeyDown}
      rows={1}
    />
  );
};

export default TextBlock;
