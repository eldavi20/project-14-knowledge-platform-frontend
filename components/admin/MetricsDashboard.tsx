'use client';

import React from 'react';

export function MetricsDashboard() {
  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">System Evaluation & Performance Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <p className="text-sm font-medium text-gray-500">Permission Leakage Rate</p>
            <p className="text-2xl font-bold text-green-600 mt-1">0.00%</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <p className="text-sm font-medium text-gray-500">Retrieval Precision</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">94.2%</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <p className="text-sm font-medium text-gray-500">Avg Latency</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">420ms</p>
          </div>
        </div>
      </div>
    </div>
  );
}
