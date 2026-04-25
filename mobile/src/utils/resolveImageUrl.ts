import { getServerBaseUrl } from '../config/api';

type ResolveImageOptions = {
    debugLabel?: string;
}

const ABSOLUTE_URL_PATTERN = /^https?:\/\//i;
const DATA_URL_PATTERN = /^data:/i;

const normalizeServerBase = () => {
    const serverBase = getServerBaseUrl();
    return serverBase.endsWith('/') ? serverBase.slice(0, -1) : serverBase;
}

export const resolveImageUrl = (
    url: string | undefined | null,
    options?: ResolveImageOptions,
) => {
    const rawUrl = typeof url === 'string' ? url.trim() : '';

    if (!rawUrl) {
        return '';
    }

    if (ABSOLUTE_URL_PATTERN.test(rawUrl) || DATA_URL_PATTERN.test(rawUrl)) {
        return rawUrl;
    }

    if (rawUrl.startsWith('//')) {
        return `https:${rawUrl}`;
    }

    const cleanPath = rawUrl.startsWith('/') ? rawUrl : `/${rawUrl}`;
    const resolvedUrl = `${normalizeServerBase()}${cleanPath}`;

    if (__DEV__) {
        console.log('[Media Resolve]', {
            label: options?.debugLabel || 'image',
            rawUrl,
            resolvedUrl,
        });
    }

    return resolvedUrl;
};

export const logMediaResolveError = (
    label: string,
    url: string | undefined | null,
    error?: unknown,
) => {
    const resolvedUrl = resolveImageUrl(url, { debugLabel: label });
    console.error('[Media Resolve Error]', {
        label,
        rawUrl: url ?? null,
        resolvedUrl,
        error,
    });
};
