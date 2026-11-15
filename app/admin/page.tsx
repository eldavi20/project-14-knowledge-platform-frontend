'use client';

import React, { useState } from 'react';
import { DocumentList } from '@/components/admin/DocumentList';
import { AuditLog } from '@/components/admin/AuditLog';
import { MetricsDashboard } from '@/components/admin/MetricsDashboard';

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<
    'documents' | 'access-control' | 'ingestion-sources' | 'audit-logs' | 'metrics'
  >('documents');

  const tabs = [
    { id: 'documents', name: 'Documents' },
    { id: 'access-control', name: 'Access Control' },
    { id: 'ingestion-sources', name: 'Ingestion Sources' },
    { id: 'audit-logs', name: 'Audit Logs' },
    { id: 'metrics', name: 'Metrics' },
  ] as const;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Admin Dashboard</h1>
      
      {/* Professional Tab Bar */}
      <div className="flex border-b border-gray-200 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`py-2 px-4 font-medium text-sm border-b-2 whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.name}
          </button>
        ))}
      </div>

      {/* Tab Content Area */}
      <div className="mt-6">
        {activeTab === 'documents' && <DocumentList />}
        {activeTab === 'access-control' && (
          <div className="p-6 bg-white rounded-lg border border-gray-200 text-gray-500">
            Access Control matrix component coming soon.
          </div>
        )}
        {activeTab === 'ingestion-sources' && (
          <div className="p-6 bg-white rounded-lg border border-gray-200 text-gray-500">
            Ingestion Sources component coming soon.
          </div>
        )}
        {activeTab === 'audit-logs' && <AuditLog />}
        {activeTab === 'metrics' && <MetricsDashboard />}
      </div>
    </div>
  );
}