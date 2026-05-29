import type { Language } from '../types';
import { api } from '../api';

interface LanguageListProps {
  languages: Language[];
  onRefresh: () => void;
}

export function LanguageList({ languages, onRefresh }: LanguageListProps) {
  const handleToggleEnabled = async (lang: Language) => {
    await api.languages.update(lang.id, { enabled: !lang.enabled });
    onRefresh();
  };

  const handleToggleImages = async (lang: Language) => {
    await api.languages.update(lang.id, { withImages: !lang.withImages });
    onRefresh();
  };

  const handleRemove = async (lang: Language) => {
    if (!confirm(`Remove ${lang.name} and all its ZIM files?`)) return;
    await api.languages.remove(lang.id);
    onRefresh();
  };

  if (languages.length === 0) {
    return (
      <p className="text-sm text-gray-500 italic">
        No languages configured. Add one below.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {languages.map((lang) => (
        <div
          key={lang.id}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 border border-gray-200 rounded-md"
        >
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm bg-gray-100 px-2 py-0.5 rounded">
              {lang.code}
            </span>
            <span className="text-sm font-medium">{lang.name}</span>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 text-sm">
              <input
                type="checkbox"
                checked={lang.enabled}
                onChange={() => handleToggleEnabled(lang)}
                className="rounded"
              />
              Enabled
            </label>

            <label className="flex items-center gap-1.5 text-sm">
              <input
                type="checkbox"
                checked={lang.withImages}
                onChange={() => handleToggleImages(lang)}
                className="rounded"
              />
              Images
            </label>

            <button
              onClick={() => handleRemove(lang)}
              className="text-red-600 hover:text-red-800 text-sm font-medium"
            >
              Remove
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
