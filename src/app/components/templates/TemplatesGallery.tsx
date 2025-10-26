import React, { useState, useEffect } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import TemplateCard, { Template, TemplateCategory } from './TemplateCard';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';

// Sample template categories
const templateCategories: TemplateCategory[] = [
  { id: 'agile', name: 'Agile', color: 'bg-blue-500/10 text-blue-500 border-blue-200' },
  { id: 'waterfall', name: 'Waterfall', color: 'bg-green-500/10 text-green-500 border-green-200' },
  { id: 'kanban', name: 'Kanban', color: 'bg-purple-500/10 text-purple-500 border-purple-200' },
  { id: 'scrum', name: 'Scrum', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-200' },
  { id: 'devops', name: 'DevOps', color: 'bg-red-500/10 text-red-500 border-red-200' },
  { id: 'product', name: 'Product Management', color: 'bg-indigo-500/10 text-indigo-500 border-indigo-200' },
  { id: 'design', name: 'Design', color: 'bg-pink-500/10 text-pink-500 border-pink-200' },
  { id: 'marketing', name: 'Marketing', color: 'bg-orange-500/10 text-orange-500 border-orange-200' },
  { id: 'research', name: 'Research', color: 'bg-teal-500/10 text-teal-500 border-teal-200' },
  { id: 'bleeding-edge', name: 'Bleeding Edge', color: 'bg-rose-500/10 text-rose-500 border-rose-200' },
];

// Sample templates
const sampleTemplates: Template[] = [
  {
    id: 'agile-sprint-planning',
    title: 'Agile Sprint Planning',
    description: 'Plan and track your sprints with this comprehensive template',
    thumbnail: 'https://images.unsplash.com/photo-1572177812156-58036aae439c?q=80&w=500&auto=format',
    categories: ['agile', 'scrum'],
    popularity: 95,
    isNew: false,
    isFeatured: true,
  },
  {
    id: 'kanban-board',
    title: 'Kanban Board',
    description: 'Visualize your workflow with customizable Kanban boards',
    thumbnail: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?q=80&w=500&auto=format',
    categories: ['kanban', 'agile'],
    popularity: 90,
    isNew: false,
    isFeatured: false,
  },
  {
    id: 'product-roadmap',
    title: 'Product Roadmap',
    description: 'Strategic planning for your product development',
    thumbnail: 'https://images.unsplash.com/photo-1507925921958-8a62f3d1a50d?q=80&w=500&auto=format',
    categories: ['product', 'agile'],
    popularity: 85,
    isNew: false,
    isFeatured: false,
  },
  {
    id: 'devops-ci-cd',
    title: 'DevOps CI/CD Pipeline',
    description: 'Continuous integration and deployment workflow',
    thumbnail: 'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?q=80&w=500&auto=format',
    categories: ['devops', 'bleeding-edge'],
    popularity: 80,
    isNew: true,
    isFeatured: false,
  },
  {
    id: 'design-system',
    title: 'Design System',
    description: 'Maintain consistency across your product design',
    thumbnail: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?q=80&w=500&auto=format',
    categories: ['design', 'product'],
    popularity: 75,
    isNew: false,
    isFeatured: false,
  },
  {
    id: 'ai-ml-project',
    title: 'AI/ML Project Framework',
    description: 'Structure for machine learning and AI projects',
    thumbnail: 'https://images.unsplash.com/photo-1677442135136-760c813170d5?q=80&w=500&auto=format',
    categories: ['research', 'bleeding-edge'],
    popularity: 70,
    isNew: true,
    isFeatured: true,
  },
  {
    id: 'waterfall-project',
    title: 'Waterfall Project Plan',
    description: 'Traditional project management methodology',
    thumbnail: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=500&auto=format',
    categories: ['waterfall'],
    popularity: 65,
    isNew: false,
    isFeatured: false,
  },
  {
    id: 'marketing-campaign',
    title: 'Marketing Campaign Tracker',
    description: 'Plan and measure your marketing initiatives',
    thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=500&auto=format',
    categories: ['marketing'],
    popularity: 60,
    isNew: false,
    isFeatured: false,
  },
  {
    id: 'quantum-computing',
    title: 'Quantum Computing Research',
    description: 'Cutting-edge framework for quantum computing projects',
    thumbnail: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=500&auto=format',
    categories: ['research', 'bleeding-edge'],
    popularity: 55,
    isNew: true,
    isFeatured: true,
  },
];

interface TemplatesGalleryProps {
  onSelectTemplate: (templateId: string) => void;
}

const TemplatesGallery: React.FC<TemplatesGalleryProps> = ({ onSelectTemplate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>(sampleTemplates);
  const [activeTab, setActiveTab] = useState<'all' | 'featured' | 'new'>('all');
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);

  useEffect(() => {
    let result = sampleTemplates;
    
    // Filter by tab
    if (activeTab === 'featured') {
      result = result.filter(template => template.isFeatured);
    } else if (activeTab === 'new') {
      result = result.filter(template => template.isNew);
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(template => 
        template.title.toLowerCase().includes(query) || 
        template.description.toLowerCase().includes(query)
      );
    }
    
    // Filter by selected categories
    if (selectedCategories.length > 0) {
      result = result.filter(template => 
        selectedCategories.some(category => template.categories.includes(category))
      );
    }
    
    setFilteredTemplates(result);
  }, [searchQuery, selectedCategories, activeTab]);

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handlePreview = (templateId: string) => {
    const template = sampleTemplates.find(t => t.id === templateId);
    if (template) {
      setPreviewTemplate(template);
    }
  };

  const handleUseTemplate = (templateId: string) => {
    onSelectTemplate(templateId);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Project Templates</h2>
          <p className="text-muted-foreground">
            Choose from our collection of templates to jumpstart your project
          </p>
        </div>
        
        <div className="relative w-full md:w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <Tabs defaultValue="all" value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
          <TabsList>
            <TabsTrigger value="all">All Templates</TabsTrigger>
            <TabsTrigger value="featured">Featured</TabsTrigger>
            <TabsTrigger value="new">New</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center">
            <Filter className="h-4 w-4 mr-2" />
            <span className="text-sm font-medium">Filter:</span>
          </div>
          {templateCategories.map(category => (
            <Badge
              key={category.id}
              variant={selectedCategories.includes(category.id) ? "default" : "outline"}
              className={`cursor-pointer ${
                selectedCategories.includes(category.id) 
                  ? "" 
                  : category.color
              }`}
              onClick={() => handleCategoryToggle(category.id)}
            >
              {category.name}
              {selectedCategories.includes(category.id) && (
                <X className="ml-1 h-3 w-3" />
              )}
            </Badge>
          ))}
        </div>
      </div>
      
      {filteredTemplates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-muted p-3">
            <Search className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No templates found</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Try adjusting your search or filter to find what you're looking for
          </p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategories([]);
              setActiveTab('all');
            }}
          >
            Clear filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map(template => (
            <TemplateCard
              key={template.id}
              template={template}
              categories={templateCategories}
              onUse={handleUseTemplate}
              onPreview={handlePreview}
            />
          ))}
        </div>
      )}
      
      {/* Template Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={(open) => !open && setPreviewTemplate(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{previewTemplate?.title}</DialogTitle>
            <DialogDescription>{previewTemplate?.description}</DialogDescription>
          </DialogHeader>
          
          <div className="mt-4">
            <img 
              src={previewTemplate?.thumbnail} 
              alt={previewTemplate?.title}
              className="w-full h-64 object-cover rounded-md"
            />
            
            <div className="mt-4 space-y-4">
              <div>
                <h4 className="text-sm font-medium">Categories</h4>
                <div className="flex flex-wrap gap-1 mt-1">
                  {previewTemplate?.categories.map(categoryId => {
                    const category = templateCategories.find(c => c.id === categoryId);
                    return (
                      <Badge 
                        key={categoryId} 
                        variant="outline" 
                        className={category?.color}
                      >
                        {category?.name || categoryId}
                      </Badge>
                    );
                  })}
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium">Template Preview</h4>
                <div className="border rounded-md p-4 mt-1">
                  <p className="text-muted-foreground">
                    This is a preview of the template structure. In a real implementation, 
                    this would show a detailed preview of the template's content and layout.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <Button 
                onClick={() => {
                  if (previewTemplate) {
                    handleUseTemplate(previewTemplate.id);
                    setPreviewTemplate(null);
                  }
                }}
              >
                Use This Template
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TemplatesGallery;
