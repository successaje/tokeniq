"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  HomeIcon, 
  ChartPieIcon, 
  CubeIcon, 
  CogIcon, 
  QuestionMarkCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { clsx } from 'clsx';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Assets', href: '/assets', icon: CubeIcon },
  { name: 'Strategies', href: '/strategies', icon: ChartPieIcon },
  { name: 'Settings', href: '/settings', icon: CogIcon },
  { name: 'Help', href: '/help', icon: QuestionMarkCircleIcon },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <div className={clsx(
      'flex flex-col h-screen bg-gray-900 text-white transition-all duration-300',
      collapsed ? 'w-20' : 'w-64'
    )}>
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <div className={clsx('flex items-center', collapsed ? 'justify-center w-full' : '')}>
          {!collapsed && <span className="text-xl font-bold">TokenIQ X</span>}
          {collapsed && <span className="text-xl font-bold">TX</span>}
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded-lg hover:bg-gray-800"
        >
          {collapsed ? (
            <ChevronRightIcon className="w-5 h-5" />
          ) : (
            <ChevronLeftIcon className="w-5 h-5" />
          )}
        </button>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={clsx(
                'flex items-center px-3 py-2 rounded-lg transition-colors',
                isActive 
                  ? 'bg-primary-600 text-white' 
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              )}
            >
              <item.icon className={clsx(
                'w-6 h-6',
                collapsed ? 'mx-auto' : 'mr-3'
              )} />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-800">
        <div className={clsx(
          'flex items-center rounded-lg bg-gray-800 p-3',
          collapsed ? 'justify-center' : 'space-x-3'
        )}>
          <div className="w-8 h-8 rounded-full bg-primary-600" />
          {!collapsed && (
            <div>
              <div className="font-medium">John Doe</div>
              <div className="text-sm text-gray-400">Connected</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 