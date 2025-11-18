'use client';

import { useMemo } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-context';
import { useRouter } from 'next/navigation';
import { Button } from './ui/Button';
import { CalendarDays, LogOut, Moon, Sun } from 'lucide-react';

export function Header() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const today = useMemo(
    () =>
      new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      }).format(new Date()),
    []
  );

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur border-b border-gray-100 dark:border-slate-800 shadow-[0_2px_12px_rgba(15,23,42,0.08)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.3)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <h1 className="text-base sm:text-lg lg:text-xl font-semibold text-slate-900 dark:text-slate-100 truncate">
            Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
          </h1>
          <span className="hidden sm:flex items-center text-xs sm:text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
            <CalendarDays className="h-3 w-3 sm:h-4 sm:w-4 mr-1 text-primary-500 dark:text-primary-400 flex-shrink-0" />
            <span className="hidden md:inline">{today}</span>
          </span>
        </div>
        {user && (
          <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 flex-shrink-0">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full border border-gray-200 dark:border-slate-700 hover:border-primary-200 dark:hover:border-primary-700 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              ) : (
                <Moon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              )}
            </button>
            <button
              onClick={() => router.push('/profile')}
              className="flex items-center gap-1.5 sm:gap-2 rounded-full border border-gray-200 dark:border-slate-700 px-2 sm:px-2.5 py-1 shadow-sm hover:bg-gray-50 dark:hover:bg-slate-800 hover:border-primary-200 dark:hover:border-primary-700 transition-colors cursor-pointer"
            >
              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 flex items-center justify-center font-semibold text-xs sm:text-sm flex-shrink-0">
                {user.image ? (
                  <img
                    src={user.image}
                    alt={user.name || 'User'}
                    className="h-7 w-7 sm:h-8 sm:w-8 rounded-full object-cover"
                  />
                ) : (
                  (user.name || user.email || 'U').charAt(0).toUpperCase()
                )}
              </div>
              <div className="hidden sm:block text-xs">
                <p className="font-semibold text-slate-900 dark:text-slate-100 truncate max-w-[100px] lg:max-w-none">
                  {user.name || 'User'}
                </p>
              </div>
            </button>
            <Button
              variant="ghost"
              size="sm"
              className="hidden sm:flex items-center gap-2 rounded-full border border-gray-200 dark:border-slate-700 hover:border-primary-200 dark:hover:border-primary-700"
              onClick={logout}
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden lg:inline">Sign Out</span>
            </Button>
            <button
              onClick={logout}
              className="sm:hidden p-2 rounded-full border border-gray-200 dark:border-slate-700 hover:border-primary-200 dark:hover:border-primary-700 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
              aria-label="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

