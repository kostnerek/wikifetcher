import { useEffect, useMemo, useState } from 'react';
import { api } from '../api';

interface AddLanguageProps {
  existingCodes: string[];
  onAdded: () => void;
}

interface LanguageOption {
  code: string;
  name: string;
}

function buildOptions(codes: string[]): LanguageOption[] {
  const display = (() => {
    try {
      return new Intl.DisplayNames(['en'], { type: 'language' });
    } catch {
      return null;
    }
  })();

  return codes
    .map((code) => {
      let name = code;
      try {
        const resolved = display?.of(code.replace(/_/g, '-'));
        if (resolved && resolved.toLowerCase() !== code.toLowerCase()) {
          name = resolved;
        }
      } catch {
        // fall through, keep code as name
      }
      return { code, name };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function AddLanguage({ existingCodes, onAdded }: AddLanguageProps) {
  const [search, setSearch] = useState('');
  const [adding, setAdding] = useState(false);
  const [allCodes, setAllCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    api.zim
      .languages()
      .then((codes) => {
        setAllCodes(codes);
        setError(null);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const options = useMemo(() => buildOptions(allCodes), [allCodes]);

  const filtered = options.filter(
    (l) =>
      !existingCodes.includes(l.code) &&
      (l.name.toLowerCase().includes(search.toLowerCase()) ||
        l.code.toLowerCase().includes(search.toLowerCase())),
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
        placeholder={
          loading
            ? 'Loading languages from Kiwix…'
            : `Search ${options.length} languages to add...`
        }
        disabled={loading || !!error}
        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm disabled:bg-gray-50"
      />
      {error && (
        <p className="mt-1 text-xs text-red-600">
          Could not load language list: {error}
        </p>
      )}
      {search && (
        <div className="mt-1 border border-gray-200 rounded-md max-h-60 overflow-y-auto">
          {filtered.map((l) => (
            <button
              key={l.code}
              onClick={() => handleAdd(l.code, l.name)}
              disabled={adding}
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex justify-between disabled:opacity-50"
            >
              <span>
                {l.name}{' '}
                <span className="text-gray-400 font-mono text-xs">
                  ({l.code})
                </span>
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
