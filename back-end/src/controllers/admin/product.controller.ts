import { Request, Response } from "express";
import { db } from "../../config/db";
import { eq } from "drizzle-orm";
import { products, type NewProduct } from "../../models/schema/products";
import { productImages } from "../../models/schema/product-images";
import { productAttributeValues } from "../../models/schema/product-attribute-values";
import { parseId } from "../../utils/parseId";
import { slugify } from "../../utils/slugify";

export const getProducts = async (req: Request, res: Response): Promise<void> => {
    try {
        const allProducts = await db.select().from(products);
        res.json(allProducts);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const createProduct = async (req: Request<{}, {}, NewProduct & { images?: string[], attributes?: { id: number, value: string }[] }>, res: Response): Promise<void> => {
    try {
        const { images, attributes: attrValues, ...productData } = req.body;
        
        // Auto-generate slug
        const finalSlug = productData.productSlug || slugify(productData.productTitle);

        const [newProduct] = await db.insert(products).values({
            ...productData,
            productSlug: finalSlug,
        }).returning();

        // Save images if provided
        if (images && images.length > 0) {
            await db.insert(productImages).values(
                images.map((url, index) => ({
                    productId: newProduct.productId,
                    imageUrl: url,
                    imageSortOrder: index,
                }))
            );
        }

        // Save attribute values if provided (e.g., Age: 5 years)
        if (attrValues && attrValues.length > 0) {
            await db.insert(productAttributeValues).values(
                attrValues.map(attr => ({
                    productId: newProduct.productId,
                    attributeId: attr.id,
                    attributeValue: attr.value,
                }))
            );
        }

        res.status(201).json(newProduct);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const getProductById = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    try {
        const idNumber = parseId(req.params.id);
        if (idNumber === null) {
            res.status(400).json({ error: "Invalid product id" });
            return;
        }

        const [product] = await db.select().from(products).where(eq(products.productId, idNumber)).limit(1);
        if (!product) {
            res.status(404).json({ error: "Product not found" });
            return;
        }

        // Fetch related images and attributes
        const images = await db.select().from(productImages).where(eq(productImages.productId, idNumber));
        const attrValues = await db.select().from(productAttributeValues).where(eq(productAttributeValues.productId, idNumber));

        res.json({
            ...product,
            images,
            attributes: attrValues,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const deleteProduct = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    try {
        const idNumber = parseId(req.params.id);
        if (idNumber === null) {
            res.status(400).json({ error: "Invalid product id" });
            return;
        }

        const [deletedProduct] = await db.delete(products).where(eq(products.productId, idNumber)).returning();
        if (!deletedProduct) {
            res.status(404).json({ error: "Product not found" });
            return;
        }

        res.json({ message: "Product deleted successfully", deletedProduct });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};
