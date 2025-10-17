import React, { useRef, useEffect } from 'react';
import { Checkbox } from '../../ui/checkbox';

interface TodoBlockProps {
  content: { text: string; checked: boolean };
  checked: boolean;
  onChange: (content: { text: string; checked: boolean }) => void;
  onToggle: (checked: boolean) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}

const TodoBlock: React.FC<TodoBlockProps> = ({ 
  content, 
  checked, 
  onChange, 
  onToggle, 
  onKeyDown 
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      // Auto-resize the textarea
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [content.text]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange({ ...content, text: e.target.value });
  };

  const handleCheckboxChange = (checked: boolean) => {
    onToggle(checked);
  };

  return (
    <div className="flex items-start gap-2">
      <Checkbox 
        checked={checked} 
        onCheckedChange={handleCheckboxChange} 
        className="mt-1.5"
      />
      <textarea
        ref={textareaRef}
        className={`w-full resize-none overflow-hidden bg-transparent text-base outline-none placeholder:text-muted-foreground ${
          checked ? 'line-through text-muted-foreground' : ''
        }`}
        placeholder="To-do"
        value={content.text}
        onChange={handleChange}
        onKeyDown={onKeyDown}
        rows={1}
      />
    </div>
  );
};

export default TodoBlock;
