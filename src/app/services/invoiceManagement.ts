import axios from 'axios';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  clientEmail: string;
  clientAddress: string;
  issueDate: string;
  dueDate: string;
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  notes?: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  paidAmount?: number;
  paidDate?: string;
  createdAt: string;
  updatedAt: string;
  fileUrl?: string;
  templateId?: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  taxable: boolean;
}

export interface InvoiceTemplate {
  id: string;
  name: string;
  companyName: string;
  companyAddress: string;
  companyEmail: string;
  companyPhone: string;
  companyLogo?: string;
  defaultTaxRate: number;
  defaultNotes?: string;
  defaultTerms?: string;
  defaultItems?: Omit<InvoiceItem, 'id' | 'amount'>[];
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceSummary {
  totalOutstanding: number;
  totalPaid: number;
  totalOverdue: number;
  countOutstanding: number;
  countPaid: number;
  countOverdue: number;
  recentInvoices: Invoice[];
}

export class InvoiceManagementService {
  private invoices: Invoice[] = [];
  private templates: InvoiceTemplate[] = [];
  private fileStorage: Record<string, { data: ArrayBuffer; type: string; name: string }> = {};

  constructor() {
    this.loadFromLocalStorage();
  }

  /**
   * Load invoices and templates from localStorage
   */
  private loadFromLocalStorage(): void {
    try {
      const invoicesJson = localStorage.getItem('invoices');
      if (invoicesJson) {
        this.invoices = JSON.parse(invoicesJson);
      }

      const templatesJson = localStorage.getItem('invoice-templates');
      if (templatesJson) {
        this.templates = JSON.parse(templatesJson);
      }

      // We can't store binary data in localStorage, so file storage is session-only
    } catch (error) {
      console.error('Error loading invoices from localStorage:', error);
    }
  }

  /**
   * Save invoices to localStorage
   */
  private saveInvoicesToLocalStorage(): void {
    try {
      localStorage.setItem('invoices', JSON.stringify(this.invoices));
    } catch (error) {
      console.error('Error saving invoices to localStorage:', error);
    }
  }

  /**
   * Save templates to localStorage
   */
  private saveTemplatesToLocalStorage(): void {
    try {
      localStorage.setItem('invoice-templates', JSON.stringify(this.templates));
    } catch (error) {
      console.error('Error saving invoice templates to localStorage:', error);
    }
  }

  /**
   * Get all invoices
   */
  getInvoices(): Invoice[] {
    return [...this.invoices];
  }

  /**
   * Get a specific invoice by ID
   */
  getInvoiceById(id: string): Invoice | undefined {
    return this.invoices.find(invoice => invoice.id === id);
  }

  /**
   * Create a new invoice
   */
  createInvoice(invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>): Invoice {
    const newInvoice: Invoice = {
      ...invoice,
      id: `invoice-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.invoices.push(newInvoice);
    this.saveInvoicesToLocalStorage();
    return newInvoice;
  }

  /**
   * Update an existing invoice
   */
  updateInvoice(id: string, updates: Partial<Invoice>): Invoice | null {
    const index = this.invoices.findIndex(invoice => invoice.id === id);
    if (index === -1) return null;

    const updatedInvoice = {
      ...this.invoices[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.invoices[index] = updatedInvoice;
    this.saveInvoicesToLocalStorage();
    return updatedInvoice;
  }

  /**
   * Delete an invoice
   */
  deleteInvoice(id: string): boolean {
    const initialLength = this.invoices.length;
    this.invoices = this.invoices.filter(invoice => invoice.id !== id);
    
    if (this.invoices.length !== initialLength) {
      this.saveInvoicesToLocalStorage();
      return true;
    }
    
    return false;
  }

  /**
   * Mark an invoice as paid
   */
  markAsPaid(id: string, paidAmount?: number): Invoice | null {
    const invoice = this.getInvoiceById(id);
    if (!invoice) return null;

    const updatedInvoice = this.updateInvoice(id, {
      status: 'paid',
      paidAmount: paidAmount || invoice.total,
      paidDate: new Date().toISOString(),
    });

    return updatedInvoice;
  }

  /**
   * Get invoice summary statistics
   */
  getInvoiceSummary(): InvoiceSummary {
    const now = new Date();
    
    const outstanding = this.invoices.filter(invoice => 
      invoice.status !== 'paid' && invoice.status !== 'cancelled'
    );
    
    const paid = this.invoices.filter(invoice => invoice.status === 'paid');
    
    const overdue = this.invoices.filter(invoice => {
      const dueDate = new Date(invoice.dueDate);
      return invoice.status !== 'paid' && 
             invoice.status !== 'cancelled' && 
             dueDate < now;
    });
    
    // Calculate totals
    const totalOutstanding = outstanding.reduce((sum, invoice) => sum + invoice.total, 0);
    const totalPaid = paid.reduce((sum, invoice) => sum + (invoice.paidAmount || invoice.total), 0);
    const totalOverdue = overdue.reduce((sum, invoice) => sum + invoice.total, 0);
    
    // Get recent invoices (last 5)
    const recentInvoices = [...this.invoices]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
    
    return {
      totalOutstanding,
      totalPaid,
      totalOverdue,
      countOutstanding: outstanding.length,
      countPaid: paid.length,
      countOverdue: overdue.length,
      recentInvoices,
    };
  }

  /**
   * Upload an invoice file
   */
  async uploadInvoiceFile(file: File): Promise<string> {
    try {
      const buffer = await file.arrayBuffer();
      const fileId = `file-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      
      this.fileStorage[fileId] = {
        data: buffer,
        type: file.type,
        name: file.name,
      };
      
      return fileId;
    } catch (error) {
      console.error('Error uploading invoice file:', error);
      throw new Error('Failed to upload invoice file');
    }
  }

