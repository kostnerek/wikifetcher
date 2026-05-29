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

function statusBadge(status: Download['status']) {
  const colors = {
    pending: 'bg-yellow-100 text-yellow-800',
    downloading: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
  };
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[status]}`}
    >
      {status}
    </span>
  );
}

interface DownloadsTableProps {
  downloads: Download[];
  onRefresh: () => void;
}

export function DownloadsTable({ downloads, onRefresh }: DownloadsTableProps) {
  const active = downloads.filter(
    (d) =>
      d.status === 'completed' ||
      d.status === 'downloading' ||
      d.status === 'pending',
  );

  const handleActivate = async (id: number) => {
    await api.downloads.activate(id);
    onRefresh();
  };

  const handleDelete = async (d: Download) => {
    if (!confirm(`Delete ${d.fileName}?`)) return;
    await api.downloads.remove(d.id);
    onRefresh();
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
          {active.map((d) => (
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
                  {statusBadge(d.status)}
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
                <div className="flex gap-2">
                  {d.status === 'completed' && !d.isActive && (
                    <button
                      onClick={() => handleActivate(d.id)}
                      className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                    >
                      Activate
                    </button>
                  )}
                  {!d.isActive && d.status !== 'downloading' && (
                    <button
                      onClick={() => handleDelete(d)}
                      className="text-red-600 hover:text-red-800 text-xs font-medium"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
