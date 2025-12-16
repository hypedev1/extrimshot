import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ChevronDown, Loader2 } from 'lucide-react';

interface PathaoLocation {
  city_id?: number;
  city_name?: string;
  zone_id?: number;
  zone_name?: string;
  area_id?: number;
  area_name?: string;
}

interface PathaoLocationSelectorProps {
  onLocationChange: (location: {
    cityId: number | null;
    zoneId: number | null;
    areaId: number | null;
  }) => void;
}

export const PathaoLocationSelector = ({ onLocationChange }: PathaoLocationSelectorProps) => {
  const [cities, setCities] = useState<PathaoLocation[]>([]);
  const [zones, setZones] = useState<PathaoLocation[]>([]);
  const [areas, setAreas] = useState<PathaoLocation[]>([]);
  
  const [selectedCity, setSelectedCity] = useState<number | null>(null);
  const [selectedZone, setSelectedZone] = useState<number | null>(null);
  const [selectedArea, setSelectedArea] = useState<number | null>(null);
  
  const [loadingCities, setLoadingCities] = useState(true);
  const [loadingZones, setLoadingZones] = useState(false);
  const [loadingAreas, setLoadingAreas] = useState(false);

  // Fetch cities on mount
  useEffect(() => {
    const fetchCities = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('pathao-courier', {
          body: { action: 'get_cities' },
        });
        
        if (error) throw error;
        setCities(data?.data?.data || []);
      } catch (err) {
        console.error('Failed to fetch cities:', err);
      } finally {
        setLoadingCities(false);
      }
    };
    
    fetchCities();
  }, []);

  // Fetch zones when city changes
  useEffect(() => {
    if (!selectedCity) {
      setZones([]);
      setSelectedZone(null);
      return;
    }

    const fetchZones = async () => {
      setLoadingZones(true);
      setZones([]);
      setAreas([]);
      setSelectedZone(null);
      setSelectedArea(null);
      
      try {
        const { data, error } = await supabase.functions.invoke('pathao-courier', {
          body: { action: 'get_zones', cityId: selectedCity },
        });
        
        if (error) throw error;
        setZones(data?.data?.data || []);
      } catch (err) {
        console.error('Failed to fetch zones:', err);
      } finally {
        setLoadingZones(false);
      }
    };
    
    fetchZones();
  }, [selectedCity]);

  // Fetch areas when zone changes
  useEffect(() => {
    if (!selectedZone) {
      setAreas([]);
      setSelectedArea(null);
      return;
    }

    const fetchAreas = async () => {
      setLoadingAreas(true);
      setAreas([]);
      setSelectedArea(null);
      
      try {
        const { data, error } = await supabase.functions.invoke('pathao-courier', {
          body: { action: 'get_areas', zoneId: selectedZone },
        });
        
        if (error) throw error;
        setAreas(data?.data?.data || []);
      } catch (err) {
        console.error('Failed to fetch areas:', err);
      } finally {
        setLoadingAreas(false);
      }
    };
    
    fetchAreas();
  }, [selectedZone]);

  // Notify parent of location changes
  useEffect(() => {
    onLocationChange({
      cityId: selectedCity,
      zoneId: selectedZone,
      areaId: selectedArea,
    });
  }, [selectedCity, selectedZone, selectedArea, onLocationChange]);

  const selectStyles = "w-full bg-secondary border border-border rounded-xl px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <div className="space-y-3">
      {/* City Selector */}
      <div>
        <label className="block text-sm font-medium mb-2">শহর / City *</label>
        <div className="relative">
          <select
            value={selectedCity || ''}
            onChange={(e) => setSelectedCity(e.target.value ? Number(e.target.value) : null)}
            disabled={loadingCities}
            className={selectStyles}
          >
            <option value="">শহর নির্বাচন করুন</option>
            {cities.map((city) => (
              <option key={city.city_id} value={city.city_id}>
                {city.city_name}
              </option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            {loadingCities ? (
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
        </div>
      </div>

      {/* Zone Selector */}
      <div>
        <label className="block text-sm font-medium mb-2">জোন / Zone *</label>
        <div className="relative">
          <select
            value={selectedZone || ''}
            onChange={(e) => setSelectedZone(e.target.value ? Number(e.target.value) : null)}
            disabled={!selectedCity || loadingZones}
            className={selectStyles}
          >
            <option value="">জোন নির্বাচন করুন</option>
            {zones.map((zone) => (
              <option key={zone.zone_id} value={zone.zone_id}>
                {zone.zone_name}
              </option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            {loadingZones ? (
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
        </div>
      </div>

      {/* Area Selector */}
      <div>
        <label className="block text-sm font-medium mb-2">এলাকা / Area</label>
        <div className="relative">
          <select
            value={selectedArea || ''}
            onChange={(e) => setSelectedArea(e.target.value ? Number(e.target.value) : null)}
            disabled={!selectedZone || loadingAreas}
            className={selectStyles}
          >
            <option value="">এলাকা নির্বাচন করুন (ঐচ্ছিক)</option>
            {areas.map((area) => (
              <option key={area.area_id} value={area.area_id}>
                {area.area_name}
              </option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            {loadingAreas ? (
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
