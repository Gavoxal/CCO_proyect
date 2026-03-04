import { mockProducts, mockCategories, mockAreas } from './mockData';

const STORAGE_KEY = 'cco_inventory_products';
const AREAS_KEY = 'cco_inventory_areas';
const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));

const getProducts = () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        try { return JSON.parse(saved); } catch { /* fall through */ }
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockProducts));
    return [...mockProducts];
};

const saveProducts = (products) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
};

const getAreasFromStorage = () => {
    const saved = localStorage.getItem(AREAS_KEY);
    if (saved) {
        try { return JSON.parse(saved); } catch { /* fall through */ }
    }
    return [...mockAreas];
};

const saveAreas = (areas) => {
    localStorage.setItem(AREAS_KEY, JSON.stringify(areas));
};

let nextId = 11;

/** Extract initials from a string: "Equipos de Cómputo" → "EC" */
const getInitials = (str = '') =>
    str
        .split(/\s+/)
        .filter(w => w.length > 2 || /^[A-ZÁÉÍÓÚÑ]/i.test(w))
        .map(w => w[0].toUpperCase())
        .join('')
        .slice(0, 3) || 'GEN';

/**
 * Generate SKU based on category and area initials.
 * Format: [CAT_INITIALS]-[AREA_INITIALS]-[SEQUENTIAL]
 * Example: "Equipos de Cómputo" + "Sala de Reuniones" → EC-SR-0001
 */
const generateSKU = (categoryName = '', areaName = '') => {
    const products = getProducts();
    const catCode = getInitials(categoryName) || 'CCO';
    const areaCode = getInitials(areaName) || 'GEN';
    const prefix = `${catCode}-${areaCode}-`;

    // Find max sequential for this specific prefix
    const maxNum = products.reduce((max, p) => {
        if (p.sku && p.sku.startsWith(prefix)) {
            const num = parseInt(p.sku.replace(prefix, ''), 10);
            return num > max ? num : max;
        }
        return max;
    }, 0);

    return `${prefix}${String(maxNum + 1).padStart(4, '0')}`;
};

const generateBarcode = () => {
    const prefix = '750';
    const random = Math.floor(Math.random() * 10000000000).toString().padStart(10, '0');
    return prefix + random.slice(0, 10);
};

