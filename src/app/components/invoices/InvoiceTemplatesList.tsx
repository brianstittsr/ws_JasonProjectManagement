import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { InvoiceTemplate } from '../../services/invoiceManagement';
import { format } from 'date-fns';
import { ArrowRight, FileText } from 'lucide-react';

interface InvoiceTemplatesListProps {
  templates: InvoiceTemplate[];
  onSelect: (templateId: string) => void;
}

const InvoiceTemplatesList: React.FC<InvoiceTemplatesListProps> = ({ templates, onSelect }) => {
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'MMM d, yyyy');
    } catch (error) {
      return 'Invalid date';
    }
  };

  return (
    <div className="space-y-6">
      {templates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map(template => (
            <Card key={template.id} className="flex flex-col">
              <CardHeader>
                <CardTitle>{template.name}</CardTitle>
                <CardDescription>
                  Created {formatDate(template.createdAt)}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Company:</span> {template.companyName}
                  </div>
                  <div>
                    <span className="font-medium">Tax Rate:</span> {template.defaultTaxRate}%
                  </div>
                  <div>
                    <span className="font-medium">Default Items:</span> {template.defaultItems?.length || 0}
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  variant="default" 
                  className="w-full"
                  onClick={() => onSelect(template.id)}
                >
                  Use Template
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No templates available</h3>
          <p className="text-muted-foreground mb-4">
            You haven't created any invoice templates yet.
          </p>
          <p className="text-sm text-muted-foreground">
            Create a template from an existing invoice to quickly generate new invoices.
          </p>
        </div>
      )}
    </div>
  );
};

export default InvoiceTemplatesList;
