import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

export interface TemplateCategory {
  id: string;
  name: string;
  color?: string;
}

export interface Template {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  categories: string[];
  popularity: number;
  isNew: boolean;
  isFeatured: boolean;
}

interface TemplateCardProps {
  template: Template;
  categories: TemplateCategory[];
  onUse: (templateId: string) => void;
  onPreview: (templateId: string) => void;
}

const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  categories,
  onUse,
  onPreview,
}) => {
  const getCategoryColor = (categoryId: string): string => {
    const category = categories.find(c => c.id === categoryId);
    return category?.color || 'bg-primary';
  };

  const getCategoryName = (categoryId: string): string => {
    const category = categories.find(c => c.id === categoryId);
    return category?.name || categoryId;
  };

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <div className="relative">
        <img 
          src={template.thumbnail} 
          alt={template.title}
          className="w-full h-40 object-cover"
        />
        <div className="absolute top-2 right-2 flex gap-2">
          {template.isNew && (
            <Badge variant="default" className="bg-blue-500">New</Badge>
          )}
          {template.isFeatured && (
            <Badge variant="default" className="bg-yellow-500">Featured</Badge>
          )}
        </div>
      </div>
      
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{template.title}</CardTitle>
        <CardDescription>{template.description}</CardDescription>
      </CardHeader>
      
      <CardContent className="pb-2">
        <div className="flex flex-wrap gap-1">
          {template.categories.map(categoryId => (
            <Badge 
              key={categoryId} 
              variant="outline" 
              className={`${getCategoryColor(categoryId)} text-xs`}
            >
              {getCategoryName(categoryId)}
            </Badge>
          ))}
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => onPreview(template.id)}
        >
          Preview
        </Button>
        <Button 
          size="sm"
          onClick={() => onUse(template.id)}
        >
          Use Template
        </Button>
      </CardFooter>
    </Card>
  );
};

export default TemplateCard;
