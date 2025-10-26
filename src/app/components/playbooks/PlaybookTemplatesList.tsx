import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { PlaybookTemplate } from '../../services/playbookAutomation';
import { BookOpen, ArrowRight, Clock } from 'lucide-react';

interface PlaybookTemplatesListProps {
  templates: PlaybookTemplate[];
  onSelect: (templateId: string) => void;
}

const PlaybookTemplatesList: React.FC<PlaybookTemplatesListProps> = ({ templates, onSelect }) => {
  // Group templates by category
  const templatesByCategory = templates.reduce<Record<string, PlaybookTemplate[]>>(
    (acc, template) => {
      const category = template.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(template);
      return acc;
    },
    {}
  );

  // Format category name for display
  const formatCategoryName = (category: string): string => {
    return category
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="space-y-8">
      {Object.entries(templatesByCategory).map(([category, categoryTemplates]) => (
        <div key={category} className="space-y-4">
          <h2 className="text-xl font-semibold">{formatCategoryName(category)}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryTemplates.map(template => (
              <Card key={template.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <BookOpen className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <CardDescription>{template.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <div className="text-sm text-muted-foreground mb-2">
                    <Clock className="h-4 w-4 inline-block mr-1" />
                    {template.steps.length} steps
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {template.tags.map(tag => (
                      <Badge key={tag} variant="outline">{tag}</Badge>
                    ))}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    variant="default" 
                    className="w-full"
                    onClick={() => onSelect(template.id)}
                  >
                    View Template
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      ))}
      
      {templates.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No templates available</h3>
          <p className="text-muted-foreground">
            No playbook templates have been created yet.
          </p>
        </div>
      )}
    </div>
  );
};

export default PlaybookTemplatesList;
