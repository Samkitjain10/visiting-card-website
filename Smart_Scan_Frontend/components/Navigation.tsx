'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Upload, Users, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/upload', label: 'Upload', icon: Upload },
  { href: '/contacts', label: 'Contacts', icon: Users },
  { href: '/export', label: 'Export', icon: Download },
];

export function Navigation() {
  const pathname = usePathname();

  const NavLink = ({ href, label, icon: Icon }: typeof navItems[number]) => {
    const isActive = pathname === href;
    return (
      <Link
        href={href}
        className={cn(
          'group flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 border border-transparent whitespace-nowrap flex-shrink-0',
          isActive
            ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 border-primary-100 dark:border-primary-800 shadow-sm'
            : 'text-gray-600 dark:text-gray-400 hover:text-primary-700 dark:hover:text-primary-400 hover:bg-primary-50/70 dark:hover:bg-primary-900/10 hover:border-primary-100 dark:hover:border-primary-800'
        )}
      >
        <span
          className={cn(
            'flex h-7 w-7 sm:h-9 sm:w-9 items-center justify-center rounded-lg sm:rounded-xl bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400 transition-colors duration-200 flex-shrink-0',
            isActive && 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-400',
            !isActive && 'group-hover:bg-primary-100 dark:group-hover:bg-primary-900 group-hover:text-primary-700 dark:group-hover:text-primary-400'
          )}
        >
          <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </span>
        <span>{label}</span>
      </Link>
    );
  };

  return (
    <>
      <div className="lg:hidden sticky top-14 sm:top-16 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur border-b border-gray-100 dark:border-slate-800 px-3 sm:px-4 lg:px-6 py-2 sm:py-3">
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto scrollbar-hide">
          {navItems.map((item) => (
            <NavLink key={item.href} {...item} />
          ))}
        </div>
      </div>
      <aside className="hidden lg:flex w-64 border-r border-gray-100 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur min-h-screen">
        <div className="flex flex-col gap-8 w-full p-6 lg:p-8 sticky top-0">
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Smart Scan</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 tracking-wide">Your Smart Contact Manager</p>
          </div>
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.href}>
                <NavLink {...item} />
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </>
  );
}

