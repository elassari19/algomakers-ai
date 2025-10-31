import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { Input } from '@/components/ui/input';
import { Check } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type AnyObject = { [key: string]: any };

interface FetchInputProps {
  model: string; // e.g. 'user'
  target?: string; // e.g. 'name', 'email', 'inviteStatus' - field to search in
  placeholder?: string;
  minLength?: number;
  debounceMs?: number;
  searchEndpoint?: string; // default '/api/search'
  page?: number;
  limit?: number;
  multiple?: boolean; // allow multiple selection
  onSelect: (item: AnyObject | AnyObject[]) => void; // for single: item, for multiple: array
  onResults?: (items: AnyObject[]) => void;
  includeSelectAll?: boolean; // show "Select all" option at top
  className?: string;
  getLabel?: (item: AnyObject) => string;
}

/**
 * FetchInput
 * - Generic input that queries the backend for `model` and query string `q`.
 * - Expects backend route like: /api/search?model=user&q=jhon
 * - Returns results as simple array of objects; item label is derived from getLabel or common fields.
 */
export const FetchInput: React.FC<FetchInputProps> = ({
  model,
  target,
  placeholder = 'Search...',
  minLength = 2,
  debounceMs = 300,
  searchEndpoint = '/api/search',
  page: initialPage = 1,
  limit = 20,
  multiple = false,
  onSelect,
  onResults,
  includeSelectAll = false,
  className = '',
  getLabel,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AnyObject[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<AnyObject[]>([]);
  const [selectedLabel, setSelectedLabel] = useState('');
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setCurrentPage(initialPage);
    setTotal(0);
  }, [query, initialPage]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const url = `${searchEndpoint}?model=${encodeURIComponent(model)}${target ? `&target=${encodeURIComponent(target)}` : ''}&page=${currentPage}&limit=${limit}`;
      const res = await fetch(url, { method: 'GET' });
      if (!res.ok) {
        console.error('FetchInput fetchAll failed', await res.text());
        setResults([]);
        setTotal(0);
        onResults?.([]);
        return;
      }
      const data = await res.json();
      const items = data.results || [];
      const newTotal = data.total || 0;
      setResults(items);
      setTotal(newTotal);
      onResults?.(items);
      setOpen(true);
    } catch (err) {
      console.error('FetchInput fetchAll error', err);
      setResults([]);
      setTotal(0);
      onResults?.([]);
    } finally {
      setLoading(false);
    }
  }, [searchEndpoint, model, target, currentPage, limit, onResults]);

  const debouncedFetch = useDebouncedCallback(async () => {
    if (!query) {
      // Fetch all
      await fetchAll();
      return;
    }
    if (query.length < minLength) {
      setResults([]);
      setTotal(0);
      onResults?.([]);
      return;
    }

    setLoading(true);
    try {
      const url = `${searchEndpoint}?model=${encodeURIComponent(model)}${target ? `&target=${encodeURIComponent(target)}` : ''}&q=${encodeURIComponent(query)}&page=${currentPage}&limit=${limit}`;
      const res = await fetch(url, { method: 'GET' });
      if (!res.ok) {
        console.error('FetchInput search failed', await res.text());
        setResults([]);
        setTotal(0);
        onResults?.([]);
        return;
      }
      const data = await res.json();
      const items = data.results || [];
      const newTotal = data.total || 0;
      if (currentPage === initialPage) {
        setResults(items);
      } else {
        setResults(prev => [...prev, ...items]);
      }
      setTotal(newTotal);
      onResults?.(currentPage === initialPage ? items : [...results, ...items]);
      setOpen(true);
    } catch (err) {
      console.error('FetchInput error', err);
      setResults([]);
      setTotal(0);
      onResults?.([]);
    } finally {
      setLoading(false);
    }
  }, debounceMs);

  useEffect(() => {
    if (!query && !open) {
      setResults([]);
      setTotal(0);
      setCurrentPage(initialPage);
      onResults?.([]);
      return;
    }
    debouncedFetch();
  }, [query, currentPage, debouncedFetch, open, initialPage]);

  const pick = (item: AnyObject) => {
    if (multiple) {
      let newSelected;
      if (item._all) {
        // Select all current results
        newSelected = [...selected, ...results.filter(r => !selected.find(s => s.id === r.id))];
      } else {
        const isSelected = selected.find(s => s.id === item.id);
        if (isSelected) {
          newSelected = selected.filter(s => s.id !== item.id);
        } else {
          newSelected = [...selected, item];
        }
      }
      setSelected(newSelected);
      onSelect(newSelected);
    } else {
      const label = labelFor(item);
      setSelectedLabel(label);
      setQuery(label);
      onSelect(item);
      setOpen(false);
    }
    setQuery('');
  };

  const labelFor = (item: AnyObject) => {
    if (getLabel) return getLabel(item);
    return item.name ?? item.email ?? item.label ?? item.id ?? JSON.stringify(item);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <Input
        value={multiple ? (selected.length > 0 ? `${selected.length} selected` : query) : (query || selectedLabel)}
        onChange={(e) => {
          const val = (e.target as HTMLInputElement).value;
          setQuery(val);
          if (!multiple && val !== selectedLabel) {
            setSelectedLabel('');
          }
        }}
        placeholder={placeholder}
        onFocus={() => {
          setOpen(true);
          if (!query && results.length === 0) {
            fetchAll();
          }
        }}
        className="w-full"
        aria-label={`Search ${model}`}
      />

      {open && (results.length > 0 || includeSelectAll) && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover p-1 text-popover-foreground shadow-md max-h-60 overflow-auto">
          <ul className="p-0">
            {includeSelectAll && (
              <li
                className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                onClick={() => pick({ id: '__all', _all: true, label: 'All' })}
              >
                Select all
              </li>
            )}
            {results.map((r, idx) => {
              const isSelected = multiple && selected.find(s => s.id === r.id);
              return (
                <li
                  key={r.id ?? idx}
                  className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                  onClick={() => pick(r)}
                  title={labelFor(r)}
                >
                  {multiple && <Checkbox checked={isSelected as boolean} className="absolute left-2 pointer-events-none bg-transparent text-white border-white data-[state=checked]:bg-black" />}
                  {!multiple && isSelected && <Check className="absolute left-2 h-4 w-4" />}
                  <span className={multiple || isSelected ? 'pl-6' : ''}>{labelFor(r)}</span>
                </li>
              );
            })}
            {results.length > 0 && results.length < total && (
              <li
                className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 text-blue-600 border-t border-zinc-100 font-medium"
                onClick={() => setCurrentPage(prev => prev + 1)}
              >
                Load more...
              </li>
            )}
          </ul>
        </div>
      )}

      {loading && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-zinc-500">Loading...</div>
      )}
    </div>
  );
};

export default FetchInput;
