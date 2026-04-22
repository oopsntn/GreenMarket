import { db } from "../config/db";
import { posts, mediaAssets, postPromotions, placementSlots } from "../models/schema/index";
import { eq, and, or, ilike, gte, lte, sql, SQL, inArray, getTableColumns } from "drizzle-orm";
import { GetPostsQueryDto } from "../dtos/post";
import { BOOST_POST_SLOT_PREFIX } from "../constants/promotion";
import { postLifecycleService } from "./postLifecycle.service";

export class PostService {
    static async getPublicPosts(query: GetPostsQueryDto) {
        await postLifecycleService.syncAutoExpiredPosts();
        const conditions: SQL[] = [
            eq(posts.postStatus, "approved"),
            eq(posts.postPublished, true)
        ];

        if (query.search) {
            conditions.push(sql`to_tsvector('simple', ${posts.postTitle}) @@ websearch_to_tsquery('simple', ${query.search})`);
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

        // Rank live boost promotions inside each slot so the public feed only renders
        // up to the configured slot capacity. If old data exceeds capacity, newer
        // promotions win and older overflow rows are hidden from the homepage feed.
        const rankedPromotions = db
            .select({
                promotionId: postPromotions.postPromotionId,
                postId: postPromotions.postPromotionPostId,
                slotId: postPromotions.postPromotionSlotId,
                slotCapacity: sql<number>`
                    COALESCE(${placementSlots.placementSlotCapacity}, 1)
                `.as("slotCapacity"),
                promotionPriority: sql<number>`
                    COALESCE(
                        ${postPromotions.postPromotionSnapshotPriority},
                        CASE
                            WHEN (${placementSlots.placementSlotRules} ->> 'priority') ~ '^[0-9]+$'
                                THEN (${placementSlots.placementSlotRules} ->> 'priority')::int
                            ELSE 1
                        END
                    )
                `.as("promotionPriority"),
                slotRank: sql<number>`
                    ROW_NUMBER() OVER (
                        PARTITION BY ${postPromotions.postPromotionSlotId}
                        ORDER BY
                            COALESCE(
                                ${postPromotions.postPromotionSnapshotPriority},
                                CASE
                                    WHEN (${placementSlots.placementSlotRules} ->> 'priority') ~ '^[0-9]+$'
                                        THEN (${placementSlots.placementSlotRules} ->> 'priority')::int
                                    ELSE 1
                                END
                            ) ASC,
                            ${postPromotions.postPromotionCreatedAt} DESC,
                            ${postPromotions.postPromotionId} DESC
                    )
                `.as("slotRank"),
            })
            .from(postPromotions)
            .leftJoin(
                placementSlots,
                eq(postPromotions.postPromotionSlotId, placementSlots.placementSlotId)
            )
            .where(
                and(
                    eq(postPromotions.postPromotionStatus, "active"),
                    sql`${postPromotions.postPromotionEndAt} > NOW()`,
                    sql`UPPER(${placementSlots.placementSlotCode}) LIKE ${`${BOOST_POST_SLOT_PREFIX}%`}`
                )
            )
            .as("rankedPromotions");

        // Aggregate eligible promotions per post after applying slot capacity.
        const activePromotions = db
            .select({
                postId: rankedPromotions.postId,
                promotionPriority: sql<number>`MIN(${rankedPromotions.promotionPriority})`.as("promotionPriority"),
            })
            .from(rankedPromotions)
            .where(sql`${rankedPromotions.slotRank} <= ${rankedPromotions.slotCapacity}`)
            .groupBy(rankedPromotions.postId)
            .as("activePromotions");

        const queryBuilder = db.select({
            ...getTableColumns(posts),
            isPromoted: sql<boolean>`CASE WHEN ${activePromotions.postId} IS NOT NULL THEN true ELSE false END`.as("isPromoted"),
            promotionPriority: sql<number>`COALESCE(${activePromotions.promotionPriority}, 0)`.as("promotionPriority"),
        })
        .from(posts)
        .leftJoin(
            activePromotions,
            eq(posts.postId, activePromotions.postId)
        );

        const data = await queryBuilder
            .where(and(...conditions))
            .limit(limit)
            .offset(offset)
            .orderBy(
                sql`CASE WHEN ${activePromotions.postId} IS NOT NULL THEN 0 ELSE 1 END ASC`,
                sql`COALESCE(${activePromotions.promotionPriority}, 999999) ASC`,
                sql`${posts.postCreatedAt} DESC`
            );

        const countResult = await db.select({ count: sql<number>`count(*)` })
            .from(posts)
            .where(and(...conditions));

        const totalItems = Number(countResult[0]?.count) || 0;
        const totalPages = Math.ceil(totalItems / limit);

        if (data.length > 0) {
            const postIds = data.map(p => p.postId as number);
            const images = await db.select({
                postId: mediaAssets.targetId,
                imageId: mediaAssets.assetId,
                imageUrl: mediaAssets.url,
                imageSortOrder: mediaAssets.sortOrder,
            })
                .from(mediaAssets)
                .where(
                    and(
                        eq(mediaAssets.targetType, "post"),
                        eq(mediaAssets.mediaType, "image"),
                        inArray(mediaAssets.targetId, postIds)
                    )
                );
                
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
