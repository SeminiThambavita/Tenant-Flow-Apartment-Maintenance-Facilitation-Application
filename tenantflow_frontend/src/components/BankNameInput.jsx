import { useMemo, useState } from 'react';
import { filterSriLankanBanks } from '../utils/sriLankanBanks';

export default function BankNameInput({ value, onChange, error, id = 'bankName' }) {
  const [open, setOpen] = useState(false);
  const suggestions = useMemo(() => filterSriLankanBanks(value).slice(0, 8), [value]);

  return (
    <div className="relative">
      <input
        id={id}
        type="text"
        name="bankName"
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Type to search Sri Lankan banks"
        autoComplete="off"
        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
          error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
        }`}
      />
      {open && suggestions.length > 0 && (
        <ul className="absolute z-20 mt-1 w-full max-h-48 overflow-y-auto bg-white border border-gray-200 rounded-md shadow-lg text-sm">
          {suggestions.map((bank) => (
            <li key={bank}>
              <button
                type="button"
                className="w-full text-left px-3 py-2 hover:bg-blue-50 text-gray-800"
                onMouseDown={(event) => {
                  event.preventDefault();
                  onChange(bank);
                  setOpen(false);
                }}
              >
                {bank}
              </button>
            </li>
          ))}
        </ul>
      )}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
