import { useState } from 'react';
import type { Download } from '../types';
import { api } from '../api';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatSpeed(bps: number | null): string | null {
  if (bps == null || bps <= 0) return null;
  return `${formatBytes(bps)}/s`;
}

function Spinner() {
  return (
    <svg
      className="animate-spin h-3 w-3 text-current"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}

function statusBadge(status: Download['status']) {
  const colors = {
    pending: 'bg-yellow-100 text-yellow-800',
    downloading: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
    deleting: 'bg-orange-100 text-orange-800',
  };
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[status]} inline-flex items-center gap-1`}
    >
      {status === 'deleting' && <Spinner />}
      {status}
    </span>
  );
}

interface DownloadsTableProps {
  downloads: Download[];
  onRefresh: () => void;
}

export function DownloadsTable({ downloads, onRefresh }: DownloadsTableProps) {
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set());
  const [activatingIds, setActivatingIds] = useState<Set<number>>(new Set());

  const active = downloads.filter(
    (d) =>
      d.status === 'completed' ||
      d.status === 'downloading' ||
      d.status === 'pending' ||
      d.status === 'deleting',
  );

  const handleActivate = async (id: number) => {
    setActivatingIds((s) => new Set(s).add(id));
    try {
      await api.downloads.activate(id);
      onRefresh();
    } finally {
      setActivatingIds((s) => {
        const next = new Set(s);
        next.delete(id);
        return next;
      });
    }
  };

  const handleDelete = async (d: Download) => {
    if (!confirm(`Delete ${d.fileName}?`)) return;
    setDeletingIds((s) => new Set(s).add(d.id));
    const minVisible = new Promise((r) => setTimeout(r, 800));
    try {
      await Promise.all([api.downloads.remove(d.id), minVisible]);
      onRefresh();
    } finally {
      setDeletingIds((s) => {
        const next = new Set(s);
        next.delete(d.id);
        return next;
      });
    }
  };

  if (active.length === 0) {
    return (
      <p className="text-sm text-gray-500 italic">No downloads yet.</p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left">
            <th className="pb-2 font-medium text-gray-700">Language</th>
            <th className="pb-2 font-medium text-gray-700">File</th>
            <th className="pb-2 font-medium text-gray-700 hidden sm:table-cell">
              Size
            </th>
            <th className="pb-2 font-medium text-gray-700">Status</th>
            <th className="pb-2 font-medium text-gray-700 hidden sm:table-cell">
              Date
            </th>
            <th className="pb-2 font-medium text-gray-700">Actions</th>
          </tr>
        </thead>
        <tbody>
          {active.map((d) => {
            const effectiveStatus: Download['status'] = deletingIds.has(d.id)
              ? 'deleting'
              : d.status;
            return (
            <tr key={d.id} className="border-b border-gray-100">
              <td className="py-2">
                <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                  {d.language?.code || '??'}
                </span>
              </td>
              <td className="py-2 max-w-[200px] truncate">{d.fileName}</td>
              <td className="py-2 hidden sm:table-cell">
                {formatBytes(d.fileSize)}
              </td>
              <td className="py-2">
                <div className="flex items-center gap-2">
                  {statusBadge(effectiveStatus)}
                  {d.isActive && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      active
                    </span>
                  )}
                </div>
                {d.status === 'downloading' && (
                  <>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                      <div
                        className="bg-blue-600 h-1.5 rounded-full transition-all"
                        style={{ width: `${d.progress}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {d.progress}%
                      {formatSpeed(d.speedBps) && ` · ${formatSpeed(d.speedBps)}`}
                    </div>
                  </>
                )}
              </td>
              <td className="py-2 hidden sm:table-cell text-gray-500">
                {d.completedAt
                  ? new Date(d.completedAt).toLocaleDateString()
                  : '-'}
              </td>
              <td className="py-2">
                <div className="flex gap-2 items-center">
                  {d.status === 'completed' && !d.isActive && (
                    <button
                      onClick={() => handleActivate(d.id)}
                      disabled={
                        activatingIds.has(d.id) || deletingIds.has(d.id)
                      }
                      className="text-blue-600 hover:text-blue-800 text-xs font-medium disabled:text-gray-400 disabled:cursor-not-allowed inline-flex items-center gap-1"
                    >
                      {activatingIds.has(d.id) && <Spinner />}
                      {activatingIds.has(d.id) ? 'Activating…' : 'Activate'}
                    </button>
                  )}
                  {!d.isActive &&
                    d.status !== 'downloading' &&
                    d.status !== 'deleting' && (
                      <button
                        onClick={() => handleDelete(d)}
                        disabled={
                          deletingIds.has(d.id) || activatingIds.has(d.id)
                        }
                        className="text-red-600 hover:text-red-800 text-xs font-medium disabled:text-gray-400 disabled:cursor-not-allowed inline-flex items-center gap-1"
                      >
                        {deletingIds.has(d.id) && <Spinner />}
                        {deletingIds.has(d.id) ? 'Deleting…' : 'Delete'}
                      </button>
                    )}
                </div>
              </td>
            </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
