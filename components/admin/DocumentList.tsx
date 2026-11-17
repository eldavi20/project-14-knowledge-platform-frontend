'use client';

import React from 'react';

export function DocumentList() {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Ingested Documents</h2>
      <p className="text-sm text-gray-500 mb-4">Manage and inspect system documents and their ACL status.</p>
      <div className="border border-gray-200 rounded-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Sample Document A</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Google Drive</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">Synced</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