export const inventoryService = {
    getAll: async (filters = {}) => {
        await delay();
        let products = getProducts();

        if (filters.search) {
            const s = filters.search.toLowerCase();
            products = products.filter(p =>
                p.name?.toLowerCase().includes(s) ||
                p.sku?.toLowerCase().includes(s) ||
                (p.barcode && p.barcode.includes(s)) ||
                (p.description && p.description.toLowerCase().includes(s)) ||
                (p._categoryName && p._categoryName.toLowerCase().includes(s)) ||
                (p.area && p.area.toLowerCase().includes(s))
            );
        }

        if (filters.category_id) {
            products = products.filter(p => p.category_id === filters.category_id);
        }

        if (filters.type) {
            products = products.filter(p => p.type === filters.type);
        }

        if (filters.lowStock) {
            products = products.filter(p => p._stock <= p.min_stock);
        }

        return { success: true, data: products, total: products.length };
    },

    getById: async (id) => {
        await delay();
        const products = getProducts();
        const product = products.find(p => p.id === id);
        return product
            ? { success: true, data: product }
            : { success: false, message: 'Producto no encontrado' };
    },

    getByBarcode: async (barcode) => {
        await delay();
        const products = getProducts();
        const product = products.find(p => p.barcode === barcode);
        return product
            ? { success: true, data: product }
            : { success: false, message: 'Producto no encontrado con este código de barras' };
    },

    create: async (productData) => {
        await delay(500);
        const products = getProducts();

        // Persist new area if it doesn't exist yet
        if (productData.area) {
            const areas = getAreasFromStorage();
            if (!areas.includes(productData.area)) {
                areas.push(productData.area);
                saveAreas(areas);
            }
        }

        // Persist new category if it doesn't match any existing
        const categoryName = productData._categoryName || productData.categoryName || 'Sin categoría';
        const existingCat = mockCategories.find(c =>
            c.name.toLowerCase() === categoryName.toLowerCase()
        );

        const newProduct = {
            ...productData,
            id: nextId++,
            sku: productData.sku || generateSKU(categoryName, productData.area),
            barcode: productData.barcode || null,
            category_id: existingCat?.id || null,
            active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            _categoryName: categoryName,
            _brandName: productData._brandName || productData.brand || 'Genérico',
            _stock: productData._stock || 0,
        };

        // Remove temporary fields
        delete newProduct.categoryName;
        delete newProduct.brand;

        products.push(newProduct);
        saveProducts(products);
        return { success: true, data: newProduct, message: 'Producto creado exitosamente' };
    },

    update: async (id, productData) => {
        await delay(500);
        const products = getProducts();
        const index = products.findIndex(p => p.id === id);

        if (index === -1) {
            return { success: false, message: 'Producto no encontrado' };
        }

        // Persist new area if it doesn't exist yet
        if (productData.area) {
            const areas = getAreasFromStorage();
            if (!areas.includes(productData.area)) {
                areas.push(productData.area);
                saveAreas(areas);
            }
        }

        const categoryName = productData._categoryName || productData.categoryName || products[index]._categoryName;
        const existingCat = mockCategories.find(c =>
            c.name.toLowerCase() === categoryName?.toLowerCase()
        );

        products[index] = {
            ...products[index],
            ...productData,
            updated_at: new Date().toISOString(),
            category_id: existingCat?.id || products[index].category_id,
            _categoryName: categoryName,
            _brandName: productData._brandName || productData.brand || products[index]._brandName,
        };

        // Remove temporary fields
        delete products[index].categoryName;
        delete products[index].brand;

        saveProducts(products);
        return { success: true, data: products[index], message: 'Producto actualizado exitosamente' };
    },

    delete: async (id) => {
        await delay(500);
        let products = getProducts();
        const index = products.findIndex(p => p.id === id);

        if (index === -1) {
            return { success: false, message: 'Producto no encontrado' };
        }

        products.splice(index, 1);
        saveProducts(products);
        return { success: true, message: 'Producto eliminado exitosamente' };
    },

    generateBarcode: () => generateBarcode(),
    generateSKU: (categoryName, areaName) => generateSKU(categoryName, areaName),

    /**
     * Bulk import from Excel rows.
     */
    bulkImport: async (rows) => {
        await delay(50);
        const products = getProducts();
        const existingSKUs = new Set(products.map(p => p.sku?.toLowerCase()).filter(Boolean));

        let imported = 0, skipped = 0, errors = 0;

        for (const row of rows) {
            try {
                if (row.sku && existingSKUs.has(row.sku.toLowerCase())) {
                    skipped++;
                    continue;
                }

                const categoryName = row._categoryName || row.categoryName || 'Sin categoría';
                const sku = row.sku || generateSKU(categoryName, row.area);
                const newProduct = {
                    ...row,
                    id: nextId++,
                    sku,
                    barcode: row.barcode || null,
                    category_id: null,
                    active: true,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    _categoryName: categoryName,
                    _brandName: row._brandName || row.brand || 'Genérico',
                    _stock: row._stock ?? 1,
                    min_stock: row.min_stock ?? 1,
                    unit_cost: row.unit_cost ?? 0,
                };

                products.push(newProduct);
                existingSKUs.add(sku.toLowerCase());
                imported++;
            } catch {
                errors++;
            }
        }

        saveProducts(products);
        return { imported, skipped, errors };
    },

    getCategories: async () => {
        await delay(200);
        return { success: true, data: mockCategories };
    },

    getAreas: async () => {
        await delay(100);
        const areas = getAreasFromStorage();
        return { success: true, data: areas };
    },

    addArea: async (areaName) => {
        const areas = getAreasFromStorage();
        if (!areas.includes(areaName)) {
            areas.push(areaName);
            saveAreas(areas);
        }
        return { success: true, data: areas };
    },
};
