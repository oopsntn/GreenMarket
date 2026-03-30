import { db } from "../config/db.ts";
import { posts, postImages, postPromotions } from "../models/schema/index.ts";
import { eq, and, or, ilike, gte, lte, sql, SQL, inArray, getTableColumns } from "drizzle-orm";
import { GetPostsQueryDto } from "../dtos/post.ts";

export class PostService {
    static async getPublicPosts(query: GetPostsQueryDto) {
        const conditions: SQL[] = [eq(posts.postStatus, "approved")];

        if (query.search) {
            conditions.push(sql`to_tsvector('simple', ${posts.postTitle} || ' ' || coalesce(${posts.postContent}, '')) @@ websearch_to_tsquery('simple', ${query.search})`);
        }

        if (query.categoryId) {
            conditions.push(eq(posts.categoryId, Number(query.categoryId)));
        }

        if (query.minPrice) {
            conditions.push(gte(posts.postPrice, query.minPrice));
        }

        if (query.maxPrice) {
            conditions.push(lte(posts.postPrice, query.maxPrice));
        }

        if (query.location) {
            conditions.push(ilike(posts.postLocation, `%${query.location}%`));
        }

        // Pagination setup
        const page = Number(query.page) || 1;
        const limit = Number(query.limit) || 20;
        const offset = (page - 1) * limit;

        // Custom attributes filtering
        if (query.attributes) {
            try {
                const attrs = JSON.parse(query.attributes);
                if (Array.isArray(attrs)) {
                    for (const attr of attrs) {
                        if (attr.id && attr.value) {
                            // Using EXISTS subquery for JSON flexibility without joins multiplying rows
                            conditions.push(sql`EXISTS (
                                SELECT 1 FROM post_attribute_values pav 
                                WHERE pav.post_id = ${posts.postId} 
                                AND pav.attribute_id = ${Number(attr.id)} 
                                AND pav.attribute_value = ${String(attr.value)}
                            )`);
                        }
                    }
                }
            } catch (e) {
                console.warn("Invalid attributes format passed to getPublicPosts", e);
            }
        }

        const queryBuilder = db.select({
            ...getTableColumns(posts),
            isPromoted: sql<boolean>`CASE WHEN ${postPromotions.postPromotionId} IS NOT NULL THEN true ELSE false END`.as('isPromoted')
        })
        .from(posts)
        .leftJoin(
            postPromotions,
            and(
                eq(posts.postId, postPromotions.postPromotionPostId),
                eq(postPromotions.postPromotionStatus, "active"),
                sql`${postPromotions.postPromotionEndAt} > NOW()`
            )
        );

        const data = await queryBuilder
            .where(and(...conditions))
            .limit(limit)
            .offset(offset)
            .orderBy(
                sql`CASE WHEN ${postPromotions.postPromotionId} IS NOT NULL THEN 1 ELSE 0 END DESC`,
                sql`${posts.postCreatedAt} DESC`
            );

        const countResult = await db.select({ count: sql<number>`count(*)` })
            .from(posts)
            .where(and(...conditions));

        const totalItems = Number(countResult[0]?.count) || 0;
        const totalPages = Math.ceil(totalItems / limit);

        if (data.length > 0) {
            const postIds = data.map(p => p.postId as number);
            const images = await db.select()
                .from(postImages)
                .where(inArray(postImages.postId, postIds));
                
            const dataWithImages = data.map(post => ({
                ...post,
                images: images.filter(img => img.postId === post.postId)
            }));
            
            return {
                data: dataWithImages,
                meta: { totalItems, totalPages, currentPage: page, limit }
            };
        }

        return {
            data: [],
            meta: { totalItems: 0, totalPages: 0, currentPage: page, limit }
        };
    }
}
