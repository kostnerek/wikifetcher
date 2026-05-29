import { useState } from 'react';
import { api } from '../api';

const COMMON_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'de', name: 'German' },
  { code: 'fr', name: 'French' },
  { code: 'es', name: 'Spanish' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'zh', name: 'Chinese' },
  { code: 'pl', name: 'Polish' },
  { code: 'nl', name: 'Dutch' },
  { code: 'sv', name: 'Swedish' },
  { code: 'uk', name: 'Ukrainian' },
  { code: 'cs', name: 'Czech' },
  { code: 'ko', name: 'Korean' },
  { code: 'ar', name: 'Arabic' },
  { code: 'hi', name: 'Hindi' },
  { code: 'tr', name: 'Turkish' },
  { code: 'fi', name: 'Finnish' },
  { code: 'no', name: 'Norwegian' },
];

interface AddLanguageProps {
  existingCodes: string[];
  onAdded: () => void;
}

export function AddLanguage({ existingCodes, onAdded }: AddLanguageProps) {
  const [search, setSearch] = useState('');
  const [adding, setAdding] = useState(false);

  const filtered = COMMON_LANGUAGES.filter(
    (l) =>
      !existingCodes.includes(l.code) &&
      (l.name.toLowerCase().includes(search.toLowerCase()) ||
        l.code.includes(search.toLowerCase())),
  );

  const handleAdd = async (code: string, name: string) => {
    setAdding(true);
    try {
      await api.languages.create({ code, name, withImages: false });
      setSearch('');
      onAdded();
    } catch (err) {
      console.error(err);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="mt-3">
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search languages to add..."
        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
      />
      {search && (
        <div className="mt-1 border border-gray-200 rounded-md max-h-40 overflow-y-auto">
          {filtered.map((l) => (
            <button
              key={l.code}
              onClick={() => handleAdd(l.code, l.name)}
              disabled={adding}
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex justify-between"
            >
              <span>
                {l.name} ({l.code})
              </span>
              <span className="text-blue-600">+ Add</span>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="px-3 py-2 text-sm text-gray-500">
              No matching languages
            </p>
          )}
        </div>
      )}
    </div>
  );
}
