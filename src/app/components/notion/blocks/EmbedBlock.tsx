import React, { useState } from 'react';
import { Input } from '../../ui/input';
import { Button } from '../../ui/button';
import { Link } from 'lucide-react';

interface EmbedBlockProps {
  url: string;
  type: string;
  onChange: (content: { url: string; type: string }) => void;
}

const EmbedBlock: React.FC<EmbedBlockProps> = ({ url, type, onChange }) => {
  const [inputUrl, setInputUrl] = useState(url);
  const [isEditing, setIsEditing] = useState(!url);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Detect embed type based on URL
    let embedType = 'website';
    if (inputUrl.includes('youtube.com') || inputUrl.includes('youtu.be')) {
      embedType = 'youtube';
    } else if (inputUrl.includes('figma.com')) {
      embedType = 'figma';
    } else if (inputUrl.includes('twitter.com') || inputUrl.includes('x.com')) {
      embedType = 'twitter';
    }
    
    onChange({ url: inputUrl, type: embedType });
    setIsEditing(false);
  };

  const renderEmbed = () => {
    switch (type) {
      case 'youtube':
        return (
          <div className="aspect-video">
            <iframe
              src={url.replace('watch?v=', 'embed/')}
              className="w-full h-full rounded-md"
              title="YouTube embed"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        );
      case 'figma':
        return (
          <div className="aspect-video">
            <iframe
              src={`${url}?embed`}
              className="w-full h-full rounded-md"
              title="Figma embed"
              frameBorder="0"
              allowFullScreen
            />
          </div>
        );
      default:
        return (
          <div className="border border-border rounded-md p-4">
            <div className="flex items-center gap-2 text-sm">
              <Link className="h-4 w-4" />
              <a href={url} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                {url}
              </a>
            </div>
          </div>
        );
    }
  };

  if (isEditing) {
    return (
      <form onSubmit={handleSubmit} className="space-y-2">
        <Input
          type="text"
          placeholder="Paste a link to embed content..."
          value={inputUrl}
          onChange={(e) => setInputUrl(e.target.value)}
          className="w-full"
        />
        <div className="flex gap-2">
          <Button type="submit" disabled={!inputUrl}>
            Embed
          </Button>
          {url && (
            <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
          )}
        </div>
      </form>
    );
  }

  return (
    <div>
      {renderEmbed()}
      <Button
        variant="ghost"
        size="sm"
        className="mt-2 text-xs"
        onClick={() => setIsEditing(true)}
      >
        Edit embed
      </Button>
    </div>
  );
};

export default EmbedBlock;
