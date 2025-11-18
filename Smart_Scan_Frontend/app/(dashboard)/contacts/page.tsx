'use client';

import { ContactList } from '@/components/ContactList';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ContactForm } from '@/components/ContactForm';
import { Plus } from 'lucide-react';
import { useState } from 'react';

export default function ContactsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="py-4 sm:py-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 mb-1">Contacts</h1>
          <p className="text-xs sm:text-sm text-gray-500">Manage your extracted contacts</p>
        </div>
        <Button
          variant="primary"
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto whitespace-nowrap px-4 sm:px-6"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Contact
        </Button>
      </div>

      <ContactList />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Contact"
        size="md"
      >
        <ContactForm
          onSave={() => {
            setIsModalOpen(false);
            window.location.reload();
          }}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
}

