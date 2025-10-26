import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { InvoiceTemplate } from '../../services/invoiceManagement';
import { format } from 'date-fns';
import { ArrowLeft, FileText, Trash2, Edit, Plus } from 'lucide-react';

interface InvoiceTemplateDetailsProps {
  template: InvoiceTemplate;
  onBack: () => void;
  onUpdate: (id: string, updates: Partial<InvoiceTemplate>) => void;
  onDelete: (id: string) => void;
  onCreateInvoice: (templateId: string, clientInfo: {
    clientName: string;
    clientEmail: string;
    clientAddress: string;
    invoiceNumber?: string;
    issueDate?: string;
    dueDate?: string;
  }) => void;
}

const InvoiceTemplateDetails: React.FC<InvoiceTemplateDetailsProps> = ({ 
  template, 
  onBack, 
  onUpdate, 
  onDelete,
  onCreateInvoice
}) => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [clientInfo, setClientInfo] = useState({
    clientName: '',
    clientEmail: '',
    clientAddress: '',
    invoiceNumber: `INV-${Math.floor(10000 + Math.random() * 90000)}`,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'MMMM d, yyyy');
    } catch (error) {
      return 'Invalid date';
    }
  };

  const handleCreateInvoice = () => {
    onCreateInvoice(template.id, clientInfo);
    setShowCreateDialog(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" onClick={onBack} className="h-8 w-8 p-0">
            <span className="sr-only">Back</span>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-2xl font-bold">{template.name}</h2>
        </div>
        <div className="flex space-x-2">
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Invoice
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Invoice</DialogTitle>
                <DialogDescription>
                  Enter client information to create a new invoice using this template.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="invoiceNumber">Invoice Number</Label>
                  <Input 
                    id="invoiceNumber"
                    value={clientInfo.invoiceNumber}
                    onChange={(e) => setClientInfo({...clientInfo, invoiceNumber: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientName">Client Name</Label>
                  <Input 
                    id="clientName"
                    value={clientInfo.clientName}
                    onChange={(e) => setClientInfo({...clientInfo, clientName: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientEmail">Client Email</Label>
                  <Input 
                    id="clientEmail"
                    type="email"
                    value={clientInfo.clientEmail}
                    onChange={(e) => setClientInfo({...clientInfo, clientEmail: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientAddress">Client Address</Label>
                  <Input 
                    id="clientAddress"
                    value={clientInfo.clientAddress}
                    onChange={(e) => setClientInfo({...clientInfo, clientAddress: e.target.value})}
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setShowCreateDialog(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateInvoice}
                  disabled={!clientInfo.clientName || !clientInfo.clientEmail || !clientInfo.clientAddress}
                >
                  Create Invoice
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Template Details</CardTitle>
              <CardDescription>
                Created on {formatDate(template.createdAt)}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-between">
                <div>
                  <h3 className="font-semibold">Company Information</h3>
                  <div className="text-sm mt-1">
                    <p>{template.companyName}</p>
                    <p>{template.companyAddress}</p>
                    <p>{template.companyEmail}</p>
                    <p>{template.companyPhone}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Default Items</h3>
                {template.defaultItems && template.defaultItems.length > 0 ? (
                  <div className="rounded-md border">
                    <table className="min-w-full divide-y divide-border">
                      <thead>
                        <tr className="bg-muted/50">
                          <th className="px-4 py-2 text-left text-sm font-medium">Description</th>
                          <th className="px-4 py-2 text-right text-sm font-medium">Quantity</th>
                          <th className="px-4 py-2 text-right text-sm font-medium">Unit Price</th>
                          <th className="px-4 py-2 text-center text-sm font-medium">Taxable</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {template.defaultItems.map((item, index) => (
                          <tr key={index}>
                            <td className="px-4 py-2 text-sm">{item.description}</td>
                            <td className="px-4 py-2 text-sm text-right">{item.quantity}</td>
                            <td className="px-4 py-2 text-sm text-right">{formatCurrency(item.unitPrice)}</td>
                            <td className="px-4 py-2 text-sm text-center">
                              {item.taxable ? '✓' : ''}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No default items defined.</p>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Default Tax Rate</h4>
                  <p>{template.defaultTaxRate}%</p>
                </div>
              </div>
              
              {template.defaultNotes && (
                <div>
                  <h3 className="font-semibold mb-1">Default Notes</h3>
                  <p className="text-sm text-muted-foreground">{template.defaultNotes}</p>
                </div>
              )}
              
              {template.defaultTerms && (
                <div>
                  <h3 className="font-semibold mb-1">Default Terms</h3>
                  <p className="text-sm text-muted-foreground">{template.defaultTerms}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                className="w-full" 
                onClick={() => setShowCreateDialog(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Invoice
              </Button>
              
              <Button className="w-full" variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Edit Template
              </Button>
              
              <Button 
                className="w-full" 
                variant="destructive"
                onClick={() => onDelete(template.id)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Template
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default InvoiceTemplateDetails;