  /**
   * Get an invoice file
   */
  getInvoiceFile(fileId: string): { data: ArrayBuffer; type: string; name: string } | null {
    return this.fileStorage[fileId] || null;
  }

  /**
   * Extract invoice data from an uploaded file using OCR
   */
  async extractInvoiceData(fileId: string): Promise<Partial<Invoice>> {
    const file = this.getInvoiceFile(fileId);
    if (!file) {
      throw new Error('File not found');
    }

    try {
      // In a real implementation, this would call an OCR service
      // For now, we'll simulate the extraction with a delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Return simulated extracted data
      return {
        invoiceNumber: `INV-${Math.floor(10000 + Math.random() * 90000)}`,
        clientName: 'Extracted Client Name',
        clientEmail: 'client@example.com',
        clientAddress: '123 Client Street, City, Country',
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        items: [
          {
            id: `item-${Date.now()}-1`,
            description: 'Extracted Service Item',
            quantity: 1,
            unitPrice: 100,
            amount: 100,
            taxable: true,
          }
        ],
        subtotal: 100,
        taxRate: 10,
        taxAmount: 10,
        total: 110,
        status: 'draft',
        fileUrl: fileId,
      };
    } catch (error) {
      console.error('Error extracting invoice data:', error);
      throw new Error('Failed to extract invoice data');
    }
  }

  /**
   * Create an invoice template from an existing invoice
   */
  createTemplateFromInvoice(invoice: Invoice, templateName: string): InvoiceTemplate {
    const newTemplate: InvoiceTemplate = {
      id: `template-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      name: templateName,
      companyName: 'Your Company', // This would come from user settings in a real app
      companyAddress: 'Your Company Address',
      companyEmail: 'company@example.com',
      companyPhone: '123-456-7890',
      defaultTaxRate: invoice.taxRate,
      defaultNotes: invoice.notes,
      defaultItems: invoice.items.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxable: item.taxable,
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.templates.push(newTemplate);
    this.saveTemplatesToLocalStorage();
    return newTemplate;
  }

  /**
   * Get all invoice templates
   */
  getTemplates(): InvoiceTemplate[] {
    return [...this.templates];
  }

  /**
   * Get a specific template by ID
   */
  getTemplateById(id: string): InvoiceTemplate | undefined {
    return this.templates.find(template => template.id === id);
  }

  /**
   * Create a new invoice from a template
   */
  createInvoiceFromTemplate(templateId: string, clientInfo: {
    clientName: string;
    clientEmail: string;
    clientAddress: string;
    invoiceNumber?: string;
    issueDate?: string;
    dueDate?: string;
  }): Invoice {
    const template = this.getTemplateById(templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    const today = new Date();
    const dueDate = new Date();
    dueDate.setDate(today.getDate() + 30); // Default: 30 days from now

    const items = template.defaultItems?.map(item => ({
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      amount: item.quantity * item.unitPrice,
      taxable: item.taxable,
    })) || [];

    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const taxableAmount = items
      .filter(item => item.taxable)
      .reduce((sum, item) => sum + item.amount, 0);
    const taxAmount = taxableAmount * (template.defaultTaxRate / 100);
    const total = subtotal + taxAmount;

    const newInvoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'> = {
      invoiceNumber: clientInfo.invoiceNumber || `INV-${Math.floor(10000 + Math.random() * 90000)}`,
      clientName: clientInfo.clientName,
      clientEmail: clientInfo.clientEmail,
      clientAddress: clientInfo.clientAddress,
      issueDate: clientInfo.issueDate || today.toISOString().split('T')[0],
      dueDate: clientInfo.dueDate || dueDate.toISOString().split('T')[0],
      items,
      subtotal,
      taxRate: template.defaultTaxRate,
      taxAmount,
      total,
      notes: template.defaultNotes,
      status: 'draft',
      templateId,
    };

    return this.createInvoice(newInvoice);
  }

  /**
   * Update an existing template
   */
  updateTemplate(id: string, updates: Partial<InvoiceTemplate>): InvoiceTemplate | null {
    const index = this.templates.findIndex(template => template.id === id);
    if (index === -1) return null;

    const updatedTemplate = {
      ...this.templates[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.templates[index] = updatedTemplate;
    this.saveTemplatesToLocalStorage();
    return updatedTemplate;
  }

  /**
   * Delete a template
   */
  deleteTemplate(id: string): boolean {
    const initialLength = this.templates.length;
    this.templates = this.templates.filter(template => template.id !== id);
    
    if (this.templates.length !== initialLength) {
      this.saveTemplatesToLocalStorage();
      return true;
    }
    
    return false;
  }
}

// Helper function to create an InvoiceManagementService
export const createInvoiceManagementService = (): InvoiceManagementService => {
  return new InvoiceManagementService();
};
