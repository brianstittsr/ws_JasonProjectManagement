import React, { useState, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { PlusCircle } from 'lucide-react';
import Block, { BlockData, BlockType } from './Block';
import { Button } from '../ui/button';
import { BlockMenu } from './BlockMenu';

interface NotionEditorProps {
  initialBlocks?: BlockData[];
  onChange?: (blocks: BlockData[]) => void;
}

const NotionEditor: React.FC<NotionEditorProps> = ({ 
  initialBlocks = [], 
  onChange 
}) => {
  const [blocks, setBlocks] = useState<BlockData[]>(
    initialBlocks.length > 0 
      ? initialBlocks 
      : [{ id: uuidv4(), type: 'text', content: '' }]
  );
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [addMenuPosition, setAddMenuPosition] = useState({ x: 0, y: 0 });
  const editorRef = useRef<HTMLDivElement>(null);
  const blockRefs = useRef<Record<string, HTMLElement>>({});

  useEffect(() => {
    onChange?.(blocks);
  }, [blocks, onChange]);

  const updateBlock = (id: string, data: Partial<BlockData>) => {
    setBlocks(prevBlocks => 
      prevBlocks.map(block => 
        block.id === id ? { ...block, ...data } : block
      )
    );
  };

  const deleteBlock = (id: string) => {
    setBlocks(prevBlocks => {
      // Don't delete the last block
      if (prevBlocks.length <= 1) {
        return [{ id: uuidv4(), type: 'text', content: '' }];
      }
      return prevBlocks.filter(block => block.id !== id);
    });
  };

  const addBlockAfter = (id: string, type: BlockType) => {
    setBlocks(prevBlocks => {
      const index = prevBlocks.findIndex(block => block.id === id);
      if (index === -1) return prevBlocks;

      const newBlock = createNewBlock(type);
      
      return [
        ...prevBlocks.slice(0, index + 1),
        newBlock,
        ...prevBlocks.slice(index + 1)
      ];
    });

    // Focus the new block after render
    setTimeout(() => {
      const newBlockId = blocks[blocks.findIndex(block => block.id === id) + 1]?.id;
      if (newBlockId && blockRefs.current[newBlockId]) {
        const element = blockRefs.current[newBlockId].querySelector('textarea');
        element?.focus();
      }
    }, 0);
  };

  const createNewBlock = (type: BlockType): BlockData => {
    switch (type) {
      case 'text':
        return { id: uuidv4(), type, content: '' };
      case 'heading-1':
      case 'heading-2':
      case 'heading-3':
        return { id: uuidv4(), type, content: '' };
      case 'bulleted-list':
      case 'numbered-list':
        return { id: uuidv4(), type, content: '' };
      case 'todo':
        return { id: uuidv4(), type, content: { text: '', checked: false } };
      case 'image':
        return { id: uuidv4(), type, content: { src: '', alt: '', caption: '' } };
      case 'table':
        return { id: uuidv4(), type, content: { data: [['', ''], ['', '']] } };
      case 'code':
        return { id: uuidv4(), type, content: { code: '', language: 'javascript' } };
      case 'embed':
        return { id: uuidv4(), type, content: { url: '', type: 'website' } };
      default:
        return { id: uuidv4(), type: 'text', content: '' };
    }
  };

  const focusBlock = (id: string) => {
    if (blockRefs.current[id]) {
      const element = blockRefs.current[id].querySelector('textarea');
      element?.focus();
    }
  };

  const focusNextBlock = (id: string) => {
    const index = blocks.findIndex(block => block.id === id);
    if (index < blocks.length - 1) {
      focusBlock(blocks[index + 1].id);
    }
  };

  const focusPrevBlock = (id: string) => {
    const index = blocks.findIndex(block => block.id === id);
    if (index > 0) {
      focusBlock(blocks[index - 1].id);
    }
  };

  const moveBlock = (id: string, direction: 'up' | 'down') => {
    setBlocks(prevBlocks => {
      const index = prevBlocks.findIndex(block => block.id === id);
      if (index === -1) return prevBlocks;
      
      if (direction === 'up' && index === 0) return prevBlocks;
      if (direction === 'down' && index === prevBlocks.length - 1) return prevBlocks;
      
      const newBlocks = [...prevBlocks];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      
      // Swap blocks
      [newBlocks[index], newBlocks[targetIndex]] = [newBlocks[targetIndex], newBlocks[index]];
      
      return newBlocks;
    });
  };

  const handleAddButtonClick = (e: React.MouseEvent) => {
    const rect = editorRef.current?.getBoundingClientRect();
    if (rect) {
      setAddMenuPosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
      setShowAddMenu(true);
    }
  };

  const handleAddBlock = (type: BlockType) => {
    setBlocks(prevBlocks => [...prevBlocks, createNewBlock(type)]);
    setShowAddMenu(false);
  };

  return (
    <div 
      ref={editorRef}
      className="relative min-h-[200px] rounded-md border border-input bg-background p-4"
    >
      <div className="space-y-1">
        {blocks.map((block, index) => (
          <div
            key={block.id}
            ref={(el: HTMLDivElement | null) => {
              if (el) blockRefs.current[block.id] = el;
            }}
          >
            <Block
              block={block}
              updateBlock={updateBlock}
              deleteBlock={deleteBlock}
              addBlockAfter={addBlockAfter}
              focusNextBlock={focusNextBlock}
              focusPrevBlock={focusPrevBlock}
              moveBlock={moveBlock}
              isFirst={index === 0}
              isLast={index === blocks.length - 1}
            />
          </div>
        ))}
      </div>
      
      <div className="mt-4 flex justify-center">
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-1 text-muted-foreground"
          onClick={handleAddButtonClick}
        >
          <PlusCircle className="h-4 w-4" />
          <span>Add block</span>
        </Button>
      </div>
      
      {showAddMenu && (
        <div 
          className="absolute z-50"
          style={{ 
            left: `${addMenuPosition.x}px`, 
            top: `${addMenuPosition.y}px` 
          }}
        >
          <BlockMenu
            onClose={() => setShowAddMenu(false)}
            onChangeType={handleAddBlock}
            onDelete={() => {}}
            onMoveUp={() => {}}
            onMoveDown={() => {}}
            canMoveUp={false}
            canMoveDown={false}
          />
        </div>
      )}
    </div>
  );
};

export default NotionEditor;
