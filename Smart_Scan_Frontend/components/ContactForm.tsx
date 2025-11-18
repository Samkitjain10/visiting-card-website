'use client';

import { useState, useEffect } from 'react';
import { Input, Textarea } from './ui/Input';
import { Button } from './ui/Button';
import { apiClient } from '@/lib/api-client';
import toast from 'react-hot-toast';

interface Contact {
  id?: string;
  companyName: string;
  phone1: string | null;
  phone2: string | null;
  phone3: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  note: string | null;
  sent?: boolean;
}

interface ContactFormProps {
  contact?: Contact | null;
  onSave: () => void;
  onCancel: () => void;
}

export function ContactForm({ contact, onSave, onCancel }: ContactFormProps) {
  const [formData, setFormData] = useState({
    companyName: '',
    phone1: '',
    phone2: '',
    phone3: '',
    email: '',
    website: '',
    address: '',
    note: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (contact) {
      setFormData({
        companyName: contact.companyName || '',
        phone1: contact.phone1 || '',
        phone2: contact.phone2 || '',
        phone3: contact.phone3 || '',
        email: contact.email || '',
        website: contact.website || '',
        address: contact.address || '',
        note: contact.note || '',
      });
    }
  }, [contact]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (contact?.id) {
        await apiClient.put(`/api/contacts/${contact.id}`, formData);
      } else {
        await apiClient.post('/api/contacts', formData);
      }

      toast.success(contact?.id ? 'Contact updated' : 'Contact created');
      onSave();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save contact');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Company Name"
        value={formData.companyName}
        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
        required
      />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Input
          label="Phone 1"
          type="tel"
          value={formData.phone1}
          onChange={(e) => setFormData({ ...formData, phone1: e.target.value })}
        />
        <Input
          label="Phone 2"
          type="tel"
          value={formData.phone2}
          onChange={(e) => setFormData({ ...formData, phone2: e.target.value })}
        />
        <Input
          label="Phone 3"
          type="tel"
          value={formData.phone3}
          onChange={(e) => setFormData({ ...formData, phone3: e.target.value })}
        />
      </div>
      <Input
        label="Email"
        type="email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
      />
      <Input
        label="Website"
        type="url"
        value={formData.website}
        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
      />
      <Textarea
        label="Address"
        rows={3}
        value={formData.address}
        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
        placeholder="Street, City, State, Zip Code"
      />
      <Textarea
        label="Note"
        rows={3}
        value={formData.note}
        onChange={(e) => setFormData({ ...formData, note: e.target.value })}
      />
      <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="w-full sm:w-auto">
          Cancel
        </Button>
        <Button type="submit" variant="primary" isLoading={saving} className="w-full sm:w-auto">
          {contact?.id ? 'Update' : 'Create'} Contact
        </Button>
      </div>
    </form>
  );
}

