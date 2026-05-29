import { useState } from 'react';
import type { Download } from '../types';

interface HistoryPanelProps {
  downloads: Download[];
}

export function HistoryPanel({ downloads }: HistoryPanelProps) {
  const [open, setOpen] = useState(false);
  const failed = downloads.filter((d) => d.status === 'failed');

  if (failed.length === 0) return null;

  return (
    <div className="bg-white rounded-lg shadow">
      <button
        onClick={() => setOpen(!open)}
        className="w-full p-4 sm:p-6 text-left flex justify-between items-center"
      >
        <h2 className="text-lg font-semibold">
          History ({failed.length} failed)
        </h2>
        <span className="text-gray-400">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="px-4 pb-4 sm:px-6 sm:pb-6">
          <div className="space-y-2">
            {failed.map((d) => (
              <div
                key={d.id}
                className="p-3 bg-red-50 border border-red-100 rounded-md"
              >
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                  <span className="text-sm font-medium">{d.fileName}</span>
                  <span className="text-xs text-gray-500">
                    {d.startedAt
                      ? new Date(d.startedAt).toLocaleString()
                      : 'Unknown date'}
                  </span>
                </div>
                {d.errorMessage && (
                  <p className="text-xs text-red-600 mt-1">
                    {d.errorMessage}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
