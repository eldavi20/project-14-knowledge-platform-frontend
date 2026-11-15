'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const adminTabs = [
  { name: 'Users', href: '/admin/users' },
  { name: 'Documents', href: '/admin/documents' },
  { name: 'Audit Logs', href: '/admin/audit' },
  { name: 'Metrics', href: '/admin/metrics' },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-white border-r border-gray-200 p-6 flex flex-col">
        <h2 className="text-lg font-bold text-gray-800 mb-6">Admin Console</h2>
        <nav className="space-y-1">
          {adminTabs.map((tab) => {
            const isActive = pathname === tab.href;
            return (
              <Link
                key={tab.name}
                href={tab.href}
                className={`block px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                {tab.name}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
