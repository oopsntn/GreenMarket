import axios from "axios";

const VN_PROVINCES_API = 'https://provinces.open-ai.vn/api'
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

export const getProvinces = async (): Promise<Province[]> => {
    const res = await axios(`${VN_PROVINCES_API}/p/`)
    return res.data
}

export const getDistricts = async (provinceCode: number): Promise<District[]> => {
    const res = await axios(`${VN_PROVINCES_API}/p/${provinceCode}?depth=2`)
    return res.data.district || []
}

export const getWards = async (districtCode: number): Promise<Ward[]> => {
    const res = await axios(`${VN_PROVINCES_API}/d/${districtCode}?depth=2`)
    return res.data.ward || []
}

export const reverseGeocode = async (lat: number, lng: number): Promise<ReverseGeocodeResult | null> => {
    try {
        const res = await axios.get(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
            {
                headers: {
                    'Accept-Language': 'vi',
                },
            }
        );
        const data = res.data
        const address = data?.address
        return {
            province: address?.province || address?.city || address?.state || '',
            district: address?.district || address?.town || address?.city_district || address?.county || address?.suburb || '',
            ward: address?.ward || address?.village || address?.quarter || address?.suburb || '',
            specific: address?.house_number ? `${address?.house_number}, ${address?.road}`.trim() : address?.road || '',
            full: data?.display_name || ''
        }
    } catch (e) {
        console.error(`addressService reverseGeocode: ${e}`)
        return null
    }
}

export const geocodeAddress = async (address: string): Promise<{ lat: number, lng: number } | null> => {
    try {
        const res = await axios.get(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
            {
                headers: {
                    'Accept-Language': 'vi',
                },
            }
        );
        const data = res.data
        if (data.length === 0) return null
        return {
            lat: parseFloat(data[0].lat),
            lng: parseFloat(data[0].lon)
        }
    } catch (e) {
        console.error(`addressService geocodeAddress: ${e}`)
        return null
    }
}