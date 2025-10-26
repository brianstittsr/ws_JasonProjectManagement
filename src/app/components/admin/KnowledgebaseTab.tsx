import React, { useState } from 'react';
import { Plus, Search, Filter, Database, FileText, Globe, X } from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import KnowledgebaseSourceCard, { KnowledgeSource, KnowledgeSourceType } from './KnowledgebaseSourceCard';
import KnowledgeSourceForm from './KnowledgeSourceForm';
import AiAssistant from './AiAssistant';

// Sample knowledge sources
const sampleSources: KnowledgeSource[] = [
  {
    id: 'source-1',
    name: 'Company Documentation',
    description: 'Internal company documentation and guidelines',
    type: 'url',
    url: 'https://docs.company.com',
    isActive: true,
    lastSynced: new Date(2023, 9, 15)
  },
  {
    id: 'source-2',
    name: 'Project Requirements',
    description: 'Detailed project requirements and specifications',
    type: 'document',
    filePath: 'requirements.pdf',
    isActive: true,
    lastSynced: new Date(2023, 9, 20)
  },
  {
    id: 'source-3',
    name: 'Customer Database',
    description: 'Customer information and history',
    type: 'database',
    connectionString: 'postgresql://user:pass@localhost:5432/customers',
    isActive: false,
    lastSynced: new Date(2023, 9, 10)
  },
  {
    id: 'source-4',
    name: 'API Documentation',
    description: 'External API documentation',
    type: 'url',
    url: 'https://api.external-service.com/docs',
    isActive: true,
    lastSynced: new Date(2023, 9, 18)
  },
  {
    id: 'source-5',
    name: 'Architecture Diagrams',
    description: 'System architecture and design documents',
    type: 'document',
    filePath: 'architecture.drawio',
    isActive: true,
    lastSynced: new Date(2023, 9, 12)
  }
];

const KnowledgebaseTab: React.FC = () => {
  const [sources, setSources] = useState<KnowledgeSource[]>(sampleSources);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<KnowledgeSourceType[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'inactive'>('all');
  const [isAddingSource, setIsAddingSource] = useState(false);
  const [editingSource, setEditingSource] = useState<KnowledgeSource | null>(null);
  const [showAssistant, setShowAssistant] = useState(false);

  const filteredSources = sources.filter(source => {
    // Filter by tab
    if (activeTab === 'active' && !source.isActive) return false;
    if (activeTab === 'inactive' && source.isActive) return false;
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (
        !source.name.toLowerCase().includes(query) &&
        !source.description.toLowerCase().includes(query)
      ) {
        return false;
      }
    }
    
    // Filter by selected types
    if (selectedTypes.length > 0 && !selectedTypes.includes(source.type)) {
      return false;
    }
    
    return true;
  });

  const handleTypeToggle = (type: KnowledgeSourceType) => {
    setSelectedTypes(prev => 
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const handleSaveSource = (source: KnowledgeSource) => {
    if (editingSource) {
      // Update existing source
      setSources(prev => 
        prev.map(s => s.id === source.id ? source : s)
      );
      setEditingSource(null);
    } else {
      // Add new source
      setSources(prev => [...prev, source]);
      setIsAddingSource(false);
    }
  };

  const handleToggleActive = (sourceId: string, active: boolean) => {
    setSources(prev => 
      prev.map(source => 
        source.id === sourceId ? { ...source, isActive: active } : source
      )
    );
  };

  const handleDeleteSource = (sourceId: string) => {
    if (confirm('Are you sure you want to delete this knowledge source?')) {
      setSources(prev => prev.filter(source => source.id !== sourceId));
    }
  };

  return (
    <div className="space-y-6">
      {showAssistant ? (
        <AiAssistant onClose={() => setShowAssistant(false)} />
      ) : isAddingSource || editingSource ? (
        <KnowledgeSourceForm
          source={editingSource || undefined}
          onSave={handleSaveSource}
          onCancel={() => {
            setIsAddingSource(false);
            setEditingSource(null);
          }}
        />
      ) : (
        <>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-bold">Knowledge Sources</h2>
              <p className="text-muted-foreground">
                Manage the sources of information that the AI assistant can access
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={() => setIsAddingSource(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Add Source
              </Button>
              <Button 
                variant="secondary"
                onClick={() => setShowAssistant(true)}
              >
                Open AI Assistant
              </Button>
            </div>
          </div>
          
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <Tabs defaultValue="all" value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
              <TabsList>
                <TabsTrigger value="all">All Sources</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="inactive">Inactive</TabsTrigger>
              </TabsList>
            </Tabs>
            
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search sources..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center">
              <Filter className="h-4 w-4 mr-2" />
              <span className="text-sm font-medium">Filter by type:</span>
            </div>
            <Badge
              variant={selectedTypes.includes('url') ? "default" : "outline"}
              className={`cursor-pointer ${
                !selectedTypes.includes('url') 
                  ? "bg-blue-100 text-blue-600 border-blue-200" 
                  : ""
              }`}
              onClick={() => handleTypeToggle('url')}
            >
              <Globe className="h-3 w-3 mr-1" />
              Web URL
              {selectedTypes.includes('url') && (
                <X className="ml-1 h-3 w-3" />
              )}
            </Badge>
            <Badge
              variant={selectedTypes.includes('document') ? "default" : "outline"}
              className={`cursor-pointer ${
                !selectedTypes.includes('document') 
                  ? "bg-green-100 text-green-600 border-green-200" 
                  : ""
              }`}
              onClick={() => handleTypeToggle('document')}
            >
              <FileText className="h-3 w-3 mr-1" />
              Document
              {selectedTypes.includes('document') && (
                <X className="ml-1 h-3 w-3" />
              )}
            </Badge>
            <Badge
              variant={selectedTypes.includes('database') ? "default" : "outline"}
              className={`cursor-pointer ${
                !selectedTypes.includes('database') 
                  ? "bg-purple-100 text-purple-600 border-purple-200" 
                  : ""
              }`}
              onClick={() => handleTypeToggle('database')}
            >
              <Database className="h-3 w-3 mr-1" />
              Database
              {selectedTypes.includes('database') && (
                <X className="ml-1 h-3 w-3" />
              )}
            </Badge>
          </div>
          
          {filteredSources.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-3">
                <Search className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">No knowledge sources found</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Try adjusting your search or filter to find what you're looking for
              </p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedTypes([]);
                  setActiveTab('all');
                }}
              >
                Clear filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredSources.map(source => (
                <KnowledgebaseSourceCard
                  key={source.id}
                  source={source}
                  onEdit={(id) => {
                    const sourceToEdit = sources.find(s => s.id === id);
                    if (sourceToEdit) {
                      setEditingSource(sourceToEdit);
                    }
                  }}
                  onToggleActive={handleToggleActive}
                  onDelete={handleDeleteSource}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default KnowledgebaseTab;
