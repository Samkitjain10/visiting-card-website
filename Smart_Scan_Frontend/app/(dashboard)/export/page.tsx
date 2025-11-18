'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Download, Loader, AlertCircle } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import toast from 'react-hot-toast';

export default function ExportPage() {
  const [exporting, setExporting] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unsent' | 'sent'>('unsent');
  const [unsentCount, setUnsentCount] = useState<number | null>(null);
  const [loadingCount, setLoadingCount] = useState(true);

  // Fetch unsent contacts count
  useEffect(() => {
    const fetchUnsentCount = async () => {
      try {
        const data = await apiClient.get('/api/contacts?sent=false&limit=1');
        setUnsentCount(data.total || 0);
      } catch (error) {
        console.error('Error fetching unsent count:', error);
      } finally {
        setLoadingCount(false);
      }
    };

    fetchUnsentCount();
  }, []);

  const handleExport = async () => {
    // Check if unsent filter is selected and there are no unsent contacts
    if (filter === 'unsent' && unsentCount !== null && unsentCount === 0) {
      toast.error('All contacts are already sent. Please select a different option.');
      return;
    }

    setExporting(true);
    try {
      await apiClient.download(`/api/export?filter=${filter}`, `contacts_${Date.now()}.vcf`);
      toast.success('Contacts exported successfully!');
      
      // Refresh unsent count after export
      if (filter === 'unsent' || filter === 'all') {
        const countData = await apiClient.get('/api/contacts?sent=false&limit=1');
        setUnsentCount(countData.total || 0);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to export contacts');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="py-4 sm:py-6 space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 mb-1">Export Contacts</h1>
        <p className="text-xs sm:text-sm text-gray-500">
          Export your contacts as a VCF file that can be imported into your phone or email client.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Export Options</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select contacts to export:
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="filter"
                  value="unsent"
                  checked={filter === 'unsent'}
                  onChange={(e) => setFilter(e.target.value as any)}
                  className="mr-2"
                />
                <span>Unsent contacts only (will be marked as sent after export)</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="filter"
                  value="all"
                  checked={filter === 'all'}
                  onChange={(e) => setFilter(e.target.value as any)}
                  className="mr-2"
                />
                <span>All contacts (will mark unsent as sent)</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="filter"
                  value="sent"
                  checked={filter === 'sent'}
                  onChange={(e) => setFilter(e.target.value as any)}
                  className="mr-2"
                />
                <span>Sent contacts only</span>
              </label>
            </div>
          </div>

          {/* Error message for unsent filter when no unsent contacts */}
          {filter === 'unsent' && !loadingCount && unsentCount !== null && unsentCount === 0 && (
            <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs sm:text-sm font-medium text-yellow-900 mb-1">
                  All contacts are already sent
                </p>
                <p className="text-xs text-yellow-700">
                  Please select "All contacts" or "Sent contacts only" to export.
                </p>
              </div>
            </div>
          )}

          <Button
            variant="primary"
            size="lg"
            onClick={handleExport}
            disabled={exporting || (filter === 'unsent' && unsentCount === 0)}
            isLoading={exporting}
            className="w-full"
          >
            <Download className="w-5 h-5 mr-2" />
            Export as VCF
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>About VCF Files</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-600">
          <p>• VCF (vCard) is a standard format for contact information</p>
          <p>• Can be imported into Google Contacts, Apple Contacts, Outlook, and most email clients</p>
          <p>• On mobile: Open the VCF file and it will prompt you to add contacts</p>
          <p>• On desktop: Import the VCF file through your contact management application</p>
        </CardContent>
      </Card>
    </div>
  );
}

