import { mockProducts, mockCategories, mockMovements } from './mockData';

const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));

export const dashboardService = {
    getStats: async () => {
        await delay();
        const products = mockProducts;
        const totalProducts = products.length;
        const totalStock = products.reduce((sum, p) => sum + (p._stock || 0), 0);
        const lowStockItems = products.filter(p => p._stock <= p.min_stock);
        const totalCategories = mockCategories.filter(c => c.parent_id === null).length;
        const totalValue = products.reduce((sum, p) => sum + (p.unit_cost || 0) * (p._stock || 0), 0);

        return {
            success: true,
            data: {
                totalProducts,
                totalStock,
                lowStockCount: lowStockItems.length,
                totalCategories,
                totalValue: totalValue.toFixed(2),
                lowStockItems,
            },
        };
    },

    getCategoryDistribution: async () => {
        await delay();
        const parentCategories = mockCategories.filter(c => c.parent_id === null);
        const distribution = parentCategories.map(cat => {
            const childIds = mockCategories
                .filter(c => c.parent_id === cat.id)
                .map(c => c.id);
            const allIds = [cat.id, ...childIds];
            const count = mockProducts.filter(p => allIds.includes(p.category_id)).length;
            return { name: cat.name, value: count };
        });
        return { success: true, data: distribution };
    },

    getRecentMovements: async (limit = 5) => {
        await delay();
        const movements = [...mockMovements]
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, limit);
        return { success: true, data: movements };
    },

    getStockByType: async () => {
        await delay();
        const types = [
            { name: 'Fungibles', type: 'fungible' },
            { name: 'No Fungibles', type: 'non_fungible' },
            { name: 'Oficina', type: 'office_supply' },
        ];
        const data = types.map(t => ({
            name: t.name,
            count: mockProducts.filter(p => p.type === t.type).length,
            stock: mockProducts.filter(p => p.type === t.type).reduce((s, p) => s + (p._stock || 0), 0),
        }));
        return { success: true, data };
    },
};
