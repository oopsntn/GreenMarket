import { getServerBaseUrl } from '../config/api';

export const resolveImageUrl = (url: string | undefined | null) => {
    if (!url) {
        return '';
    }

    if (url.startsWith('http')) {
        return url;
    }

    // Xóa dấu / ở đầu nếu có để tránh / bị double
    const cleanPath = url.startsWith('/') ? url.slice(1) : url;
    
    // Đảm bảo getServerBaseUrl() đã loại bỏ trailing slash
    const serverBase = getServerBaseUrl();
    const cleanServerBase = serverBase.endsWith('/') ? serverBase.slice(0, -1) : serverBase;

    return `${cleanServerBase}/${cleanPath}`;
};
