'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { apiClient } from '@/lib/api-client';
import { TrendingUp, Upload, Download, Users, Activity } from 'lucide-react';

interface AnalyticsData {
  contactGrowth: Record<string, number>;
  uploadGrowth: Record<string, number>;
  exportGrowth: Record<string, number>;
  actionDistribution: Array<{ action: string; count: number }>;
  statusDistribution: {
    total: number;
    sent: number;
    unsent: number;
  };
  period: number;
}

export function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(30);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const data = await apiClient.get(`/api/analytics?days=${period}`);
        setAnalytics(data);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [period]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-200 dark:bg-slate-700 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        No analytics data available
      </div>
    );
  }

  // Calculate totals
  const totalContacts = Object.values(analytics.contactGrowth).reduce((a, b) => a + b, 0);
  const totalUploads = Object.values(analytics.uploadGrowth).reduce((a, b) => a + b, 0);
  const totalExports = Object.values(analytics.exportGrowth).reduce((a, b) => a + b, 0);

  // Get action counts
  const actionCounts = analytics.actionDistribution.reduce((acc, item) => {
    acc[item.action] = item.count;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Period Selector */}
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Period:</label>
        <select
          value={period}
          onChange={(e) => setPeriod(Number(e.target.value))}
          className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-gray-900 dark:text-gray-100"
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Contacts Added</p>
                <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                  {totalContacts}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                <Users className="h-6 w-6 text-primary-600 dark:text-primary-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Cards Uploaded</p>
                <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                  {totalUploads}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
                <Upload className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Exports</p>
                <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                  {totalExports}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <Download className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Total Activities</p>
                <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                  {analytics.actionDistribution.reduce((sum, item) => sum + item.count, 0)}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                <Activity className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Distribution */}
      <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg text-slate-900 dark:text-slate-100">
            Activity Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analytics.actionDistribution.map((item) => {
              const total = analytics.actionDistribution.reduce((sum, i) => sum + i.count, 0);
              const percentage = total > 0 ? (item.count / total) * 100 : 0;
              const actionLabels: Record<string, string> = {
                created: 'Created',
                updated: 'Updated',
                deleted: 'Deleted',
                uploaded: 'Uploaded',
                exported: 'Exported',
              };

              return (
                <div key={item.action} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-700 dark:text-gray-300 font-medium">
                      {actionLabels[item.action] || item.action}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">
                      {item.count} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-primary-600 dark:bg-primary-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Growth Charts (Simple Bar Representation) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg text-slate-900 dark:text-slate-100">
              Contact Growth
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(analytics.contactGrowth)
                .slice(-7)
                .map(([date, count]) => (
                  <div key={date} className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400 w-20">
                      {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                    <div className="flex-1 bg-gray-200 dark:bg-slate-700 rounded-full h-4 relative">
                      <div
                        className="bg-primary-600 dark:bg-primary-500 h-4 rounded-full flex items-center justify-end pr-2"
                        style={{
                          width: `${Math.max(10, (count / Math.max(...Object.values(analytics.contactGrowth))) * 100)}%`,
                        }}
                      >
                        {count > 0 && (
                          <span className="text-xs font-medium text-white">{count}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg text-slate-900 dark:text-slate-100">
              Upload Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(analytics.uploadGrowth)
                .slice(-7)
                .map(([date, count]) => (
                  <div key={date} className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400 w-20">
                      {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                    <div className="flex-1 bg-gray-200 dark:bg-slate-700 rounded-full h-4 relative">
                      <div
                        className="bg-emerald-600 dark:bg-emerald-500 h-4 rounded-full flex items-center justify-end pr-2"
                        style={{
                          width: `${Math.max(10, (count / Math.max(1, ...Object.values(analytics.uploadGrowth))) * 100)}%`,
                        }}
                      >
                        {count > 0 && (
                          <span className="text-xs font-medium text-white">{count}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

