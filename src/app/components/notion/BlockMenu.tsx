import React, { useRef, useEffect } from 'react';
import { 
  Type, 
  Heading1, 
  Heading2, 
  Heading3, 
  List, 
  ListOrdered, 
  CheckSquare, 
  Image, 
  Table, 
  Code, 
  Link, 
  Trash2,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { BlockType } from './Block';

interface BlockMenuProps {
  onClose: () => void;
  onChangeType: (type: BlockType) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

export const BlockMenu: React.FC<BlockMenuProps> = ({
  onClose,
  onChangeType,
  onDelete,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const menuItems = [
    { type: 'text', label: 'Text', icon: <Type size={16} /> },
    { type: 'heading-1', label: 'Heading 1', icon: <Heading1 size={16} /> },
    { type: 'heading-2', label: 'Heading 2', icon: <Heading2 size={16} /> },
    { type: 'heading-3', label: 'Heading 3', icon: <Heading3 size={16} /> },
    { type: 'bulleted-list', label: 'Bullet List', icon: <List size={16} /> },
    { type: 'numbered-list', label: 'Numbered List', icon: <ListOrdered size={16} /> },
    { type: 'todo', label: 'To-do List', icon: <CheckSquare size={16} /> },
    { type: 'image', label: 'Image', icon: <Image size={16} /> },
    { type: 'table', label: 'Table', icon: <Table size={16} /> },
    { type: 'code', label: 'Code', icon: <Code size={16} /> },
    { type: 'embed', label: 'Embed', icon: <Link size={16} /> },
  ];

  return (
    <div 
      ref={menuRef}
      className="absolute right-0 top-full mt-1 z-50 w-48 rounded-md bg-popover shadow-md border border-border"
    >
      <div className="py-1 px-1">
        <div className="text-xs font-medium text-muted-foreground px-2 py-1.5">
          Turn into
        </div>
        {menuItems.map((item) => (
          <button
            key={item.type}
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
            onClick={() => onChangeType(item.type as BlockType)}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </div>
      
      <div className="border-t border-border py-1 px-1">
        {canMoveUp && (
          <button
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
            onClick={onMoveUp}
          >
            <ArrowUp size={16} />
            <span>Move up</span>
          </button>
        )}
        
        {canMoveDown && (
          <button
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
            onClick={onMoveDown}
          >
            <ArrowDown size={16} />
            <span>Move down</span>
          </button>
        )}
        
        <button
          className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive hover:bg-destructive/10"
          onClick={onDelete}
        >
          <Trash2 size={16} />
          <span>Delete</span>
        </button>
      </div>
    </div>
  );
};
