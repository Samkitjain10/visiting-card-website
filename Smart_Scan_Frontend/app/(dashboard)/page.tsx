'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { DashboardStats } from '@/components/DashboardStats';
import { AnalyticsDashboard } from '@/components/AnalyticsDashboard';
import { ActivityLog } from '@/components/ActivityLog';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/lib/utils';
import { apiClient } from '@/lib/api-client';
import {
  Upload,
  ArrowRight,
  Inbox,
  Sparkles,
  Share2,
} from 'lucide-react';

interface Contact {
  id: string;
  companyName: string;
  phone1: string | null;
  email: string | null;
  createdAt: string;
}

export default function DashboardPage() {
  const [recentContacts, setRecentContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/api/contacts?limit=5')
      .then((data) => {
        setRecentContacts(data.contacts || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching contacts:', err);
        setLoading(false);
      });
  }, []);

  const workflowSteps = [
    {
      title: 'Upload smartly',
      description: 'Drop your visiting cards and let AI extract details instantly.',
      icon: Upload,
      accent: 'text-primary-600 bg-primary-50',
      href: '/upload',
    },
    {
      title: 'Review insights',
      description: 'Verify and enrich contacts with notes, tags, and reminders.',
      icon: Sparkles,
      accent: 'text-purple-600 bg-purple-50',
      href: '/contacts',
    },
    {
      title: 'Share seamlessly',
      description: 'Send cards in a click or export to your CRM or phone.',
      icon: Share2,
      accent: 'text-emerald-600 bg-emerald-50',
      href: '/export',
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6 py-4 sm:py-6">
      {/* First Row: 4 Detail Cards */}
      <div className="w-full">
        <DashboardStats />
      </div>

      {/* Analytics Dashboard */}
      <div className="w-full">
        <AnalyticsDashboard />
      </div>

      {/* Second Row: 2 Equal-Sized Boxes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Smart Workflow Card */}
        <div className="p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm bg-white dark:bg-slate-800 flex flex-col">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-5">
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100">Smart Workflow</h3>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                Automate the lifecycle of every visiting card you capture.
              </p>
            </div>
            <span className="inline-flex items-center text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 sm:px-3 py-1 rounded-full whitespace-nowrap">
              Live pipeline
            </span>
          </div>
          <div className="space-y-3 flex-1">
            {workflowSteps.map((step) => {
              const Icon = step.icon;
              return (
                <Link
                  key={step.title}
                  href={step.href}
                  className="block p-4 rounded-xl bg-gray-50 dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors duration-200 cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${step.accent}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm">{step.title}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{step.description}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400 dark:text-gray-500 flex-shrink-0 mt-1" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Recent Contacts Card */}
        <div className="p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm bg-white dark:bg-slate-800 flex flex-col">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 mb-4 sm:mb-5">
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100">Recent Contacts</h3>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">Last 5 cards you've added</p>
            </div>
            <Link
              href="/contacts"
              className="text-xs sm:text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors whitespace-nowrap"
            >
              View all →
            </Link>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse rounded-xl border border-gray-100 dark:border-slate-700 p-4">
                    <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-2/3 mb-2" />
                    <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : recentContacts.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-8">
                <Inbox className="h-10 w-10 text-gray-300 dark:text-gray-600 mb-3" />
                <p className="font-medium text-slate-900 dark:text-slate-100 text-sm mb-1">No contacts yet</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Upload your first visiting card to populate this space.</p>
                <Link href="/upload">
                  <Button variant="primary" className="flex items-center gap-2 rounded-xl text-sm px-4 py-2">
                    <Upload className="h-4 w-4" />
                    Upload Card
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentContacts.map((contact) => (
                  <Link
                    key={contact.id}
                    href={`/contacts/${contact.id}`}
                    className="block rounded-xl border border-gray-100 dark:border-slate-700 p-4 hover:border-primary-200 dark:hover:border-primary-700 hover:bg-primary-50/50 dark:hover:bg-primary-900/20 transition-all duration-200"
                  >
                    <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm">{contact.companyName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {contact.phone1 ? `📞 ${contact.phone1}` : 'No phone added'}
                      {contact.email ? ` · 📧 ${contact.email}` : ''}
                    </p>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">{formatDate(contact.createdAt)}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Activity Log */}
      <div className="w-full">
        <ActivityLog />
      </div>
    </div>
  );
}
