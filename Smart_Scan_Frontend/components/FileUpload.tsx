'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from './ui/Button';
import { Card, CardContent } from './ui/Card';
import { Textarea } from './ui/Input';
import { Upload, X, CheckCircle, Loader, ChevronDown, ChevronUp, Phone, Mail, Globe, FileText, Building2, Save, MapPin, AlertTriangle } from 'lucide-react';
import { Modal } from './ui/Modal';
import { apiClient } from '@/lib/api-client';
import toast from 'react-hot-toast';

type UploadMode = 'single' | 'both' | 'multiple';

interface ExtractedContact {
  id?: string;
  companyName: string;
  phone1: string | null;
  phone2: string | null;
  phone3: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  note: string | null;
  rawText: string | null;
}

export function FileUpload() {
  const [uploadMode, setUploadMode] = useState<UploadMode>('single');
  const [files, setFiles] = useState<File[]>([]);
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [extractedContacts, setExtractedContacts] = useState<ExtractedContact[]>([]);
  const [processingIndex, setProcessingIndex] = useState<number | null>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [processingBothSide, setProcessingBothSide] = useState(false);
  const [editingNotes, setEditingNotes] = useState<{ [key: number]: string }>({});
  const [savingNote, setSavingNote] = useState<number | null>(null);
  const [duplicateInfo, setDuplicateInfo] = useState<{
    index: number;
    existing: ExtractedContact;
    new: ExtractedContact;
  } | null>(null);

  const uploadFile = async (file: File, index: number) => {
    setProcessingIndex(index);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('mode', 'single');

    try {
      const data = await apiClient.post('/api/upload', formData);
      
      // Check for duplicate
      if (data.duplicate && data.existingContact) {
        setDuplicateInfo({
          index,
          existing: data.existingContact,
          new: data.newContact,
        });
        setProcessingIndex(null);
        return;
      }

      if (!data.contact) {
        throw new Error('No contact data received from server');
      }

      setExtractedContacts((prev) => {
        const newContacts = [...prev];
        newContacts[index] = data.contact;
        return newContacts;
      });
      setExpandedIndex(index); // Expand by default
      toast.success('Contact extracted successfully!');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to extract contact');
    } finally {
      setProcessingIndex(null);
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (uploadMode === 'single') {
      if (acceptedFiles.length > 1) {
        toast.error('Please upload only 1 image for single side');
        return;
      }
      const file = acceptedFiles[0];
      setFiles([file]);
      // Auto-process single file
      setTimeout(() => {
        uploadFile(file, 0);
      }, 100);
    } else if (uploadMode === 'both') {
      if (acceptedFiles.length > 2) {
        toast.error('Please upload only 2 images (front and back)');
        return;
      }
      if (acceptedFiles.length === 1) {
        if (!frontFile) {
          setFrontFile(acceptedFiles[0]);
          toast.success('Front side uploaded. Please upload the back side.');
        } else {
          setBackFile(acceptedFiles[0]);
          toast.success('Back side uploaded.');
        }
      } else {
        setFrontFile(acceptedFiles[0]);
        setBackFile(acceptedFiles[1]);
        toast.success('Both sides uploaded.');
      }
    } else {
      // multiple mode
    setFiles((prev) => [...prev, ...acceptedFiles]);
    }
  }, [uploadMode, frontFile, uploadFile]);

  const maxFiles = uploadMode === 'single' ? 1 : uploadMode === 'both' ? 2 : undefined;
  const maxSize = 10 * 1024 * 1024; // 10MB

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
    },
    maxSize,
    maxFiles: maxFiles,
    multiple: uploadMode !== 'single',
  });

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setExtractedContacts((prev) => prev.filter((_, i) => i !== index));
  };

  const removeFrontFile = () => {
    setFrontFile(null);
    setExtractedContacts([]);
  };

  const removeBackFile = () => {
    setBackFile(null);
    setExtractedContacts([]);
  };

  const handleModeChange = (mode: UploadMode) => {
    setUploadMode(mode);
    setFiles([]);
    setFrontFile(null);
    setBackFile(null);
    setExtractedContacts([]);
    setExpandedIndex(null);
  };

  const uploadBothSides = async () => {
    if (!frontFile || !backFile) {
      toast.error('Please upload both front and back sides');
      return;
    }

    setProcessingBothSide(true);
    const formData = new FormData();
    formData.append('frontFile', frontFile);
    formData.append('backFile', backFile);
    formData.append('mode', 'both');

    try {
      const data = await apiClient.post('/api/upload', formData);
      
      // Check for duplicate
      if (data.duplicate && data.existingContact) {
        setDuplicateInfo({
          index: 0,
                existing: data.existingContact,
                new: data.newContact,
              });
              setProcessingBothSide(false);
              return;
            }

      if (!data.contact) {
        throw new Error('No contact data received from server');
      }

      setExtractedContacts([data.contact]);
      setExpandedIndex(0); // Expand by default
      toast.success('Contact extracted successfully from both sides!');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to extract contact');
    } finally {
      setProcessingBothSide(false);
    }
  };

  const uploadAll = async () => {
    if (files.length === 0) return;

    setUploading(true);
    for (let i = 0; i < files.length; i++) {
      if (!extractedContacts[i]) {
        await uploadFile(files[i], i);
      }
    }
    setUploading(false);
    toast.success('All contacts processed!');
  };

  const saveNote = async (contactId: string, index: number) => {
    if (!contactId) {
      toast.error('Contact ID is required');
      return;
    }

    const note = editingNotes[index] || '';
    setSavingNote(index);

    try {
      const data = await apiClient.put(`/api/contacts/${contactId}`, { note });
      setExtractedContacts((prev) => {
        const newContacts = [...prev];
        if (newContacts[index]) {
          newContacts[index] = { ...newContacts[index], note: data.contact.note };
        }
        return newContacts;
      });
      setEditingNotes((prev) => {
        const newNotes = { ...prev };
        delete newNotes[index];
        return newNotes;
      });
      toast.success('Note saved successfully!');
    } catch (error: any) {
      console.error('Save note error:', error);
      toast.error(error.message || 'Failed to save note');
    } finally {
      setSavingNote(null);
    }
  };

  const handleReplaceContact = async () => {
    if (!duplicateInfo) return;

    const { existing, new: newContact } = duplicateInfo;
    
    try {
      const data = await apiClient.put(`/api/contacts/${existing.id}`, {
        companyName: newContact.companyName,
        phone1: newContact.phone1,
        phone2: newContact.phone2,
        phone3: newContact.phone3,
        email: newContact.email,
        website: newContact.website,
        address: newContact.address,
        rawText: newContact.rawText,
      });
      
      // Update the extracted contacts
      if (uploadMode === 'both') {
        setExtractedContacts([data.contact]);
        setExpandedIndex(0); // Expand by default
      } else {
        setExtractedContacts((prev) => {
          const newContacts = [...prev];
          newContacts[duplicateInfo.index] = data.contact;
          return newContacts;
        });
        setExpandedIndex(duplicateInfo.index); // Expand by default
      }

      setDuplicateInfo(null);
      toast.success('Contact replaced successfully!');
    } catch (error: any) {
      console.error('Replace error:', error);
      toast.error(error.message || 'Failed to replace contact');
    }
  };

  const handleCancelDuplicate = () => {
    const info = duplicateInfo;
    setDuplicateInfo(null);
    // Remove the file from the list
    if (info) {
      if (uploadMode === 'both') {
        setFrontFile(null);
        setBackFile(null);
        setExtractedContacts([]);
      } else {
        removeFile(info.index);
      }
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
                {/* Tabs */}
                <div className="flex items-center gap-1 sm:gap-2 mb-4 sm:mb-6 border-b border-gray-200 overflow-x-auto">
                  <button
                    onClick={() => handleModeChange('single')}
                    className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-colors border-b-2 whitespace-nowrap flex-shrink-0 ${
                      uploadMode === 'single'
                        ? 'border-primary-600 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Single Side
                  </button>
                  <button
                    onClick={() => handleModeChange('both')}
                    className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-colors border-b-2 whitespace-nowrap flex-shrink-0 ${
                      uploadMode === 'both'
                        ? 'border-primary-600 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Both Side
                  </button>
                  <button
                    onClick={() => handleModeChange('multiple')}
                    className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-colors border-b-2 whitespace-nowrap flex-shrink-0 ${
                      uploadMode === 'multiple'
                        ? 'border-primary-600 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Multiple Cards
                  </button>
                </div>

                {/* Upload Area */}
          <div
            {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-6 sm:p-8 lg:p-12 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-300 hover:border-primary-400'
            }`}
          >
            <input {...getInputProps()} />
                  <Upload className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 mx-auto text-gray-400 mb-3 sm:mb-4" />
            {isDragActive ? (
                    <p className="text-sm sm:text-base text-primary-600">Drop the files here...</p>
            ) : (
              <>
                      <p className="text-sm sm:text-base text-gray-600 mb-2">
                        {uploadMode === 'single'
                          ? 'Drag & drop 1 visiting card image here, or click to select'
                          : uploadMode === 'both'
                          ? 'Drag & drop 2 images (front and back) here, or click to select'
                          : 'Drag & drop visiting card images here, or click to select'}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-400">
                  Supports: JPEG, PNG, GIF, WebP (max 10MB)
                </p>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Both Side Mode Display */}
      {(frontFile || backFile) && uploadMode === 'both' && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Both Side Upload</h3>
              <Button
                variant="primary"
                onClick={uploadBothSides}
                disabled={processingBothSide || !frontFile || !backFile}
                isLoading={processingBothSide}
              >
                Process Both Sides
              </Button>
            </div>
            <div className="space-y-3">
              {frontFile && (
                <div className="border border-gray-200 rounded-xl overflow-hidden bg-white p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className="flex-shrink-0">
                        <div className="w-5 h-5 border-2 border-gray-300 rounded"></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {frontFile.name} <span className="text-gray-500">(Front Side)</span>
                        </p>
                        <p className="text-xs text-gray-500">
                          {(frontFile.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={removeFrontFile}
                      className="text-gray-400 hover:text-red-600 transition-colors p-1"
                      aria-label="Remove front file"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
              {backFile && (
                <div className="border border-gray-200 rounded-xl overflow-hidden bg-white p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className="flex-shrink-0">
                        <div className="w-5 h-5 border-2 border-gray-300 rounded"></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {backFile.name} <span className="text-gray-500">(Back Side)</span>
                        </p>
                        <p className="text-xs text-gray-500">
                          {(backFile.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={removeBackFile}
                      className="text-gray-400 hover:text-red-600 transition-colors p-1"
                      aria-label="Remove back file"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
            {/* Show extracted contact for both-side mode */}
            {extractedContacts.length > 0 && extractedContacts[0] && (
              <div className="mt-4">
                {(() => {
                  const contact = extractedContacts[0];
                  const isExpanded = expandedIndex === 0;
                  return (
                    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                      <div className="flex items-center justify-between p-4">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">
                              Contact Extracted
                            </p>
                            <p className="text-xs text-gray-500">
                              {contact.companyName || 'Unknown Company'}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => setExpandedIndex(isExpanded ? null : 0)}
                          className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                          aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5" />
                          ) : (
                            <ChevronDown className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                      {isExpanded && (
                        <div className="border-t border-gray-100 bg-gray-50 p-5 space-y-4">
                          {/* Same expanded contact details as before */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          </div>

                          {/* Notes Section */}
                          <div className="flex items-start gap-3 pt-2 border-t border-gray-200">
                            <FileText className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                                Notes
                              </p>
                              {editingNotes[0] !== undefined ? (
                                <div className="space-y-2">
                                  <Textarea
                                    value={editingNotes[0]}
                                    onChange={(e) => setEditingNotes({ ...editingNotes, 0: e.target.value })}
                                    placeholder="Add a note about this contact..."
                                    rows={3}
                                    className="text-sm"
                                  />
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="primary"
                                      size="sm"
                                      onClick={() => contact.id && saveNote(contact.id, 0)}
                                      disabled={savingNote === 0}
                                      isLoading={savingNote === 0}
                                    >
                                      <Save className="w-4 h-4 mr-1" />
                                      Save Note
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setEditingNotes((prev) => {
                                          const newNotes = { ...prev };
                                          delete newNotes[0];
                                          return newNotes;
                                        });
                                      }}
                                      disabled={savingNote === 0}
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div>
                                  {contact.note ? (
                                    <p className="text-sm text-slate-900 whitespace-pre-wrap mb-2">
                                      {contact.note}
                                    </p>
                                  ) : (
                                    <p className="text-sm text-gray-400 italic mb-2">
                                      No notes added yet
                                    </p>
                                  )}
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setEditingNotes({ ...editingNotes, 0: contact.note || '' })}
                                  >
                                    {contact.note ? 'Edit Note' : 'Add Note'}
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Single and Multiple Mode Display */}
      {files.length > 0 && uploadMode !== 'both' && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                Selected Files ({files.length})
              </h3>
              {uploadMode === 'multiple' && (
              <Button
                variant="primary"
                onClick={uploadAll}
                disabled={uploading || processingIndex !== null}
                isLoading={uploading}
              >
                Process All
              </Button>
              )}
            </div>
            <div className="space-y-3">
              {files.map((file, index) => {
                const contact = extractedContacts[index];
                const isExpanded = expandedIndex === index;
                const hasContact = !!contact;
                
                return (
                <div
                  key={index}
                    className="border border-gray-200 rounded-xl overflow-hidden bg-white"
                >
                    {/* Header Row */}
                    <div className="flex items-center justify-between p-4">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className="flex-shrink-0">
                          {hasContact ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : processingIndex === index ? (
                        <Loader className="w-5 h-5 text-primary-600 animate-spin" />
                      ) : (
                        <div className="w-5 h-5 border-2 border-gray-300 rounded"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(file.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                        {hasContact && (
                          <div className="text-sm text-gray-600 flex-shrink-0">
                            <p className="font-semibold text-slate-900">
                              {contact.companyName || 'Unknown Company'}
                            </p>
                            {contact.phone1 && (
                              <p className="text-xs text-gray-500">{contact.phone1}</p>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                        {hasContact && (
                          <button
                            onClick={() => setExpandedIndex(isExpanded ? null : index)}
                            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                            aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-5 h-5" />
                            ) : (
                              <ChevronDown className="w-5 h-5" />
                            )}
                          </button>
                        )}
                        {!hasContact && processingIndex !== index && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => uploadFile(file, index)}
                      >
                        Process
                      </Button>
                    )}
                    <button
                          onClick={() => {
                            removeFile(index);
                            if (expandedIndex === index) setExpandedIndex(null);
                          }}
                          className="text-gray-400 hover:text-red-600 transition-colors p-1"
                          aria-label="Remove file"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                    {/* Expanded Contact Details */}
                    {hasContact && isExpanded && (
                      <div className="border-t border-gray-100 bg-gray-50 p-5 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        </div>

                        {/* Notes Section */}
                        <div className="flex items-start gap-3 pt-2 border-t border-gray-200">
                          <FileText className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                              Notes
                            </p>
                            {editingNotes[index] !== undefined ? (
                              <div className="space-y-2">
                                <Textarea
                                  value={editingNotes[index]}
                                  onChange={(e) => setEditingNotes({ ...editingNotes, [index]: e.target.value })}
                                  placeholder="Add a note about this contact..."
                                  rows={3}
                                  className="text-sm"
                                />
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() => contact.id && saveNote(contact.id, index)}
                                    disabled={savingNote === index}
                                    isLoading={savingNote === index}
                                  >
                                    <Save className="w-4 h-4 mr-1" />
                                    Save Note
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setEditingNotes((prev) => {
                                        const newNotes = { ...prev };
                                        delete newNotes[index];
                                        return newNotes;
                                      });
                                    }}
                                    disabled={savingNote === index}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div>
                                {contact.note ? (
                                  <p className="text-sm text-slate-900 whitespace-pre-wrap mb-2">
                                    {contact.note}
                                  </p>
                                ) : (
                                  <p className="text-sm text-gray-400 italic mb-2">
                                    No notes added yet
                                  </p>
                                )}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setEditingNotes({ ...editingNotes, [index]: contact.note || '' })}
                                >
                                  {contact.note ? 'Edit Note' : 'Add Note'}
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>

                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Duplicate Contact Modal */}
      {duplicateInfo && (
        <Modal
          isOpen={!!duplicateInfo}
          onClose={handleCancelDuplicate}
          title="Duplicate Contact Detected"
          size="lg"
        >
          <div className="space-y-6">
            <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-yellow-900 mb-1">
                  A contact with the same phone number already exists
                </p>
                <p className="text-xs text-yellow-700">
                  You can replace the existing contact with the new information or cancel to keep the existing one.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Existing Contact */}
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Existing Contact
                </h3>
                <div className="space-y-2 text-sm">
                  {duplicateInfo.existing.companyName && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Company</p>
                      <p className="font-medium text-slate-900">{duplicateInfo.existing.companyName}</p>
                    </div>
                  )}
                  {duplicateInfo.existing.phone1 && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Phone</p>
                      <p className="text-slate-900">{duplicateInfo.existing.phone1}</p>
                      {duplicateInfo.existing.phone2 && (
                        <p className="text-slate-900 text-xs">{duplicateInfo.existing.phone2}</p>
                      )}
                      {duplicateInfo.existing.phone3 && (
                        <p className="text-slate-900 text-xs">{duplicateInfo.existing.phone3}</p>
                      )}
                    </div>
                  )}
                  {duplicateInfo.existing.email && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Email</p>
                      <p className="text-slate-900">{duplicateInfo.existing.email}</p>
                    </div>
                  )}
                  {duplicateInfo.existing.website && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Website</p>
                      <p className="text-slate-900">{duplicateInfo.existing.website}</p>
                    </div>
                  )}
                  {duplicateInfo.existing.address && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Address</p>
                      <p className="text-slate-900 text-xs whitespace-pre-wrap">{duplicateInfo.existing.address}</p>
                    </div>
                  )}
                  {duplicateInfo.existing.note && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Note</p>
                      <p className="text-slate-900 text-xs">{duplicateInfo.existing.note}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* New Contact */}
              <div className="border border-primary-200 bg-primary-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-primary-900 mb-3 flex items-center gap-2">
                  <Upload className="w-4 h-4 text-primary-600" />
                  New Contact (from image)
                </h3>
                <div className="space-y-2 text-sm">
                  {duplicateInfo.new.companyName && (
                    <div>
                      <p className="text-xs text-primary-700 uppercase tracking-wide mb-0.5">Company</p>
                      <p className="font-medium text-primary-900">{duplicateInfo.new.companyName}</p>
                    </div>
                  )}
                  {duplicateInfo.new.phone1 && (
                    <div>
                      <p className="text-xs text-primary-700 uppercase tracking-wide mb-0.5">Phone</p>
                      <p className="text-primary-900">{duplicateInfo.new.phone1}</p>
                      {duplicateInfo.new.phone2 && (
                        <p className="text-primary-900 text-xs">{duplicateInfo.new.phone2}</p>
                      )}
                      {duplicateInfo.new.phone3 && (
                        <p className="text-primary-900 text-xs">{duplicateInfo.new.phone3}</p>
                      )}
                    </div>
                  )}
                  {duplicateInfo.new.email && (
                    <div>
                      <p className="text-xs text-primary-700 uppercase tracking-wide mb-0.5">Email</p>
                      <p className="text-primary-900">{duplicateInfo.new.email}</p>
                    </div>
                  )}
                  {duplicateInfo.new.website && (
                    <div>
                      <p className="text-xs text-primary-700 uppercase tracking-wide mb-0.5">Website</p>
                      <p className="text-primary-900">{duplicateInfo.new.website}</p>
                    </div>
                  )}
                  {duplicateInfo.new.address && (
                    <div>
                      <p className="text-xs text-primary-700 uppercase tracking-wide mb-0.5">Address</p>
                      <p className="text-primary-900 text-xs whitespace-pre-wrap">{duplicateInfo.new.address}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={handleCancelDuplicate}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleReplaceContact}
              >
                Replace Existing Contact
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

