'use client';

import React from 'react';

export function AuditLog() {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Query Audit History</h2>
      <p className="text-sm text-gray-500 mb-4">Inspect past user queries, latency, and retrieved source chunks.</p>
      <div className="border border-gray-200 rounded-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Query Text</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sources Retrieved</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">2026-11-14 20:11</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">admin@example.com</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">What is the permission policy?</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">3 chunks</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
