import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

type PaymentRedirectPayload = {
    status?: string;
    code?: string;
    txnRef?: string;
    message?: string;
};

const readParam = (value: unknown): string | undefined => {
    if (typeof value === 'string' && value.trim().length > 0) return value;
    if (Array.isArray(value) && typeof value[0] === 'string' && value[0].trim().length > 0) {
        return value[0];
    }
    return undefined;
};

export const getPaymentRedirectUrl = () => Linking.createURL('payment-result');

export const parsePaymentRedirectUrl = (url: string): PaymentRedirectPayload => {
    const parsed = Linking.parse(url);
    const query = (parsed.queryParams || {}) as Record<string, unknown>;
    const responseCode = readParam(query.vnp_ResponseCode);
    const status = readParam(query.status) || (responseCode === '00' ? 'success' : 'failed');

    return {
        status,
        code: readParam(query.code) || responseCode,
        txnRef: readParam(query.txnRef) || readParam(query.vnp_TxnRef),
        message: readParam(query.message),
    };
};

export const openPaymentAuthSession = async (paymentUrl: string): Promise<PaymentRedirectPayload | null> => {
    const redirectUrl = getPaymentRedirectUrl();
    const result = await WebBrowser.openAuthSessionAsync(paymentUrl, redirectUrl);

    if (result.type !== 'success' || !('url' in result) || !result.url) {
        return null;
    }

    return parsePaymentRedirectUrl(result.url);
};
