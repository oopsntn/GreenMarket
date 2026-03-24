import axios from 'axios';

const VN_PROVINCES_API = 'https://provinces.open-api.vn/api';

export interface Province {
  code: number;
  name: string;
}

export interface District {
  code: number;
  name: string;
}

export interface Ward {
  code: number;
  name: string;
}

export const getProvinces = async (): Promise<Province[]> => {
  const res = await axios.get(`${VN_PROVINCES_API}/p/`);
  return res.data;
};

export const getDistricts = async (provinceCode: number): Promise<District[]> => {
  const res = await axios.get(`${VN_PROVINCES_API}/p/${provinceCode}?depth=2`);
  return res.data.districts;
};

export const getWards = async (districtCode: number): Promise<Ward[]> => {
  const res = await axios.get(`${VN_PROVINCES_API}/d/${districtCode}?depth=2`);
  return res.data.wards;
};

export const reverseGeocode = async (lat: number, lon: number) => {
  try {
    const res = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`, {
      headers: {
        'Accept-Language': 'vi'
      }
    });
    const addr = res.data.address;
    return {
      province: addr.city || addr.state || addr.province || '',
      district: addr.district || addr.suburb || addr.city_district || addr.county || '',
      ward: addr.ward || addr.quarter || addr.suburb || addr.village || '',
      full: res.data.display_name
    };
  } catch (error) {
    console.error("Reverse geocoding failed", error);
    return null;
  }
};

export const geocodeAddress = async (query: string): Promise<{ lat: number, lng: number } | null> => {
  try {
    const res = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`, {
      headers: {
        'Accept-Language': 'vi'
      }
    });
    
    if (res.data && res.data.length > 0) {
      return {
        lat: parseFloat(res.data[0].lat),
        lng: parseFloat(res.data[0].lon)
      };
    }
    return null;
  } catch (error) {
    console.error("Forward geocoding failed", error);
    return null;
  }
};
