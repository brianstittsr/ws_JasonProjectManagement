import React, { useState, useRef, useEffect } from 'react';
import { PlusCircle, MoreHorizontal, Trash2, GripVertical } from 'lucide-react';
import { Button } from '../ui/button';
import { BlockMenu } from './BlockMenu';
import TextBlock from './blocks/TextBlock';
import HeadingBlock from './blocks/HeadingBlock';
import ListBlock from './blocks/ListBlock';
import TodoBlock from './blocks/TodoBlock';
import ImageBlock from './blocks/ImageBlock';
import TableBlock from './blocks/TableBlock';
import CodeBlock from './blocks/CodeBlock';
import EmbedBlock from './blocks/EmbedBlock';
import { cn } from '../../lib/utils';

export type BlockType = 
  | 'text' 
  | 'heading-1' 
  | 'heading-2' 
  | 'heading-3' 
  | 'bulleted-list' 
  | 'numbered-list' 
  | 'todo' 
  | 'image' 
  | 'table' 
  | 'code' 
  | 'embed';

export interface BlockData {
  id: string;
  type: BlockType;
  content: any;
  children?: BlockData[];
}

interface BlockProps {
  block: BlockData;
  updateBlock: (id: string, data: Partial<BlockData>) => void;
  deleteBlock: (id: string) => void;
  addBlockAfter: (id: string, type: BlockType) => void;
  focusNextBlock: (id: string) => void;
  focusPrevBlock: (id: string) => void;
  moveBlock: (id: string, direction: 'up' | 'down') => void;
  isFirst: boolean;
  isLast: boolean;
  level?: number;
}

const Block: React.FC<BlockProps> = ({
  block,
  updateBlock,
  deleteBlock,
  addBlockAfter,
  focusNextBlock,
  focusPrevBlock,
  moveBlock,
  isFirst,
  isLast,
  level = 0,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showAddButton, setShowAddButton] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const blockRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      addBlockAfter(block.id, 'text');
    } else if (e.key === 'Backspace' && isContentEmpty()) {
      e.preventDefault();
      deleteBlock(block.id);
      focusPrevBlock(block.id);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      focusPrevBlock(block.id);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      focusNextBlock(block.id);
    }
  };

  const isContentEmpty = () => {
    if (typeof block.content === 'string') {
      return block.content.trim() === '';
    }
    return false;
  };

  const renderBlockContent = () => {
    switch (block.type) {
      case 'text':
        return (
          <TextBlock
            content={block.content}
            onChange={(content) => updateBlock(block.id, { content })}
            onKeyDown={handleKeyDown}
          />
        );
      case 'heading-1':
      case 'heading-2':
      case 'heading-3':
        return (
          <HeadingBlock
            level={block.type === 'heading-1' ? 1 : block.type === 'heading-2' ? 2 : 3}
            content={block.content}
            onChange={(content) => updateBlock(block.id, { content })}
            onKeyDown={handleKeyDown}
          />
        );
      case 'bulleted-list':
      case 'numbered-list':
        return (
          <ListBlock
            type={block.type === 'bulleted-list' ? 'bullet' : 'number'}
            content={block.content}
            onChange={(content) => updateBlock(block.id, { content })}
            onKeyDown={handleKeyDown}
          />
        );
      case 'todo':
        return (
          <TodoBlock
            content={block.content}
            checked={block.content.checked}
            onChange={(content) => updateBlock(block.id, { content })}
            onToggle={(checked) => 
              updateBlock(block.id, { content: { ...block.content, checked } })
            }
            onKeyDown={handleKeyDown}
          />
        );
      case 'image':
        return (
          <ImageBlock
            src={block.content.src}
            alt={block.content.alt}
            caption={block.content.caption}
            onChange={(content) => updateBlock(block.id, { content })}
          />
        );
      case 'table':
        return (
          <TableBlock
            data={block.content.data}
            onChange={(data) => 
              updateBlock(block.id, { content: { ...block.content, data } })
            }
          />
        );
      case 'code':
        return (
          <CodeBlock
            code={block.content.code}
            language={block.content.language}
            onChange={(content) => updateBlock(block.id, { content })}
            onKeyDown={handleKeyDown}
          />
        );
      case 'embed':
        return (
          <EmbedBlock
            url={block.content.url}
            type={block.content.type}
            onChange={(content) => updateBlock(block.id, { content })}
          />
        );
      default:
        return <div>Unsupported block type</div>;
    }
  };

  return (
    <div
      ref={blockRef}
      className={cn(
        "group relative flex items-start gap-2 py-1 px-2 rounded-md transition-colors",
        showMenu || showAddButton || isDragging ? "bg-accent/50" : "hover:bg-accent/30",
        level > 0 && "ml-6"
      )}
      onMouseEnter={() => setShowAddButton(true)}
      onMouseLeave={() => setShowAddButton(false)}
    >
      <div className="absolute left-0 top-1/2 -translate-x-full -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 rounded-full"
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
        >
          <GripVertical className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="flex-1">
        {renderBlockContent()}
        
        {block.children && block.children.length > 0 && (
          <div className="mt-2">
            {block.children.map((child, index) => (
              <Block
                key={child.id}
                block={child}
                updateBlock={updateBlock}
                deleteBlock={deleteBlock}
                addBlockAfter={addBlockAfter}
                focusNextBlock={focusNextBlock}
                focusPrevBlock={focusPrevBlock}
                moveBlock={moveBlock}
                isFirst={index === 0}
                isLast={index === (block.children?.length || 0) - 1}
                level={level + 1}
              />
            ))}
          </div>
        )}
      </div>
      
      <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
        {showAddButton && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 rounded-full"
            onClick={() => addBlockAfter(block.id, 'text')}
          >
            <PlusCircle className="h-4 w-4" />
          </Button>
        )}
        
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 rounded-full"
          onClick={() => setShowMenu(!showMenu)}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
        
        {showMenu && (
          <BlockMenu
            onClose={() => setShowMenu(false)}
            onChangeType={(type) => {
              updateBlock(block.id, { type });
              setShowMenu(false);
            }}
            onDelete={() => {
              deleteBlock(block.id);
              setShowMenu(false);
            }}
            onMoveUp={() => {
              moveBlock(block.id, 'up');
              setShowMenu(false);
            }}
            onMoveDown={() => {
              moveBlock(block.id, 'down');
              setShowMenu(false);
            }}
            canMoveUp={!isFirst}
            canMoveDown={!isLast}
          />
        )}
      </div>
    </div>
  );
};

export default Block;
