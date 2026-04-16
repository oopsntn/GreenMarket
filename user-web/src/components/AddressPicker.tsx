import React, { useState, useEffect } from 'react';
import type { Province, District, Ward } from '../services/addressService';
import { getProvinces, getDistricts, getWards, reverseGeocode, geocodeAddress } from '../services/addressService';
import { MapPin, Navigation, Loader2, Globe, Map as MapIcon, X, Search } from 'lucide-react';

interface AddressPickerProps {
  initialValue?: string;
  onAddressChange: (fullAddress: string) => void;
  onLocationSelect?: (lat: number, lng: number) => void;
  onError?: (message: string) => void;
  label?: string;
}

const AddressPicker: React.FC<AddressPickerProps> = ({ initialValue, onAddressChange, onLocationSelect, onError, label }) => {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);

  const [specificAddress, setSpecificAddress] = useState('');
  const [selectedP, setSelectedP] = useState<number | ''>('');
  const [selectedD, setSelectedD] = useState<number | ''>('');
  const [selectedW, setSelectedW] = useState<number | ''>('');

  const [loading, setLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [pendingMapCoords, setPendingMapCoords] = useState<{lat: number, lng: number} | null>(null);

  const [mapSearchQuery, setMapSearchQuery] = useState('');
  const [searchingMap, setSearchingMap] = useState(false);

  // For Map Picker
  useEffect(() => {
    if (showMap) {
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }
      if (!document.getElementById('leaflet-js')) {
        const script = document.createElement('script');
        script.id = 'leaflet-js';
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = () => initMap();
        document.head.appendChild(script);
      } else {
        initMap();
      }
    }
  }, [showMap]);

  const initMap = () => {
    setTimeout(() => {
      const L = (window as any).L;
      if (!L) return;
      const mapContainer = document.getElementById('map-picker');
      if (!mapContainer) return;
      
      const existingMap = (window as any)._mapPickerInstance;
      if (existingMap) existingMap.remove();

      const initialLat = pendingMapCoords?.lat || 21.0285;
      const initialLng = pendingMapCoords?.lng || 105.8542;

      const map = L.map('map-picker').setView([initialLat, initialLng], 16);
      (window as any)._mapPickerInstance = map;
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

      let marker = L.marker([initialLat, initialLng], { draggable: true }).addTo(map);

      map.on('click', (e: any) => {
        marker.setLatLng(e.latlng);
      });

      (window as any)._updateMapLocation = (lat: number, lng: number) => {
        map.setView([lat, lng], 16);
        marker.setLatLng([lat, lng]);
      };

      (window as any)._confirmMapSelection = async () => {
        const pos = marker.getLatLng();
        if (onLocationSelect) {
            onLocationSelect(pos.lat, pos.lng);
        }
        setShowMap(false);
      };
    }, 100);
  };

  const handleMapSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!mapSearchQuery.trim()) return;
    
    setSearchingMap(true);
    const coords = await geocodeAddress(mapSearchQuery);
    if (coords) {
      if ((window as any)._updateMapLocation) {
        (window as any)._updateMapLocation(coords.lat, coords.lng);
      }
    } else {
      if (onError) onError("Không tìm thấy địa điểm này.");
      else alert("Không tìm thấy địa điểm này.");
    }
    setSearchingMap(false);
  };

  const normalizeLocationStr = (str?: string) => {
    if (!str) return '';
    return str.toLowerCase()
      .replace(/^(tỉnh|thành phố|thành phố|tp\.?|thị xã|quận|huyện|phường|xã|thị trấn|q\.?|h\.?|p\.?|x\.?|tt\.?)\s+/i, '')
      .trim();
  };

  const isLocationMatch = (str1: string, str2: string) => {
    if (!str1 || !str2) return false;
    const n1 = normalizeLocationStr(str1);
    const n2 = normalizeLocationStr(str2);
    // Exact or contains match on normalized strings
    return n1 === n2 || n1.includes(n2) || n2.includes(n1);
  };

