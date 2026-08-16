import React, { useState } from 'react';
import { X, MapPin, Check, Search, Globe } from 'lucide-react';
import { LocationData } from '../types';
import { setCustomCity } from '../services/location';

interface ChangeLocationModalProps {
  currentLocation: LocationData;
  onLocationChanged: (newLoc: LocationData) => void;
  onClose: () => void;
}

const POPULAR_INDIAN_CITIES = [
  { city: 'Delhi', state: 'Delhi' },
  { city: 'New Delhi', state: 'Delhi' },
  { city: 'Bengaluru', state: 'Karnataka' },
  { city: 'Mumbai', state: 'Maharashtra' },
  { city: 'Pune', state: 'Maharashtra' },
  { city: 'Hyderabad', state: 'Telangana' },
  { city: 'Chennai', state: 'Tamil Nadu' },
  { city: 'Kolkata', state: 'West Bengal' },
  { city: 'Ahmedabad', state: 'Gujarat' },
  { city: 'Jaipur', state: 'Rajasthan' },
  { city: 'Lucknow', state: 'Uttar Pradesh' },
  { city: 'Chandigarh', state: 'Punjab' },
  { city: 'Indore', state: 'Madhya Pradesh' },
  { city: 'Bhopal', state: 'Madhya Pradesh' },
  { city: 'Patna', state: 'Bihar' },
  { city: 'Nagpur', state: 'Maharashtra' },
  { city: 'Surat', state: 'Gujarat' },
  { city: 'Visakhapatnam', state: 'Andhra Pradesh' },
  { city: 'Kochi', state: 'Kerala' },
  { city: 'Guwahati', state: 'Assam' },
  { city: 'Dehradun', state: 'Uttarakhand' },
  { city: 'Goa', state: 'Goa' },
];

export const ChangeLocationModal: React.FC<ChangeLocationModalProps> = ({
  currentLocation,
  onLocationChanged,
  onClose,
}) => {
  const [cityName, setCityName] = useState(currentLocation.city);
  const [countryName, setCountryName] = useState(currentLocation.country || 'India');
  const [countryCode, setCountryCode] = useState(currentLocation.countryCode || 'IN');
  const [saved, setSaved] = useState(false);

  const handleSelectCity = (c: string) => {
    setCityName(c);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cityName.trim()) return;

    setCustomCity(cityName.trim(), countryName.trim(), countryCode.trim());
    setSaved(true);

    const updated: LocationData = {
      ...currentLocation,
      city: cityName.trim(),
      country: countryName.trim(),
      countryCode: countryCode.trim().toUpperCase(),
    };

    onLocationChanged(updated);
    setTimeout(() => {
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md glass-panel rounded-3xl p-6 shadow-2xl relative border border-white/10">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-white glass-panel-subtle transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="mb-5">
          <div className="flex items-center gap-2 text-[10px] font-mono-code uppercase tracking-[0.25em] text-indigo-400">
            <MapPin className="w-3.5 h-3.5 text-indigo-400" />
            <span>Precise Location</span>
          </div>
          <h3 className="text-lg font-bold font-display text-white mt-1">
            Set Your City & Frequency
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Ensure your local time, weather, and chat badges match your exact location.
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-[11px] font-mono-code uppercase tracking-wider text-slate-300 mb-1.5">
              City Name
            </label>
            <div className="flex items-center gap-2 px-3.5 py-2.5 bg-white/5 rounded-2xl border border-white/10 focus-within:border-indigo-400">
              <Search className="w-4 h-4 text-indigo-400" />
              <input
                type="text"
                value={cityName}
                onChange={(e) => setCityName(e.target.value)}
                placeholder="e.g. Delhi, Pune, Bengaluru, Jaipur"
                maxLength={40}
                className="bg-transparent text-sm text-white font-mono-code outline-none flex-1"
                autoFocus
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-mono-code uppercase tracking-wider text-slate-400 mb-1">
                Country
              </label>
              <input
                type="text"
                value={countryName}
                onChange={(e) => setCountryName(e.target.value)}
                className="w-full px-3 py-2 bg-white/5 rounded-xl border border-white/10 text-xs text-white font-mono-code outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono-code uppercase tracking-wider text-slate-400 mb-1">
                Code (e.g. IN, US)
              </label>
              <input
                type="text"
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value.toUpperCase())}
                maxLength={4}
                className="w-full px-3 py-2 bg-white/5 rounded-xl border border-white/10 text-xs text-white font-mono-code outline-none uppercase"
              />
            </div>
          </div>

          {/* Quick Indian City Chips */}
          <div>
            <span className="block text-[10px] font-mono-code text-slate-400 mb-2">
              Quick select:
            </span>
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
              {POPULAR_INDIAN_CITIES.map((c) => (
                <button
                  key={c.city}
                  type="button"
                  onClick={() => handleSelectCity(c.city)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-mono-code transition-all ${
                    cityName.toLowerCase() === c.city.toLowerCase()
                      ? 'bg-indigo-600 text-white font-bold border border-indigo-400'
                      : 'bg-white/5 hover:bg-white/15 text-slate-300 border border-white/5'
                  }`}
                >
                  {c.city}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 px-4 rounded-2xl bg-white text-slate-950 hover:bg-indigo-50 font-mono-code text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              {saved ? <Check className="w-4 h-4 text-emerald-600" /> : <Globe className="w-4 h-4" />}
              <span>{saved ? 'LOCATION UPDATED' : 'APPLY MY CITY'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
