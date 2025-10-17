import React, { useState } from 'react';
import { Upload, X } from 'lucide-react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';

interface ImageBlockProps {
  src: string;
  alt: string;
  caption: string;
  onChange: (content: { src: string; alt: string; caption: string }) => void;
}

const ImageBlock: React.FC<ImageBlockProps> = ({ src, alt, caption, onChange }) => {
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = () => {
    // In a real implementation, this would open a file picker
    // and upload the image to a storage service
    setIsUploading(true);
    setTimeout(() => {
      setIsUploading(false);
      onChange({
        src: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c',
        alt: 'Code on a laptop screen',
        caption: 'Sample image'
      });
    }, 1500);
  };

  const handleCaptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ src, alt, caption: e.target.value });
  };

  const handleRemove = () => {
    onChange({ src: '', alt: '', caption: '' });
  };

  if (!src) {
    return (
      <div className="flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-md p-8 text-center">
        <Upload className="h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground mb-2">
          Upload an image or paste an image URL
        </p>
        <Button 
          variant="outline" 
          onClick={handleUpload}
          disabled={isUploading}
        >
          {isUploading ? 'Uploading...' : 'Upload'}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <img
          src={src}
          alt={alt}
          className="rounded-md max-h-96 w-auto"
        />
        <Button
          variant="destructive"
          size="icon"
          className="absolute top-2 right-2 h-6 w-6 rounded-full"
          onClick={handleRemove}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      <Input
        placeholder="Add a caption..."
        value={caption}
        onChange={handleCaptionChange}
        className="bg-transparent border-none text-sm text-muted-foreground"
      />
    </div>
  );
};

export default ImageBlock;
