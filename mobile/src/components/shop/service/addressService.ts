import axios from 'axios';

const VN_PROVINCES_API = 'https://provinces.open-api.vn/api/v1';
const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';
const NOMINATIM_EMAIL = 'haiphongduong69@gmail.com';

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

export interface ReverseGeocodeResult {
    province: string;
    district: string;
    ward: string;
    specific: string;
    full: string;
}

const nominatimHeaders = {
    'Accept-Language': 'vi',
    'User-Agent': 'GreenMarketMobile/1.0 (Expo React Native)',
};

export const getProvinces = async (): Promise<Province[]> => {
    const res = await axios.get(`${VN_PROVINCES_API}/p/`, { timeout: 10000 });
    return res.data || [];
};

export const getDistricts = async (provinceCode: number): Promise<District[]> => {
    const res = await axios.get(`${VN_PROVINCES_API}/p/${provinceCode}?depth=2`, { timeout: 10000 });
    return res.data?.districts || [];
};

export const getWards = async (districtCode: number): Promise<Ward[]> => {
    const res = await axios.get(`${VN_PROVINCES_API}/d/${districtCode}?depth=2`, { timeout: 10000 });
    return res.data?.wards || [];
};

export const reverseGeocode = async (
    lat: number,
    lng: number
): Promise<ReverseGeocodeResult | null> => {
    try {
        const res = await axios.get(
            `${NOMINATIM_BASE_URL}/reverse`,
            {
                params: {
                    format: 'json',
                    lat,
                    lon: lng,
                    addressdetails: 1,
                    email: NOMINATIM_EMAIL,
                },
                headers: nominatimHeaders,
                timeout: 12000,
            }
        );

        const data = res.data;
        const address = data?.address || {};

        return {
            province: address.province || address.city || address.state || '',
            district:
                address.district ||
                address.town ||
                address.city_district ||
                address.county ||
                address.suburb ||
                '',
            ward:
                address.ward ||
                address.village ||
                address.quarter ||
                address.suburb ||
                '',
            specific: address.house_number
                ? `${address.house_number} ${address.road || ''}`.trim()
                : address.road || '',
            full: data?.display_name || '',
        };
    } catch (e: any) {
        console.error('addressService reverseGeocode error:', {
            status: e?.response?.status,
            data: e?.response?.data,
            message: e?.message,
        });
        return null;
    }
};

export const geocodeAddress = async (
    address: string
): Promise<{ lat: number; lng: number } | null> => {
    try {
        const res = await axios.get(
            `${NOMINATIM_BASE_URL}/search`,
            {
                params: {
                    format: 'json',
                    q: address,
                    limit: 1,
                    email: NOMINATIM_EMAIL,
                },
                headers: nominatimHeaders,
                timeout: 12000,
            }
        );

        const data = res.data;
        if (!Array.isArray(data) || data.length === 0) return null;

        return {
            lat: parseFloat(data[0].lat),
            lng: parseFloat(data[0].lon),
        };
    } catch (e: any) {
        console.error('addressService geocodeAddress error:', {
            status: e?.response?.status,
            data: e?.response?.data,
            message: e?.message,
        });
        return null;
    }
};