export interface CategoryDTO {
    categoryId: number;
    categoryParentId?: number | null;
    categoryTitle: string;
    categorySlug: string;
    categoryPublished: boolean;
    categoryCreatedAt: Date;
    categoryUpdatedAt: Date;
}

export type CreateCategoryDTO = Omit<CategoryDTO, "categoryId" | "categoryCreatedAt" | "categoryUpdatedAt">;
export type UpdateCategoryDTO = Partial<CreateCategoryDTO>;

export interface CategoryParams {
    id: string;
}