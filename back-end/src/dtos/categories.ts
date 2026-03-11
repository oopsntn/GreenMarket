export interface CreateCategoryBody {
    categoryTitle: string;
    categoryParentId?: number;
    categorySlug?: string;
}

export interface UpdateCategoryBody {
    categoryTitle?: string;
    categoryParentId?: number;
    categorySlug?: string;
    categoryPublished?: boolean;
}

export interface CategoryParams {
    id: string;
}