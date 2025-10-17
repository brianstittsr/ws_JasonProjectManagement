import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Invoice } from '../../services/invoiceManagement';
import { format } from 'date-fns';
import { ArrowLeft, Printer, Download, Send, DollarSign, Trash2, Copy, FileText } from 'lucide-react';

interface InvoiceDetailsProps {
  invoice: Invoice;
  onBack: () => void;
  onUpdate: (id: string, updates: Partial<Invoice>) => void;
  onDelete: (id: string) => void;
  onMarkAsPaid: (id: string, amount?: number) => void;
  onCreateTemplate: (invoice: Invoice, name: string) => void;
}

const InvoiceDetails: React.FC<InvoiceDetailsProps> = ({ 
  invoice, 
  onBack, 
  onUpdate, 
  onDelete, 
  onMarkAsPaid,
  onCreateTemplate
}) => {
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(invoice.total.toString());
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [templateName, setTemplateName] = useState(`Template from ${invoice.invoiceNumber}`);

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Draft</Badge>;
      case 'sent':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Sent</Badge>;
      case 'paid':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Paid</Badge>;
      case 'overdue':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Overdue</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleMarkAsPaid = () => {
    const amount = parseFloat(paymentAmount);
    if (!isNaN(amount)) {
      onMarkAsPaid(invoice.id, amount);
      setShowPaymentDialog(false);
    }
  };

  const handleCreateTemplate = () => {
    onCreateTemplate(invoice, templateName);
    setShowTemplateDialog(false);
  };

  const handleSendInvoice = () => {
    onUpdate(invoice.id, { status: 'sent' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" onClick={onBack} className="h-8 w-8 p-0">
            <span className="sr-only">Back</span>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-2xl font-bold">Invoice {invoice.invoiceNumber}</h2>
          {getStatusBadge(invoice.status)}
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
          {invoice.status === 'draft' && (
            <Button size="sm" onClick={handleSendInvoice}>
              <Send className="h-4 w-4 mr-2" />
              Send
            </Button>
          )}
          {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
            <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
              <DialogTrigger asChild>
                <Button size="sm" variant="default">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Record Payment
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Record Payment</DialogTitle>
                  <DialogDescription>
                    Enter the payment amount for invoice {invoice.invoiceNumber}.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Payment Amount</Label>
                    <Input 
                      id="amount"
                      type="number"
                      step="0.01"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowPaymentDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleMarkAsPaid}>
                    Record Payment
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Copy className="h-4 w-4 mr-2" />
                Save as Template
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Save as Template</DialogTitle>
                <DialogDescription>
                  Create a reusable template from this invoice.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="templateName">Template Name</Label>
                  <Input 
                    id="templateName"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setShowTemplateDialog(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreateTemplate}>
                  Create Template
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
              <CardTitle>Invoice Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-between">
                <div>
                  <h3 className="font-semibold">From</h3>
                  <div className="text-sm mt-1">
                    <p>Your Company Name</p>
                    <p>Your Address</p>
                    <p>City, State ZIP</p>
                    <p>your@email.com</p>
                  </div>
                </div>
                <div className="text-right">
                  <h3 className="font-semibold">To</h3>
                  <div className="text-sm mt-1">
                    <p>{invoice.clientName}</p>
                    <p>{invoice.clientAddress}</p>
                    <p>{invoice.clientEmail}</p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Invoice Number</h4>
                  <p>{invoice.invoiceNumber}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Status</h4>
                  <p>{getStatusBadge(invoice.status)}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Issue Date</h4>
                  <p>{formatDate(invoice.issueDate)}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Due Date</h4>
                  <p>{formatDate(invoice.dueDate)}</p>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Items</h3>
                <div className="rounded-md border">
                  <table className="min-w-full divide-y divide-border">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="px-4 py-2 text-left text-sm font-medium">Description</th>
                        <th className="px-4 py-2 text-right text-sm font-medium">Quantity</th>
                        <th className="px-4 py-2 text-right text-sm font-medium">Unit Price</th>
                        <th className="px-4 py-2 text-right text-sm font-medium">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {invoice.items.map(item => (
                        <tr key={item.id}>
                          <td className="px-4 py-2 text-sm">{item.description}</td>
                          <td className="px-4 py-2 text-sm text-right">{item.quantity}</td>
                          <td className="px-4 py-2 text-sm text-right">{formatCurrency(item.unitPrice)}</td>
                          <td className="px-4 py-2 text-sm text-right">{formatCurrency(item.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              <div className="flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Subtotal:</span>
                    <span>{formatCurrency(invoice.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Tax ({invoice.taxRate}%):</span>
                    <span>{formatCurrency(invoice.taxAmount)}</span>
                  </div>
                  <div className="flex justify-between font-semibold border-t pt-2">
                    <span>Total:</span>
                    <span>{formatCurrency(invoice.total)}</span>
                  </div>
                  {invoice.status === 'paid' && invoice.paidAmount && (
                    <div className="flex justify-between text-green-600">
                      <span>Paid:</span>
                      <span>{formatCurrency(invoice.paidAmount)}</span>
                    </div>
                  )}
                </div>
              </div>
              
              {invoice.notes && (
                <div>
                  <h3 className="font-semibold mb-1">Notes</h3>
                  <p className="text-sm text-muted-foreground">{invoice.notes}</p>
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
              <Button className="w-full" variant="outline" onClick={() => setShowTemplateDialog(true)}>
                <Copy className="h-4 w-4 mr-2" />
                Save as Template
              </Button>
              
              {invoice.status === 'draft' && (
                <Button className="w-full" onClick={handleSendInvoice}>
                  <Send className="h-4 w-4 mr-2" />
                  Mark as Sent
                </Button>
              )}
              
              {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
                <Button className="w-full" onClick={() => setShowPaymentDialog(true)}>
                  <DollarSign className="h-4 w-4 mr-2" />
                  Record Payment
                </Button>
              )}
              
              <Button 
                className="w-full" 
                variant="destructive"
                onClick={() => onDelete(invoice.id)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Invoice
              </Button>
            </CardContent>
          </Card>
          
          {invoice.fileUrl && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Original Document</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center">
                <div className="border rounded-md p-4 flex flex-col items-center">
                  <FileText className="h-16 w-16 text-muted-foreground mb-2" />
                  <p className="text-sm text-center">Original invoice document</p>
                  <Button variant="outline" size="sm" className="mt-2">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetails;
