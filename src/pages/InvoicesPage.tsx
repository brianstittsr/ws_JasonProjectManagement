import React, { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { Loader2, Plus, FileText, DollarSign, Clock, CheckCircle } from 'lucide-react';
import AdminLayout from '../layouts/AdminLayout';
import InvoicesList from '../components/invoices/InvoicesList';
import InvoiceDetails from '../components/invoices/InvoiceDetails';
import InvoiceUpload from '../components/invoices/InvoiceUpload';
import InvoiceTemplatesList from '../components/invoices/InvoiceTemplatesList';
import InvoiceTemplateDetails from '../components/invoices/InvoiceTemplateDetails';
import { InvoiceManagementService, Invoice, InvoiceTemplate, InvoiceSummary, createInvoiceManagementService } from '../services/invoiceManagement';

const InvoicesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [invoiceService, setInvoiceService] = useState<InvoiceManagementService | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [templates, setTemplates] = useState<InvoiceTemplate[]>([]);
  const [summary, setSummary] = useState<InvoiceSummary | null>(null);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  useEffect(() => {
    const initInvoiceService = () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Create invoice service
        const service = createInvoiceManagementService();
        setInvoiceService(service);
        
        // Load invoices and templates
        const invoicesList = service.getInvoices();
        const templatesList = service.getTemplates();
        const invoiceSummary = service.getInvoiceSummary();
        
        setInvoices(invoicesList);
        setTemplates(templatesList);
        setSummary(invoiceSummary);
      } catch (err) {
        console.error('Error initializing invoice service:', err);
        setError('An error occurred while initializing the invoice service.');
      } finally {
        setIsLoading(false);
      }
    };
    
    initInvoiceService();
  }, []);

  const refreshData = () => {
    if (!invoiceService) return;
    
    setInvoices(invoiceService.getInvoices());
    setTemplates(invoiceService.getTemplates());
    setSummary(invoiceService.getInvoiceSummary());
  };

  const handleInvoiceSelect = (invoiceId: string) => {
    setSelectedInvoiceId(invoiceId);
    setSelectedTemplateId(null);
    setActiveTab('invoice-details');
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);
    setSelectedInvoiceId(null);
    setActiveTab('template-details');
  };

  const handleCreateInvoice = (invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!invoiceService) return;
    
    const newInvoice = invoiceService.createInvoice(invoice);
    refreshData();
    setSelectedInvoiceId(newInvoice.id);
    setActiveTab('invoice-details');
  };

  const handleUpdateInvoice = (id: string, updates: Partial<Invoice>) => {
    if (!invoiceService) return;
    
    invoiceService.updateInvoice(id, updates);
    refreshData();
  };

  const handleDeleteInvoice = (id: string) => {
    if (!invoiceService) return;
    
    invoiceService.deleteInvoice(id);
    refreshData();
    
    if (selectedInvoiceId === id) {
      setSelectedInvoiceId(null);
      setActiveTab('all');
    }
  };

  const handleMarkAsPaid = (id: string, amount?: number) => {
    if (!invoiceService) return;
    
    invoiceService.markAsPaid(id, amount);
    refreshData();
  };

  const handleCreateTemplate = (invoice: Invoice, name: string) => {
    if (!invoiceService) return;
    
    const newTemplate = invoiceService.createTemplateFromInvoice(invoice, name);
    refreshData();
    setSelectedTemplateId(newTemplate.id);
    setActiveTab('template-details');
  };

  const handleUpdateTemplate = (id: string, updates: Partial<InvoiceTemplate>) => {
    if (!invoiceService) return;
    
    invoiceService.updateTemplate(id, updates);
    refreshData();
  };

  const handleDeleteTemplate = (id: string) => {
    if (!invoiceService) return;
    
    invoiceService.deleteTemplate(id);
    refreshData();
    
    if (selectedTemplateId === id) {
      setSelectedTemplateId(null);
      setActiveTab('templates');
    }
  };

  const handleCreateFromTemplate = (templateId: string, clientInfo: {
    clientName: string;
    clientEmail: string;
    clientAddress: string;
    invoiceNumber?: string;
    issueDate?: string;
    dueDate?: string;
  }) => {
    if (!invoiceService) return;
    
    const newInvoice = invoiceService.createInvoiceFromTemplate(templateId, clientInfo);
    refreshData();
    setSelectedInvoiceId(newInvoice.id);
    setActiveTab('invoice-details');
  };

  const handleFileUpload = async (file: File) => {
    if (!invoiceService) return;
    
    try {
      const fileId = await invoiceService.uploadInvoiceFile(file);
      const extractedData = await invoiceService.extractInvoiceData(fileId);
      
      // Create a new invoice with the extracted data
      const newInvoice = invoiceService.createInvoice({
        ...extractedData,
        status: 'draft',
      } as Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>);
      
      refreshData();
      setSelectedInvoiceId(newInvoice.id);
      setActiveTab('invoice-details');
      setShowUploadModal(false);
    } catch (err) {
      console.error('Error processing uploaded invoice:', err);
      setError('Failed to process the uploaded invoice.');
    }
  };

  const handleBackToList = () => {
    setSelectedInvoiceId(null);
    setSelectedTemplateId(null);
    setActiveTab(activeTab === 'invoice-details' ? 'all' : 'templates');
  };

  const selectedInvoice = selectedInvoiceId 
    ? invoices.find(invoice => invoice.id === selectedInvoiceId) 
    : null;
    
  const selectedTemplate = selectedTemplateId 
    ? templates.find(template => template.id === selectedTemplateId) 
    : null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Invoices</h1>
          <div className="flex space-x-2">
            <Button onClick={() => setShowUploadModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Upload Invoice
            </Button>
          </div>
        </div>
        
        {error && (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {selectedInvoiceId && selectedInvoice ? (
              <InvoiceDetails 
                invoice={selectedInvoice}
                onBack={handleBackToList}
                onUpdate={handleUpdateInvoice}
                onDelete={handleDeleteInvoice}
                onMarkAsPaid={handleMarkAsPaid}
                onCreateTemplate={handleCreateTemplate}
              />
            ) : selectedTemplateId && selectedTemplate ? (
              <InvoiceTemplateDetails 
                template={selectedTemplate}
                onBack={handleBackToList}
                onUpdate={handleUpdateTemplate}
                onDelete={handleDeleteTemplate}
                onCreateInvoice={handleCreateFromTemplate}
              />
            ) : (
              <Tabs defaultValue="dashboard" value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                  <TabsTrigger value="all">All Invoices</TabsTrigger>
                  <TabsTrigger value="outstanding">Outstanding</TabsTrigger>
                  <TabsTrigger value="paid">Paid</TabsTrigger>
                  <TabsTrigger value="templates">Templates</TabsTrigger>
                </TabsList>
                
                <TabsContent value="dashboard" className="space-y-4 mt-6">
                  {summary && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center">
                              <DollarSign className="h-4 w-4 mr-2 text-yellow-500" />
                              Outstanding
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(summary.totalOutstanding)}</div>
                            <p className="text-sm text-muted-foreground">{summary.countOutstanding} invoices</p>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center">
                              <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                              Paid
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(summary.totalPaid)}</div>
                            <p className="text-sm text-muted-foreground">{summary.countPaid} invoices</p>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center">
                              <Clock className="h-4 w-4 mr-2 text-red-500" />
                              Overdue
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(summary.totalOverdue)}</div>
                            <p className="text-sm text-muted-foreground">{summary.countOverdue} invoices</p>
                          </CardContent>
                        </Card>
                      </div>
                      
                      <Card>
                        <CardHeader>
                          <CardTitle>Recent Invoices</CardTitle>
                          <CardDescription>Your most recently created invoices</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <InvoicesList 
                            invoices={summary.recentInvoices} 
                            onSelect={handleInvoiceSelect} 
                          />
                        </CardContent>
                      </Card>
                    </>
                  )}
                </TabsContent>
                
                <TabsContent value="all" className="space-y-4 mt-6">
                  <InvoicesList 
                    invoices={invoices} 
                    onSelect={handleInvoiceSelect} 
                  />
                </TabsContent>
                
                <TabsContent value="outstanding" className="space-y-4 mt-6">
                  <InvoicesList 
                    invoices={invoices.filter(invoice => 
                      invoice.status !== 'paid' && invoice.status !== 'cancelled'
                    )} 
                    onSelect={handleInvoiceSelect} 
                  />
                </TabsContent>
                
                <TabsContent value="paid" className="space-y-4 mt-6">
                  <InvoicesList 
                    invoices={invoices.filter(invoice => invoice.status === 'paid')} 
                    onSelect={handleInvoiceSelect} 
                  />
                </TabsContent>
                
                <TabsContent value="templates" className="space-y-4 mt-6">
                  <InvoiceTemplatesList 
                    templates={templates} 
                    onSelect={handleTemplateSelect} 
                  />
                </TabsContent>
              </Tabs>
            )}
          </>
        )}
      </div>
      
      {showUploadModal && (
        <InvoiceUpload 
          onUpload={handleFileUpload}
          onCancel={() => setShowUploadModal(false)}
        />
      )}
    </AdminLayout>
  );
};

export default InvoicesPage;
