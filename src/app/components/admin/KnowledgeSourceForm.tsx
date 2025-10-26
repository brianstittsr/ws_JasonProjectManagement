import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Select } from '../ui/select';
import { KnowledgeSource, KnowledgeSourceType } from './KnowledgebaseSourceCard';
import { Upload, X } from 'lucide-react';

interface KnowledgeSourceFormProps {
  source?: KnowledgeSource;
  onSave: (source: KnowledgeSource) => void;
  onCancel: () => void;
}

const KnowledgeSourceForm: React.FC<KnowledgeSourceFormProps> = ({
  source,
  onSave,
  onCancel,
}) => {
  const [formData, setFormData] = useState<Partial<KnowledgeSource>>(
    source || {
      id: '',
      name: '',
      description: '',
      type: 'url' as KnowledgeSourceType,
      isActive: true,
    }
  );
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const isEditMode = !!source;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const type = e.target.value as KnowledgeSourceType;
    setFormData((prev) => ({ 
      ...prev, 
      type,
      // Clear fields that don't apply to the new type
      url: type === 'url' ? prev.url : undefined,
      filePath: type === 'document' ? prev.filePath : undefined,
      connectionString: type === 'database' ? prev.connectionString : undefined,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setFormData((prev) => ({ 
        ...prev, 
        filePath: e.target.files ? e.target.files[0].name : undefined 
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // In a real app, you would upload the file here if type is 'document'
    if (formData.type === 'document' && file) {
      setIsUploading(true);
      
      // Simulate file upload
      setTimeout(() => {
        setIsUploading(false);
        
        // Generate a unique ID if this is a new source
        const id = formData.id || `source-${Date.now()}`;
        
        onSave({
          ...formData,
          id,
          lastSynced: new Date(),
        } as KnowledgeSource);
      }, 1000);
    } else {
      // Generate a unique ID if this is a new source
      const id = formData.id || `source-${Date.now()}`;
      
      onSave({
        ...formData,
        id,
        lastSynced: new Date(),
      } as KnowledgeSource);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditMode ? 'Edit Knowledge Source' : 'Add Knowledge Source'}</CardTitle>
        <CardDescription>
          {isEditMode 
            ? 'Update the details of this knowledge source' 
            : 'Add a new source of knowledge for the AI assistant'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              value={formData.name || ''}
              onChange={handleChange}
              placeholder="Enter a name for this knowledge source"
              required
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description || ''}
              onChange={handleChange}
              placeholder="Describe what kind of information this source contains"
              rows={3}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="type">Source Type</Label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleTypeChange}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              required
            >
              <option value="url">Web URL</option>
              <option value="document">Document</option>
              <option value="database">Database</option>
            </select>
          </div>
          
          {formData.type === 'url' && (
            <div className="grid gap-2">
              <Label htmlFor="url">URL</Label>
              <Input
                id="url"
                name="url"
                type="url"
                value={formData.url || ''}
                onChange={handleChange}
                placeholder="https://example.com/documentation"
                required={formData.type === 'url'}
              />
            </div>
          )}
          
          {formData.type === 'document' && (
            <div className="grid gap-2">
              <Label htmlFor="document">Document</Label>
              {!file && !formData.filePath ? (
                <div className="flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-md p-6 text-center">
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Upload a document (PDF, DOCX, TXT, etc.)
                  </p>
                  <Input
                    id="document"
                    type="file"
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".pdf,.docx,.doc,.txt,.md,.csv,.xlsx,.xls"
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => document.getElementById('document')?.click()}
                  >
                    Select File
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between border rounded-md p-3">
                  <span className="truncate max-w-[300px]">
                    {file ? file.name : formData.filePath}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setFile(null);
                      setFormData((prev) => ({ ...prev, filePath: undefined }));
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}
          
          {formData.type === 'database' && (
            <div className="grid gap-2">
              <Label htmlFor="connectionString">Connection String</Label>
              <Input
                id="connectionString"
                name="connectionString"
                value={formData.connectionString || ''}
                onChange={handleChange}
                placeholder="postgresql://username:password@localhost:5432/database"
                required={formData.type === 'database'}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Enter the connection string for your database. Make sure it includes all necessary credentials.
              </p>
            </div>
          )}
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isActive"
              name="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData((prev) => ({ ...prev, isActive: e.target.checked }))}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <Label htmlFor="isActive" className="text-sm font-normal">
              Active (available for AI to use)
            </Label>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-end space-x-2">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          disabled={isUploading}
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          onClick={handleSubmit}
          disabled={isUploading}
        >
          {isUploading ? 'Uploading...' : isEditMode ? 'Update' : 'Add Source'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default KnowledgeSourceForm;
