import { useEffect, useState } from 'react';
import type { KiwixStatus, Settings } from '../types';
import { api } from '../api';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

interface StatusBarProps {
  settings: Settings | null;
  diskUsage: number;
  onTriggerDownload: () => void;
  downloading: boolean;
}

export function StatusBar({
  settings,
  diskUsage,
  onTriggerDownload,
  downloading,
}: StatusBarProps) {
  const [kiwixStatus, setKiwixStatus] = useState<KiwixStatus | null>(null);

  useEffect(() => {
    api.kiwix.status().then(setKiwixStatus).catch(console.error);
    const interval = setInterval(() => {
      api.kiwix.status().then(setKiwixStatus).catch(console.error);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white rounded-lg shadow p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${
                kiwixStatus?.running ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
            <span className="text-sm font-medium">
              Kiwix: {kiwixStatus?.running ? 'Running' : 'Stopped'}
            </span>
          </div>

          {kiwixStatus?.activeFiles && kiwixStatus.activeFiles.length > 0 && (
            <ul className="pl-5 space-y-0.5">
              {kiwixStatus.activeFiles.map((f) => (
                <li key={f.languageCode} className="text-sm text-gray-600">
                  {f.language}: {f.fileName} ({formatBytes(f.fileSize)})
                </li>
              ))}
            </ul>
          )}

          <div className="flex flex-wrap gap-x-6 gap-y-1 pt-1">
            {settings?.nextRun && (
              <span className="text-sm text-gray-600">
                Next download:{' '}
                {new Date(settings.nextRun).toLocaleString()}
              </span>
            )}
            <span className="text-sm text-gray-600">
              Disk: {formatBytes(diskUsage)}
            </span>
          </div>
        </div>

        <button
          onClick={onTriggerDownload}
          disabled={downloading}
          className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
        >
          {downloading ? 'Downloading...' : 'Trigger Download Now'}
        </button>
      </div>
    </div>
  );
}
