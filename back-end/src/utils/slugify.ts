export const slugify = (text: string): string => {
    return text
        .toString()
        .toLowerCase()
        .normalize("NFD") // split accented characters into their base characters and diacritical marks
        .replace(/[\u0300-\u036f]/g, "") // remove diacritical marks
        .trim()
        .replace(/\s+/g, "-") // replace spaces with -
        .replace(/[^\w-]+/g, "") // remove all non-word chars
        .replace(/--+/g, "-"); // replace multiple - with single -
};
