import { useState, useRef, useCallback } from "react";
import type { ChangeEvent, RefObject } from "react";

type UseCurrencyInputReturn = {
    rawValue: string;
    displayValue: string;
    handleChange: (e: ChangeEvent<HTMLInputElement>) => void;
    inputRef: RefObject<HTMLInputElement | null>;
    setRawValue: (value: number | string) => void;
    reset: () => void;
};

const stripNonDigits = (value: string): string => value.replace(/\D/g, "");

const parseNumericString = (value: string): number | null => {
    const normalized = value.trim();
    if (!normalized) return null;

    // 10000 or 10000.00 or 10000,00
    if (/^-?\d+([.,]\d+)?$/.test(normalized)) {
        const parsed = Number(normalized.replace(",", "."));
        return Number.isFinite(parsed) ? parsed : null;
    }

    // 10,000.00
    if (/^-?\d{1,3}(,\d{3})+(\.\d+)?$/.test(normalized)) {
        const parsed = Number(normalized.replace(/,/g, ""));
        return Number.isFinite(parsed) ? parsed : null;
    }

    // 10.000,00
    if (/^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(normalized)) {
        const parsed = Number(normalized.replace(/\./g, "").replace(",", "."));
        return Number.isFinite(parsed) ? parsed : null;
    }

    return null;
};

const normalizeExternalValueToRaw = (value: number | string): string => {
    if (value === null || value === undefined) return "";

    if (typeof value === "number") {
        if (!Number.isFinite(value)) return "";
        return String(Math.trunc(Math.abs(value)));
    }

    const parsed = parseNumericString(value);
    if (parsed !== null) {
        return String(Math.trunc(Math.abs(parsed)));
    }

    return stripNonDigits(String(value));
};

export const formatCurrency = (value: number | string): string => {
    const raw = stripNonDigits(String(value ?? ""));
    if (!raw) return "";
    return Number(raw).toLocaleString("vi-VN");
};

export const useCurrencyInput = (
    initialValue: number | string = ""
): UseCurrencyInputReturn => {
    const initialRaw = normalizeExternalValueToRaw(initialValue);
    const [rawValue, setRawValueState] = useState<string>(initialRaw);
    const inputRef = useRef<HTMLInputElement>(null);

    const displayValue = formatCurrency(rawValue);

    const setRawValue = useCallback((value: number | string) => {
        setRawValueState(normalizeExternalValueToRaw(value));
    }, []);

    const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        const input = e.target;
        const selectionStart = input.selectionStart ?? 0;

        const raw = stripNonDigits(input.value);
        const formatted = formatCurrency(raw);
        setRawValueState(raw);

        // Keep caret stable based on number of digits before cursor.
        const digitsBeforeCaret = stripNonDigits(input.value.slice(0, selectionStart)).length;

        requestAnimationFrame(() => {
            if (!inputRef.current) return;

            let nextPos = formatted.length;
            let digitsSeen = 0;

            for (let i = 0; i < formatted.length; i += 1) {
                if (/\d/.test(formatted[i])) {
                    digitsSeen += 1;
                }
                if (digitsSeen >= digitsBeforeCaret) {
                    nextPos = i + 1;
                    break;
                }
            }

            inputRef.current.setSelectionRange(nextPos, nextPos);
        });
    }, []);

    const reset = useCallback(() => {
        setRawValueState("");
    }, []);

    return {
        rawValue,
        displayValue,
        handleChange,
        inputRef,
        setRawValue,
        reset,
    };
};
