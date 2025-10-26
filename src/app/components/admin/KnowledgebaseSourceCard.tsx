import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Globe, FileText, Database, ToggleLeft, ToggleRight } from 'lucide-react';

export type KnowledgeSourceType = 'url' | 'document' | 'database';

export interface KnowledgeSource {
  id: string;
  name: string;
  description: string;
  type: KnowledgeSourceType;
  url?: string;
  filePath?: string;
  connectionString?: string;
  isActive: boolean;
  lastSynced?: Date;
}

interface KnowledgebaseSourceCardProps {
  source: KnowledgeSource;
  onEdit: (sourceId: string) => void;
  onToggleActive: (sourceId: string, active: boolean) => void;
  onDelete: (sourceId: string) => void;
}

const KnowledgebaseSourceCard: React.FC<KnowledgebaseSourceCardProps> = ({
  source,
  onEdit,
  onToggleActive,
  onDelete,
}) => {
  const getSourceIcon = () => {
    switch (source.type) {
      case 'url':
        return <Globe className="h-5 w-5" />;
      case 'document':
        return <FileText className="h-5 w-5" />;
      case 'database':
        return <Database className="h-5 w-5" />;
      default:
        return <Globe className="h-5 w-5" />;
    }
  };

  const getSourceTypeLabel = () => {
    switch (source.type) {
      case 'url':
        return 'Web URL';
      case 'document':
        return 'Document';
      case 'database':
        return 'Database';
      default:
        return 'Unknown';
    }
  };

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={`rounded-full p-2 ${
              source.type === 'url' 
                ? 'bg-blue-100 text-blue-600' 
                : source.type === 'document' 
                  ? 'bg-green-100 text-green-600' 
                  : 'bg-purple-100 text-purple-600'
            }`}>
              {getSourceIcon()}
            </div>
            <CardTitle>{source.name}</CardTitle>
          </div>
          <Badge variant={source.isActive ? "default" : "outline"}>
            {source.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>
        <CardDescription>{source.description}</CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Type:</span>
            <span>{getSourceTypeLabel()}</span>
          </div>
          
          {source.url && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">URL:</span>
              <span className="truncate max-w-[200px]">{source.url}</span>
            </div>
          )}
          
          {source.filePath && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">File:</span>
              <span className="truncate max-w-[200px]">{source.filePath}</span>
            </div>
          )}
          
          {source.lastSynced && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Last Synced:</span>
              <span>{source.lastSynced.toLocaleDateString()}</span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onEdit(source.id)}
          >
            Edit
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => onDelete(source.id)}
          >
            Delete
          </Button>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className={source.isActive ? "text-green-600" : "text-muted-foreground"}
          onClick={() => onToggleActive(source.id, !source.isActive)}
        >
          {source.isActive ? (
            <ToggleRight className="h-5 w-5 mr-1" />
          ) : (
            <ToggleLeft className="h-5 w-5 mr-1" />
          )}
          {source.isActive ? 'Active' : 'Inactive'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default KnowledgebaseSourceCard;
