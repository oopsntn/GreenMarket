import { db } from "../config/db.ts";
import { categories, attributes, categoryAttributes } from "../models/schema/index.ts";

async function seed() {
    console.log("🌱 Seeding sample data...");

    // 1. Categories
    const catData = [
        { title: "Bonsai", slug: "bonsai" },
        { title: "Cây Cảnh Nội Thất", slug: "cay-canh-noi-that" },
        { title: "Cây Ăn Quả", slug: "cay-an-qua" },
        { title: "Dụng Cụ Bonsai", slug: "dung-cu-bonsai" }
    ];

    const insertedCategories = await db.insert(categories).values(
        catData.map(c => ({
            categoryTitle: c.title,
            categorySlug: c.slug,
            categoryPublished: true
        }))
    ).returning();

    const bonsaiCat = insertedCategories.find(c => c.categorySlug === "bonsai")!;
    const indoorCat = insertedCategories.find(c => c.categorySlug === "cay-canh-noi-that")!;

    // 2. Attributes
    const attrData = [
        { 
            code: "dang_cay", 
            title: "Dáng cây", 
            type: "enum", 
            options: ["Dáng Trực", "Dáng Xiên", "Dáng Hoành", "Dáng Huyền", "Dáng Văn Nhân", "Dáng Thác Đổ"] 
        },
        { code: "chieu_cao", title: "Chiều cao (cm)", type: "number", options: null },
        { code: "tuoi_tho", title: "Tuổi thọ (năm)", type: "number", options: null },
        { code: "loai_chau", title: "Loại chậu", type: "text", options: null },
        { 
            code: "do_kho_cham_soc", 
            title: "Độ khó chăm sóc", 
            type: "enum", 
            options: ["Dễ", "Trung bình", "Khó"] 
        }
    ];

    const insertedAttributes = await db.insert(attributes).values(
        attrData.map(a => ({
            attributeCode: a.code,
            attributeTitle: a.title,
            attributeDataType: a.type,
            attributeOptions: a.options,
            attributePublished: true
        }))
    ).returning();

    const dangCayAttr = insertedAttributes.find(a => a.attributeCode === "dang_cay")!;
    const chieuCaoAttr = insertedAttributes.find(a => a.attributeCode === "chieu_cao")!;
    const tuoiThoAttr = insertedAttributes.find(a => a.attributeCode === "tuoi_tho")!;
    const chauAttr = insertedAttributes.find(a => a.attributeCode === "loai_chau")!;
    const khoAttr = insertedAttributes.find(a => a.attributeCode === "do_kho_cham_soc")!;

    // 3. Link Category Attributes
    await db.insert(categoryAttributes).values([
        // Bonsai attributes
        { categoryId: bonsaiCat.categoryId, attributeId: dangCayAttr.attributeId, required: true },
        { categoryId: bonsaiCat.categoryId, attributeId: chieuCaoAttr.attributeId, required: true },
        { categoryId: bonsaiCat.categoryId, attributeId: tuoiThoAttr.attributeId, required: false },
        
        // Indoor plant attributes
        { categoryId: indoorCat.categoryId, attributeId: chieuCaoAttr.attributeId, required: true },
        { categoryId: indoorCat.categoryId, attributeId: chauAttr.attributeId, required: false },
        { categoryId: indoorCat.categoryId, attributeId: khoAttr.attributeId, required: true }
    ]);

    console.log("✅ Seeding completed!");
    process.exit(0);
}

seed().catch(err => {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
});
