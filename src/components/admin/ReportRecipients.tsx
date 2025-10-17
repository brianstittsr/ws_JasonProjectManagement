import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Loader2, CheckCircle, AlertCircle, Plus, Trash2, Edit2 } from 'lucide-react';
import { EmailRecipient } from '../../services/emailDelivery';

interface ReportRecipientsProps {
  recipients: EmailRecipient[];
  onRecipientsChange: (recipients: EmailRecipient[]) => void;
}

const ReportRecipients: React.FC<ReportRecipientsProps> = ({ 
  recipients, 
  onRecipientsChange 
}) => {
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [newRecipient, setNewRecipient] = useState<Partial<EmailRecipient>>({
    email: '',
    name: '',
    role: 'Other'
  });
  const [editedRecipient, setEditedRecipient] = useState<EmailRecipient | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleAddRecipient = () => {
    if (!newRecipient.email || !newRecipient.name) {
      setError('Email and name are required');
      return;
    }

    if (!validateEmail(newRecipient.email)) {
      setError('Please enter a valid email address');
      return;
    }

    const recipientExists = recipients.some(r => r.email === newRecipient.email);
    if (recipientExists) {
      setError('A recipient with this email already exists');
      return;
    }

    const recipient: EmailRecipient = {
      id: `recipient-${Date.now()}`,
      email: newRecipient.email,
      name: newRecipient.name,
      role: newRecipient.role || 'Other'
    };

    onRecipientsChange([...recipients, recipient]);
    setNewRecipient({ email: '', name: '', role: 'Other' });
    setError(null);
  };

  const handleEditRecipient = (recipient: EmailRecipient) => {
    setIsEditing(recipient.id);
    setEditedRecipient({ ...recipient });
  };

  const handleSaveEdit = () => {
    if (!editedRecipient) return;

    if (!editedRecipient.email || !editedRecipient.name) {
      setError('Email and name are required');
      return;
    }

    if (!validateEmail(editedRecipient.email)) {
      setError('Please enter a valid email address');
      return;
    }

    const emailExists = recipients.some(r => 
      r.email === editedRecipient.email && r.id !== editedRecipient.id
    );
    
    if (emailExists) {
      setError('A recipient with this email already exists');
      return;
    }

    const updatedRecipients = recipients.map(r => 
      r.id === editedRecipient.id ? editedRecipient : r
    );

    onRecipientsChange(updatedRecipients);
    setIsEditing(null);
    setEditedRecipient(null);
    setError(null);
  };

  const handleCancelEdit = () => {
    setIsEditing(null);
    setEditedRecipient(null);
    setError(null);
  };

  const handleDeleteRecipient = (id: string) => {
    const updatedRecipients = recipients.filter(r => r.id !== id);
    onRecipientsChange(updatedRecipients);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Report Recipients</CardTitle>
        <CardDescription>Manage recipients for automated reports</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Current Recipients</h3>
          
          {recipients.length === 0 ? (
            <p className="text-center py-4 text-gray-500">
              No recipients added yet. Add recipients below.
            </p>
          ) : (
            <div className="space-y-2">
              {recipients.map(recipient => (
                <div 
                  key={recipient.id} 
                  className="flex items-center justify-between p-3 border rounded-md"
                >
                  {isEditing === recipient.id ? (
                    <div className="w-full space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label htmlFor={`edit-name-${recipient.id}`}>Name</Label>
                          <Input 
                            id={`edit-name-${recipient.id}`}
                            value={editedRecipient?.name || ''}
                            onChange={(e) => setEditedRecipient(prev => 
                              prev ? { ...prev, name: e.target.value } : null
                            )}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`edit-email-${recipient.id}`}>Email</Label>
                          <Input 
                            id={`edit-email-${recipient.id}`}
                            value={editedRecipient?.email || ''}
                            onChange={(e) => setEditedRecipient(prev => 
                              prev ? { ...prev, email: e.target.value } : null
                            )}
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor={`edit-role-${recipient.id}`}>Role</Label>
                        <Select 
                          value={editedRecipient?.role || 'Other'}
                          onValueChange={(value) => setEditedRecipient(prev => 
                            prev ? { ...prev, role: value } : null
                          )}
                        >
                          <SelectTrigger id={`edit-role-${recipient.id}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="CEO">CEO</SelectItem>
                            <SelectItem value="Project Manager">Project Manager</SelectItem>
                            <SelectItem value="Team Lead">Team Lead</SelectItem>
                            <SelectItem value="Developer">Developer</SelectItem>
                            <SelectItem value="Designer">Designer</SelectItem>
                            <SelectItem value="QA">QA</SelectItem>
                            <SelectItem value="Stakeholder">Stakeholder</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex justify-end space-x-2 pt-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={handleCancelEdit}
                        >
                          Cancel
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={handleSaveEdit}
                        >
                          Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div>
                        <div className="font-medium">{recipient.name}</div>
                        <div className="text-sm text-gray-500">{recipient.email}</div>
                        <div className="text-xs text-gray-400">Role: {recipient.role}</div>
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleEditRecipient(recipient)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteRecipient(recipient.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
          
          <div className="pt-4">
            <h3 className="text-lg font-medium mb-2">Add New Recipient</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="new-name">Name</Label>
                  <Input 
                    id="new-name"
                    value={newRecipient.name}
                    onChange={(e) => setNewRecipient(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <Label htmlFor="new-email">Email</Label>
                  <Input 
                    id="new-email"
                    value={newRecipient.email}
                    onChange={(e) => setNewRecipient(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="john@example.com"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="new-role">Role</Label>
                <Select 
                  value={newRecipient.role}
                  onValueChange={(value) => setNewRecipient(prev => ({ ...prev, role: value }))}
                >
                  <SelectTrigger id="new-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CEO">CEO</SelectItem>
                    <SelectItem value="Project Manager">Project Manager</SelectItem>
                    <SelectItem value="Team Lead">Team Lead</SelectItem>
                    <SelectItem value="Developer">Developer</SelectItem>
                    <SelectItem value="Designer">Designer</SelectItem>
                    <SelectItem value="QA">QA</SelectItem>
                    <SelectItem value="Stakeholder">Stakeholder</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {error && (
                <Alert variant="destructive" className="mt-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="pt-2">
                <Button 
                  onClick={handleAddRecipient}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Recipient
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReportRecipients;
