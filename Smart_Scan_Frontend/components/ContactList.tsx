'use client';

import React, { useEffect, useState } from 'react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from './ui/Table';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Modal } from './ui/Modal';
import { ContactForm } from './ContactForm';
import { Search, Edit, Trash2, CheckCircle, XCircle, ChevronDown, ChevronUp, Phone, Mail, Globe, FileText, Building2, LayoutGrid, List, AlertTriangle, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { apiClient } from '@/lib/api-client';
import toast from 'react-hot-toast';

interface Contact {
  id: string;
  companyName: string;
  phone1: string | null;
  phone2: string | null;
  phone3: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  note: string | null;
  sent: boolean;
  createdAt: string;
}

export function ContactList() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterSent, setFilterSent] = useState<string>('');
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; companyName: string } | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const limit = viewMode === 'table' ? 25 : 24;
      const offset = (currentPage - 1) * limit;
      
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (filterSent) params.append('sent', filterSent);
      params.append('limit', limit.toString());
      params.append('offset', offset.toString());

      const data = await apiClient.get(`/api/contacts?${params.toString()}`);
      setContacts(data.contacts || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      toast.error('Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1); // Reset to page 1 when search/filter/viewMode changes
  }, [search, filterSent, viewMode]);

  useEffect(() => {
    fetchContacts();
  }, [search, filterSent, currentPage, viewMode]);

  const handleDeleteClick = (contact: Contact) => {
    setDeleteConfirm({ id: contact.id, companyName: contact.companyName });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;

    try {
      await apiClient.delete(`/api/contacts/${deleteConfirm.id}`);
      toast.success('Contact deleted successfully');
      setDeleteConfirm(null);
      
      // Refetch contacts - if current page becomes empty, pagination will handle it
      const limit = viewMode === 'table' ? 25 : 24;
      const newTotal = total - 1;
      const totalPages = Math.ceil(newTotal / limit);
      
      // If we're on a page that will be empty after deletion, go to previous page
      if (currentPage > totalPages && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      } else {
        fetchContacts();
      }
    } catch (error) {
      toast.error('Failed to delete contact');
      setDeleteConfirm(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirm(null);
  };

  const handleEdit = (contact: Contact) => {
    setEditingContact(contact);
    setIsModalOpen(true);
  };

  const handleSave = () => {
    setIsModalOpen(false);
    setEditingContact(null);
    fetchContacts();
  };

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 dark:border-primary-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Search contacts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="flex items-center gap-3">
          <select
            value={filterSent}
            onChange={(e) => setFilterSent(e.target.value)}
            className="px-4 py-2.5 border border-gray-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100"
          >
            <option value="">All Contacts</option>
            <option value="false">Unsent</option>
            <option value="true">Sent</option>
          </select>
          <div className="flex items-center gap-1 border border-gray-300 dark:border-slate-700 rounded-xl overflow-hidden">
            <button
              onClick={() => setViewMode('table')}
              className={`p-2.5 transition-colors ${
                viewMode === 'table'
                  ? 'bg-primary-600 dark:bg-primary-500 text-white'
                  : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700'
              }`}
              aria-label="Table view"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('card')}
              className={`p-2.5 transition-colors ${
                viewMode === 'card'
                  ? 'bg-primary-600 dark:bg-primary-500 text-white'
                  : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700'
              }`}
              aria-label="Card view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {contacts.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
          <p className="text-gray-500">No contacts found</p>
        </div>
      ) : viewMode === 'table' ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden w-full">
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full align-middle">
              <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4">Company</TableHead>
              <TableHead className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4">Phone</TableHead>
              <TableHead className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4">Status</TableHead>
              <TableHead className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4">Date</TableHead>
              <TableHead className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contacts.map((contact) => {
                const isExpanded = expandedRows.has(contact.id);
                
                return (
                  <React.Fragment key={contact.id}>
                    <TableRow className="hover:bg-gray-50">
                      <TableCell className="font-medium px-3 sm:px-4 lg:px-6 py-3 sm:py-4 max-w-xs">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleRow(contact.id)}
                            className="text-gray-400 hover:text-gray-600 transition-colors p-1 flex-shrink-0"
                            aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                          <span className="truncate">{contact.companyName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 max-w-xs">
                        {contact.phone1 ? (
                          <div>
                            <a
                              href={`tel:${contact.phone1}`}
                              className="text-slate-900 hover:text-primary-600"
                            >
                              {contact.phone1}
                            </a>
                            {contact.phone2 && (
                              <div className="text-xs text-gray-500">
                                <a
                                  href={`tel:${contact.phone2}`}
                                  className="hover:text-primary-600"
                                >
                                  {contact.phone2}
                                </a>
                              </div>
                            )}
                            {contact.phone3 && (
                              <div className="text-xs text-gray-500">
                                <a
                                  href={`tel:${contact.phone3}`}
                                  className="hover:text-primary-600"
                                >
                                  {contact.phone3}
                                </a>
                              </div>
                            )}
                          </div>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
                        {contact.sent ? (
                          <span className="flex items-center text-green-600">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Sent
                          </span>
                        ) : (
                          <span className="flex items-center text-yellow-600">
                            <XCircle className="w-4 h-4 mr-1" />
                            Unsent
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500 px-6 py-4">
                        {formatDate(contact.createdAt)}
                      </TableCell>
                      <TableCell className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(contact)}
                            aria-label="Edit contact"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(contact)}
                            aria-label="Delete contact"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {isExpanded && (
                          <TableRow className="bg-gray-50">
                            <TableCell colSpan={5} className="px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Company Name */}
                            {contact.companyName && (
                              <div className="flex items-start gap-3">
                                <Building2 className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                                    Company Name
                                  </p>
                                  <p className="text-sm font-semibold text-slate-900">
                                    {contact.companyName}
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* Email */}
                            {contact.email && (
                              <div className="flex items-start gap-3">
                                <Mail className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                                    Email
                                  </p>
                                  <a
                                    href={`mailto:${contact.email}`}
                                    className="text-sm text-primary-600 hover:text-primary-700 hover:underline break-all"
                                  >
                                    {contact.email}
                                  </a>
                                </div>
                              </div>
                            )}

                            {/* Phone 1 */}
                            {contact.phone1 && (
                              <div className="flex items-start gap-3">
                                <Phone className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                                    Phone 1
                                  </p>
                                  <a
                                    href={`tel:${contact.phone1}`}
                                    className="text-sm text-slate-900 hover:text-primary-600"
                                  >
                                    {contact.phone1}
                                  </a>
                                </div>
                              </div>
                            )}

                            {/* Phone 2 */}
                            {contact.phone2 && (
                              <div className="flex items-start gap-3">
                                <Phone className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                                    Phone 2
                                  </p>
                                  <a
                                    href={`tel:${contact.phone2}`}
                                    className="text-sm text-slate-900 hover:text-primary-600"
                                  >
                                    {contact.phone2}
                                  </a>
                                </div>
                              </div>
                            )}

                            {/* Phone 3 */}
                            {contact.phone3 && (
                              <div className="flex items-start gap-3">
                                <Phone className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                                    Phone 3
                                  </p>
                                  <a
                                    href={`tel:${contact.phone3}`}
                                    className="text-sm text-slate-900 hover:text-primary-600"
                                  >
                                    {contact.phone3}
                                  </a>
                                </div>
                              </div>
                            )}

                            {/* Website */}
                            {contact.website && (
                              <div className="flex items-start gap-3">
                                <Globe className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                                    Website
                                  </p>
                                  <a
                                    href={contact.website.startsWith('http') ? contact.website : `https://${contact.website}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-primary-600 hover:text-primary-700 hover:underline break-all"
                                  >
                                    {contact.website}
                                  </a>
                                </div>
                              </div>
                            )}

                            {/* Address */}
                            {contact.address && (
                              <div className="flex items-start gap-3">
                                <MapPin className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                                    Address
                                  </p>
                                  <p className="text-sm text-slate-900 whitespace-pre-wrap">
                                    {contact.address}
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* Status */}
                            <div className="flex items-start gap-3">
                              <div className="w-5 h-5 mt-0.5 flex-shrink-0 flex items-center justify-center">
                                {contact.sent ? (
                                  <CheckCircle className="w-5 h-5 text-green-600" />
                                ) : (
                                  <XCircle className="w-5 h-5 text-yellow-600" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                                  Status
                                </p>
                                <p className={`text-sm font-semibold ${contact.sent ? 'text-green-600' : 'text-yellow-600'}`}>
                                  {contact.sent ? 'Sent' : 'Unsent'}
                                </p>
                              </div>
                            </div>

                            {/* Date Created */}
                            <div className="flex items-start gap-3">
                              <div className="w-5 h-5 mt-0.5 flex-shrink-0"></div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                                  Date Added
                                </p>
                                <p className="text-sm text-slate-900">
                                  {formatDate(contact.createdAt)}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Note */}
                          {contact.note && (
                            <div className="flex items-start gap-3 mt-6 pt-6 border-t border-gray-200">
                              <FileText className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                                  Notes
                                </p>
                                <p className="text-sm text-slate-900 whitespace-pre-wrap">
                                  {contact.note}
                                </p>
                              </div>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })}
          </TableBody>
        </Table>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {contacts.map((contact) => {
            return (
              <div
                key={contact.id}
                className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-slate-900 mb-1 truncate">
                        {contact.companyName}
                      </h3>
                      <div className="flex items-center gap-2">
                        {contact.sent ? (
                          <span className="inline-flex items-center text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Sent
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-xs font-medium text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full">
                            <XCircle className="w-3 h-3 mr-1" />
                            Unsent
                          </span>
                        )}
                        <span className="text-xs text-gray-500">
                          {formatDate(contact.createdAt)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(contact)}
                        className="p-1.5"
                        aria-label="Edit contact"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(contact)}
                        className="p-1.5"
                        aria-label="Delete contact"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {contact.phone1 && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <a
                          href={`tel:${contact.phone1}`}
                          className="text-slate-900 hover:text-primary-600 truncate"
                        >
                          {contact.phone1}
                        </a>
                      </div>
                    )}
                    {contact.phone2 && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <a
                          href={`tel:${contact.phone2}`}
                          className="hover:text-primary-600 truncate"
                        >
                          {contact.phone2}
                        </a>
                      </div>
                    )}
                    {contact.phone3 && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <a
                          href={`tel:${contact.phone3}`}
                          className="hover:text-primary-600 truncate"
                        >
                          {contact.phone3}
                        </a>
                      </div>
                    )}
                    {contact.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <a
                          href={`mailto:${contact.email}`}
                          className="text-primary-600 hover:text-primary-700 hover:underline truncate"
                        >
                          {contact.email}
                        </a>
                      </div>
                    )}
                    {contact.website && (
                      <div className="flex items-center gap-2 text-sm">
                        <Globe className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <a
                          href={contact.website.startsWith('http') ? contact.website : `https://${contact.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:text-primary-700 hover:underline truncate"
                        >
                          {contact.website}
                        </a>
                      </div>
                    )}
                    {contact.address && (
                      <div className="flex items-start gap-2 text-sm pt-2 border-t border-gray-100">
                        <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                        <p className="text-gray-600 flex-1 min-w-0 line-clamp-3">
                          {contact.address}
                        </p>
                      </div>
                    )}
                    {contact.note && (
                      <div className="flex items-start gap-2 text-sm pt-2 border-t border-gray-100">
                        <FileText className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                        <p className="text-gray-600 flex-1 min-w-0 line-clamp-2">
                          {contact.note}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {total > 0 && (() => {
        const limit = viewMode === 'table' ? 25 : 24;
        const totalPages = Math.ceil(total / limit);
        const startItem = (currentPage - 1) * limit + 1;
        const endItem = Math.min(currentPage * limit, total);

        return (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white rounded-xl border border-gray-200 shadow-sm px-4 sm:px-6 py-4">
            <div className="text-sm text-gray-600">
              Showing <span className="font-medium text-slate-900">{startItem}</span> to{' '}
              <span className="font-medium text-slate-900">{endItem}</span> of{' '}
              <span className="font-medium text-slate-900">{total}</span> contacts
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1 || loading}
                aria-label="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      disabled={loading}
                      className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                        currentPage === pageNum
                          ? 'bg-primary-600 text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                      aria-label={`Go to page ${pageNum}`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages || loading}
                aria-label="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        );
      })()}

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingContact(null);
        }}
        title="Edit Contact"
        size="md"
      >
        {editingContact && (
          <ContactForm
            contact={editingContact}
            onSave={handleSave}
            onCancel={() => {
              setIsModalOpen(false);
              setEditingContact(null);
            }}
          />
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={handleDeleteCancel}
        title="Delete Contact"
        size="md"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-900 mb-1">
                Are you sure you want to delete this contact?
              </p>
              <p className="text-xs text-red-700">
                This action cannot be undone. The contact <span className="font-semibold">"{deleteConfirm?.companyName}"</span> will be permanently deleted.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={handleDeleteCancel}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteConfirm}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Contact
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

