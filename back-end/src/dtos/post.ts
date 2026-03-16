export interface GetPostsQueryDto {
    search?: string;
    categoryId?: string;
    minPrice?: string;
    maxPrice?: string;
    location?: string;
    attributes?: string; // Expecting JSON string of key-value pairs or array of attribute IDs
    page?: string;
    limit?: string;
}