[]

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const data = await getProvinces();
        setProvinces(data);
        
        if (initialValue) {
            const parts = initialValue.split(',').map(s => s.trim());
            // Parts: [Specific, Ward, District, Province]
            if (parts.length >= 3) {
                const provName = parts[parts.length - 1];
                const distName = parts[parts.length - 2];
                const wardName = parts[parts.length - 3];
                const specAddr = parts.slice(0, parts.length - 3).join(', ');
                
                setSpecificAddress(specAddr);

                const foundP = data.find(p => p.name.includes(provName) || provName.includes(p.name));
                if (foundP) {
                    setSelectedP(foundP.code);
                    const ds = await getDistricts(foundP.code);
                    setDistricts(ds);
                    const foundD = ds.find(d => d.name.includes(distName) || distName.includes(d.name));
                    if (foundD) {
                        setSelectedD(foundD.code);
                        const ws = await getWards(foundD.code);
                        setWards(ws);
                        const foundW = ws.find(w => w.name.includes(wardName) || wardName.includes(w.name));
                        if (foundW) setSelectedW(foundW.code);
                    }
                }
            } else if (parts.length === 1 && parts[0]) {
                setSpecificAddress(parts[0]);
            }
        }
      } catch (error) {
        console.error("Failed to load provinces", error);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handlePChange = async (code: number) => {
    setSelectedP(code);
    setSelectedD('');
    setSelectedW('');
    setWards([]);
    setLoading(true);
    const ds = await getDistricts(code);
    setDistricts(ds);
    setLoading(false);

    const pName = provinces.find(p => p.code === code)?.name;
    if (pName) {
      geocodeAddress(`${pName}, Việt Nam`).then(coords => {
        if (coords) {
          setPendingMapCoords(coords);
          if (showMap && (window as any)._updateMapLocation) {
            (window as any)._updateMapLocation(coords.lat, coords.lng);
          }
        }
      });
    }
  };

  const handleDChange = async (code: number) => {
    setSelectedD(code);
    setSelectedW('');
    setLoading(true);
    const ws = await getWards(code);
    setWards(ws);
    setLoading(false);

    const dName = districts.find(d => d.code === code)?.name;
    const pName = provinces.find(p => p.code === selectedP)?.name || '';
    if (dName && pName) {
      geocodeAddress(`${dName}, ${pName}, Việt Nam`).then(coords => {
        if (coords) {
          setPendingMapCoords(coords);
          if (showMap && (window as any)._updateMapLocation) {
            (window as any)._updateMapLocation(coords.lat, coords.lng);
          }
        }
      });
    }
  };

  const handleWChange = (code: number) => {
    setSelectedW(code);
    const pName = provinces.find(p => p.code === selectedP)?.name || '';
    const dName = districts.find(d => d.code === selectedD)?.name || '';
    const wName = wards.find(w => w.code === code)?.name || '';
    const finalAddr = `${specificAddress ? specificAddress + ', ' : ''}${wName}, ${dName}, ${pName}`;
    onAddressChange(finalAddr);

    if (wName && dName && pName) {
      geocodeAddress(`${wName}, ${dName}, ${pName}, Việt Nam`).then(coords => {
        if (coords) {
          setPendingMapCoords(coords);
          if (showMap && (window as any)._updateMapLocation) {
            (window as any)._updateMapLocation(coords.lat, coords.lng);
          }
        }
      });
    }
  };

  const handleSpecificChange = (val: string) => {
    setSpecificAddress(val);
    const pName = provinces.find(p => p.code === selectedP)?.name || '';
    const dName = districts.find(d => d.code === selectedD)?.name || '';
    const wName = wards.find(w => w.code === selectedW)?.name || '';
    
    let finalAddr = '';
    if (val) finalAddr += val;
    if (wName) finalAddr += (finalAddr ? ', ' : '') + wName;
    if (dName) finalAddr += (finalAddr ? ', ' : '') + dName;
    if (pName) finalAddr += (finalAddr ? ', ' : '') + pName;
    
    onAddressChange(finalAddr);
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      const msg = "Trình duyệt của bạn không hỗ trợ định vị hoặc tính năng này yêu cầu kết nối bảo mật (HTTPS).";
      if (onError) onError(msg);
      else alert(msg);
      return;
    }

    if (window.isSecureContext === false) {
      const msg = "Tính năng định vị GPS yêu cầu trang web phải kết nối an toàn (HTTPS hoặc localhost). Vui lòng sử dụng tính năng 'Bản đồ' để tự chọn vị trí.";
      if (onError) onError(msg);
      else alert(msg);
      return;
    }

    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;
      setPendingMapCoords({ lat: latitude, lng: longitude });
      if (showMap && (window as any)._updateMapLocation) {
        (window as any)._updateMapLocation(latitude, longitude);
      } else {
        setShowMap(true); // Open map modal with these coords
      }
      setGeoLoading(false);
    }, (err) => {
      console.error(err);
      let msg = "Không thể lấy vị trí hiện tại do lỗi tín hiệu hoặc trình duyệt. Vui lòng sử dụng tính năng 'Bản đồ' để tự chọn.";
      if (err.code === 1) {
        msg = "Bạn đã từ chối quyền truy cập vị trí. Vui lòng cấp quyền trong cài đặt trình duyệt để tiếp tục.";
      }
      if (onError) onError(msg);
      else alert(msg);
      setGeoLoading(false);
    }, { timeout: 10000, enableHighAccuracy: true });
  };

  return (
    <div className="space-y-4">
      <div className="mb-1">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">{label || 'Địa chỉ (Tỉnh / Quận / Xã)'}</label>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Row 1: Province, District, Ward */}
        <div className="relative group">
          <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          <select 
            value={selectedP}
            onChange={(e) => handlePChange(Number(e.target.value))}
            className="w-full bg-surface border border-white/10 pl-11 pr-4 py-3.5 rounded-2xl focus:border-emerald-500 outline-none transition-all text-sm font-medium appearance-none"
          >
            <option value="">-- Tỉnh / Thành --</option>
            {provinces.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}
          </select>
        </div>

        <div className="relative group">
          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          <select 
            disabled={!selectedP}
            value={selectedD}
            onChange={(e) => handleDChange(Number(e.target.value))}
            className="w-full bg-surface border border-white/10 pl-11 pr-4 py-3.5 rounded-2xl focus:border-emerald-500 outline-none transition-all text-sm font-medium appearance-none disabled:opacity-50"
          >
            <option value="">-- Quận / Huyện --</option>
            {districts.map(d => <option key={d.code} value={d.code}>{d.name}</option>)}
          </select>
        </div>

        <div className="relative group">
          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          <select 
            disabled={!selectedD}
            value={selectedW}
            onChange={(e) => handleWChange(Number(e.target.value))}
            className="w-full bg-surface border border-white/10 pl-11 pr-4 py-3.5 rounded-2xl focus:border-emerald-500 outline-none transition-all text-sm font-medium appearance-none disabled:opacity-50"
          >
            <option value="">-- Xã / Phường --</option>
            {wards.map(w => <option key={w.code} value={w.code}>{w.name}</option>)}
          </select>
        </div>
      </div>

      {/* Row 2: Specific Address & Map/GPS buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative group flex-1">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 flex items-center justify-center font-bold text-[10px]">#</div>
            <input 
                type="text"
                placeholder="Địa chỉ cụ thể (Số nhà, tên đường...)"
                className="w-full bg-surface border border-white/10 pl-11 pr-4 py-3.5 rounded-2xl focus:border-emerald-500 outline-none transition-all text-sm font-medium"
                value={specificAddress}
                onChange={(e) => handleSpecificChange(e.target.value)}
            />
        </div>
        <div className="flex gap-2">
            <button 
                type="button"
                onClick={() => setShowMap(true)}
                className="px-4 py-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition-all flex items-center gap-2 group"
                title="Chọn vị trí trên bản đồ"
            >
                <MapIcon className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold uppercase tracking-wider hidden sm:inline">Bản đồ</span>
            </button>
            <button 
                type="button"
                onClick={handleGetCurrentLocation}
                className="px-4 py-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/20 transition-all flex items-center gap-2 group"
                title="Sử dụng GPS"
            >
                {geoLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4 group-hover:scale-110 transition-transform" />}
                <span className="text-xs font-bold uppercase tracking-wider hidden sm:inline">GPS</span>
            </button>
        </div>
      </div>
      
      {loading && (
        <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
            <Loader2 className="w-3 h-3 animate-spin text-emerald-500" />
            Đang tải dữ liệu...
        </div>
      )}

      {/* Map Picker Modal */}
      {showMap && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-surface border border-white/10 w-full max-w-2xl rounded-3xl overflow-hidden flex flex-col shadow-2xl">
                <div className="p-4 border-b border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white/5 gap-3">
                    <h3 className="font-bold flex items-center gap-2 text-slate-800">
                        <MapIcon className="w-5 h-5 text-emerald-500" />
                        Ghim vị trí trên bản đồ
                    </h3>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <div className="flex flex-1 relative">
                            <input 
                                type="text" 
                                placeholder="Tìm địa điểm..." 
                                value={mapSearchQuery}
                                onChange={(e) => setMapSearchQuery(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleMapSearch();
                                    }
                                }}
                                className="bg-slate-100 border border-slate-200 text-slate-800 text-sm px-3 py-1.5 rounded-l-lg w-full outline-none focus:border-emerald-500"
                            />
                            <button 
                                type="button" 
                                onClick={() => handleMapSearch()}
                                disabled={searchingMap}
                                className="bg-emerald-500 text-white px-3 py-1.5 rounded-r-lg hover:bg-emerald-600 disabled:opacity-50"
                            >
                                {searchingMap ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                            </button>
                        </div>
                        <button type="button" onClick={() => setShowMap(false)} className="p-1.5 bg-slate-200 text-slate-600 hover:bg-slate-300 rounded-lg transition-colors ml-auto shrink-0">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
                <div id="map-picker" className="h-[400px] w-full bg-slate-900"></div>
                <div className="p-4 sm:p-6 bg-white/5 border-t border-white/5 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                    <span className="text-xs text-slate-500 italic">Click vào bản đồ hoặc tìm kiếm để ghim tọa độ.</span>
                    <div className="flex justify-end gap-3 w-full sm:w-auto">
                        <button 
                            type="button"
                            onClick={() => setShowMap(false)}
                            className="px-6 py-2.5 rounded-xl font-bold text-sm text-slate-400 hover:text-white transition-colors border border-slate-700 hover:bg-slate-800"
                        >
                            Hủy
                        </button>
                        <button 
                            type="button"
                            onClick={() => (window as any)._confirmMapSelection()}
                            className="px-8 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-900/40 transition-all active:scale-95 flex-1 sm:flex-none"
                        >
                            Xác nhận vị trí
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default AddressPicker;
