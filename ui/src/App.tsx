import { useEffect, useState, useCallback } from 'react';
import type { Settings, Language, Download } from './types';
import { api } from './api';
import { StatusBar } from './components/StatusBar';
import { ConfigSection } from './components/ConfigSection';
import { LanguageList } from './components/LanguageList';
import { AddLanguage } from './components/AddLanguage';
import { DownloadsTable } from './components/DownloadsTable';
import { HistoryPanel } from './components/HistoryPanel';

export default function App() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [downloads, setDownloads] = useState<Download[]>([]);
  const [diskUsage, setDiskUsage] = useState(0);
  const [downloading, setDownloading] = useState(false);

  const loadSettings = useCallback(async () => {
    const s = await api.settings.get();
    setSettings(s);
  }, []);

  const loadLanguages = useCallback(async () => {
    const langs = await api.languages.list();
    setLanguages(langs);
  }, []);

  const loadDownloads = useCallback(async () => {
    const result = await api.downloads.list();
    setDownloads(result.data);
    const usage = result.data
      .filter((d) => d.status === 'completed')
      .reduce((sum, d) => sum + Number(d.fileSize), 0);
    setDiskUsage(usage);
  }, []);

  const loadAll = useCallback(async () => {
    await Promise.all([loadSettings(), loadLanguages(), loadDownloads()]);
  }, [loadSettings, loadLanguages, loadDownloads]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const hasActiveDownload = downloads.some(
    (d) =>
      d.status === 'downloading' ||
      d.status === 'pending' ||
      d.status === 'deleting',
  );

  useEffect(() => {
    const interval = setInterval(loadDownloads, hasActiveDownload ? 1500 : 10000);
    return () => clearInterval(interval);
  }, [loadDownloads, hasActiveDownload]);

  const handleTriggerDownload = async () => {
    setDownloading(true);
    try {
      await api.downloads.trigger();
      await loadDownloads();
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">
          WikiFetcher Admin
        </h1>

        <StatusBar
          settings={settings}
          diskUsage={diskUsage}
          onTriggerDownload={handleTriggerDownload}
          downloading={downloading}
        />

        <ConfigSection
          settings={settings}
          onSettingsChange={setSettings}
        />

        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <h2 className="text-lg font-semibold mb-4">Languages</h2>
          <LanguageList languages={languages} onRefresh={loadLanguages} />
          <AddLanguage
            existingCodes={languages.map((l) => l.code)}
            onAdded={loadLanguages}
          />
        </div>

        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <h2 className="text-lg font-semibold mb-4">
            Downloads & File Management
          </h2>
          <DownloadsTable downloads={downloads} onRefresh={loadDownloads} />
        </div>

        <HistoryPanel downloads={downloads} />
      </div>
    </div>
  );
}
