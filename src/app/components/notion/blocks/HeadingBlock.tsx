import React, { useRef, useEffect } from 'react';
import { cn } from '../../../lib/utils';

interface HeadingBlockProps {
  level: 1 | 2 | 3;
  content: string;
  onChange: (content: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}

const HeadingBlock: React.FC<HeadingBlockProps> = ({ level, content, onChange, onKeyDown }) => {
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
      className={cn(
        "w-full resize-none overflow-hidden bg-transparent outline-none placeholder:text-muted-foreground font-bold",
        level === 1 && "text-3xl",
        level === 2 && "text-2xl",
        level === 3 && "text-xl"
      )}
      placeholder={`Heading ${level}`}
      value={content}
      onChange={handleChange}
      onKeyDown={onKeyDown}
      rows={1}
    />
  );
};

export default HeadingBlock;
