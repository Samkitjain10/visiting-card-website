'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { apiClient } from '@/lib/api-client';
import { formatDate } from '@/lib/utils';
import { Activity, Plus, Edit, Trash2, Upload, Download, Loader } from 'lucide-react';

interface Activity {
  id: string;
  action: string;
  description: string | null;
  contactId: string | null;
  contact: {
    id: string;
    companyName: string;
  } | null;
  createdAt: string;
}

export function ActivityLog() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [limit, setLimit] = useState(20);

  useEffect(() => {
    const fetchActivities = async () => {
      setLoading(true);
      try {
        const data = await apiClient.get(`/api/activities?limit=${limit}`);
        setActivities(data.activities || []);
      } catch (error) {
        console.error('Error fetching activities:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [limit]);

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'created':
        return <Plus className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />;
      case 'updated':
        return <Edit className="h-4 w-4 text-blue-600 dark:text-blue-400" />;
      case 'deleted':
        return <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />;
      case 'uploaded':
        return <Upload className="h-4 w-4 text-purple-600 dark:text-purple-400" />;
      case 'exported':
        return <Download className="h-4 w-4 text-orange-600 dark:text-orange-400" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600 dark:text-gray-400" />;
    }
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      created: 'Created',
      updated: 'Updated',
      deleted: 'Deleted',
      uploaded: 'Uploaded',
      exported: 'Exported',
    };
    return labels[action] || action;
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'created':
        return 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800';
      case 'updated':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      case 'deleted':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'uploaded':
        return 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800';
      case 'exported':
        return 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800';
      default:
        return 'bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700';
    }
  };

  if (loading) {
    return (
      <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <Loader className="h-6 w-6 animate-spin text-primary-600 dark:text-primary-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base sm:text-lg text-slate-900 dark:text-slate-100">
            Recent Activity
          </CardTitle>
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="px-2 py-1 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-gray-900 dark:text-gray-100"
          >
            <option value={10}>Last 10</option>
            <option value={20}>Last 20</option>
            <option value={50}>Last 50</option>
          </select>
        </div>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No activities yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className={`p-3 sm:p-4 rounded-lg border ${getActionColor(activity.action)} transition-colors`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex-shrink-0">
                    {getActionIcon(activity.action)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {getActionLabel(activity.action)}
                          {activity.contact && (
                            <span className="text-gray-600 dark:text-gray-400">
                              {' '}
                              {activity.contact.companyName}
                            </span>
                          )}
                        </p>
                        {activity.description && (
                          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {activity.description}
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap flex-shrink-0">
                        {formatDate(activity.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

