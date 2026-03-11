export const parseId = (id: string): number | null => {
    const parsed = Number(id);

    if (isNaN(parsed)) {
        return null;
    }

    return parsed;
};