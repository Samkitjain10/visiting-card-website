'use client';

import { useEffect, useState } from 'react';
import { Users, Upload, CheckCircle, Calendar } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface Stats {
  total: number;
  sent: number;
  unsent: number;
  today: number;
}

export function DashboardStats() {
  const [stats, setStats] = useState<Stats>({ total: 0, sent: 0, unsent: 0, today: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/api/stats')
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching stats:', err);
        setLoading(false);
      });
  }, []);

  const statCards = [
    {
      title: 'Total Contacts',
      value: stats.total,
      icon: Users,
      accent: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      title: 'Sent',
      value: stats.sent,
      icon: CheckCircle,
      accent: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    },
    {
      title: 'Unsent',
      value: stats.unsent,
      icon: Upload,
      accent: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-900/20',
    },
    {
      title: 'Added Today',
      value: stats.today,
      icon: Calendar,
      accent: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-50 dark:bg-purple-900/20',
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-20 mb-3"></div>
            <div className="h-8 bg-gray-200 dark:bg-slate-700 rounded w-16"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.title}
            className="p-5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-shadow duration-200"
          >
            <p className="text-sm text-gray-600 dark:text-gray-400">{stat.title}</p>
            <p className="text-3xl font-semibold text-slate-900 dark:text-slate-100 mt-2">{stat.value}</p>
            <div className={`${stat.bg} ${stat.accent} w-10 h-10 rounded-lg flex items-center justify-center mt-4`}>
              <Icon className="w-5 h-5" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
