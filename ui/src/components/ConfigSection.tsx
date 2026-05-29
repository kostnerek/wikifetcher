import { useState, useEffect } from 'react';
import cronstrue from 'cronstrue';
import type { Settings } from '../types';
import { api } from '../api';

interface ConfigSectionProps {
  settings: Settings | null;
  onSettingsChange: (s: Settings) => void;
}

export function ConfigSection({
  settings,
  onSettingsChange,
}: ConfigSectionProps) {
  const [cron, setCron] = useState('');
  const [maxVersions, setMaxVersions] = useState(3);
  const [cronPreview, setCronPreview] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setCron(settings.cronExpression);
      setMaxVersions(settings.maxVersionsToKeep);
    }
  }, [settings]);

  useEffect(() => {
    try {
      setCronPreview(cronstrue.toString(cron));
    } catch {
      setCronPreview('Invalid cron expression');
    }
  }, [cron]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await api.settings.update({
        cronExpression: cron,
        maxVersionsToKeep: maxVersions,
      });
      onSettingsChange(updated);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const hasChanges =
    settings &&
    (cron !== settings.cronExpression ||
      maxVersions !== settings.maxVersionsToKeep);

  return (
    <div className="bg-white rounded-lg shadow p-4 sm:p-6">
      <h2 className="text-lg font-semibold mb-4">Configuration</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cron Schedule
          </label>
          <input
            type="text"
            value={cron}
            onChange={(e) => setCron(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            placeholder="0 3 * * 0"
          />
          <p className="text-xs text-gray-500 mt-1">{cronPreview}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Max Versions to Keep
          </label>
          <input
            type="number"
            value={maxVersions}
            onChange={(e) => setMaxVersions(parseInt(e.target.value, 10) || 1)}
            min={1}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>
      </div>

      {hasChanges && (
        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-4 bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      )}
    </div>
  );
}
