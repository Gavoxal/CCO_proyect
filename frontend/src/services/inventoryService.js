import { mockProducts, mockCategories, mockBrands, mockUnits } from './mockData';

const STORAGE_KEY = 'cco_inventory_products';
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

let nextId = 11;

const generateSKU = () => {
    const products = getProducts();
    const maxNum = products.reduce((max, p) => {
        const num = parseInt(p.sku.replace('CCO-', ''), 10);
        return num > max ? num : max;
    }, 0);
    return `CCO-${String(maxNum + 1).padStart(6, '0')}`;
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
                p.name.toLowerCase().includes(s) ||
                p.sku.toLowerCase().includes(s) ||
                (p.barcode && p.barcode.includes(s)) ||
                (p.description && p.description.toLowerCase().includes(s))
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

        const category = mockCategories.find(c => c.id === productData.category_id);
        const brand = mockBrands.find(b => b.id === productData.brand_id);
        const unit = mockUnits.find(u => u.id === productData.unit_id);

        const newProduct = {
            ...productData,
            id: nextId++,
            sku: productData.sku || generateSKU(),
            barcode: productData.barcode || null,
            active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            _categoryName: category?.name || 'Sin categoría',
            _brandName: brand?.name || 'Genérico',
            _unitName: unit?.name || 'Unidad',
            _stock: productData._stock || 0,
        };

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

        const category = mockCategories.find(c => c.id === productData.category_id);
        const brand = mockBrands.find(b => b.id === productData.brand_id);
        const unit = mockUnits.find(u => u.id === productData.unit_id);

        products[index] = {
            ...products[index],
            ...productData,
            updated_at: new Date().toISOString(),
            _categoryName: category?.name || products[index]._categoryName,
            _brandName: brand?.name || products[index]._brandName,
            _unitName: unit?.name || products[index]._unitName,
        };

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
    generateSKU: () => generateSKU(),

    getCategories: async () => {
        await delay(200);
        return { success: true, data: mockCategories };
    },

    getBrands: async () => {
        await delay(200);
        return { success: true, data: mockBrands };
    },

    getUnits: async () => {
        await delay(200);
        return { success: true, data: mockUnits };
    },
};
