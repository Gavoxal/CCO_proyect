// ─── Roles ───
export const mockRoles = [
    { id: 1, name: 'admin', description: 'Administrador con acceso total' },
    { id: 2, name: 'bodeguero', description: 'Encargado de bodega' },
    { id: 3, name: 'viewer', description: 'Solo lectura' },
];

// ─── Users ───
export const mockUsers = [
    {
        id: 1,
        name: 'Admin CCO',
        email: 'admin@cco.com',
        password: 'admin123',
        role_id: 1,
        role: 'admin',
        active: true,
        created_at: '2025-01-01T00:00:00',
    },
    {
        id: 2,
        name: 'Juan Bodeguero',
        email: 'juan@cco.com',
        password: 'juan123',
        role_id: 2,
        role: 'bodeguero',
        active: true,
        created_at: '2025-02-15T00:00:00',
    },
];

// ─── Categories ───
export const mockCategories = [
    { id: 1, name: 'Fungibles', parent_id: null, description: 'Materiales de consumo' },
    { id: 2, name: 'No Fungibles', parent_id: null, description: 'Equipos y activos fijos' },
    { id: 3, name: 'Oficina', parent_id: null, description: 'Suministros de oficina' },
    { id: 4, name: 'Papelería', parent_id: null, description: 'Artículos de papelería' },
    { id: 5, name: 'Tóner', parent_id: 1, description: 'Cartuchos y tóner de impresora' },
    { id: 6, name: 'Limpieza', parent_id: 1, description: 'Productos de limpieza' },
    { id: 7, name: 'Equipos de Cómputo', parent_id: 2, description: 'Laptops, PCs, tablets' },
    { id: 8, name: 'Periféricos', parent_id: 2, description: 'Teclados, mouse, monitores' },
    { id: 9, name: 'Papel', parent_id: 3, description: 'Hojas, resmas, papel bond' },
    { id: 10, name: 'Escritura', parent_id: 4, description: 'Bolígrafos, marcadores, lápices' },
];

// ─── Brands ───
export const mockBrands = [
    { id: 1, name: 'HP', website: 'https://hp.com' },
    { id: 2, name: 'Epson', website: 'https://epson.com' },
    { id: 3, name: 'Dell', website: 'https://dell.com' },
    { id: 4, name: 'Xerox', website: 'https://xerox.com' },
    { id: 5, name: 'BIC', website: 'https://bic.com' },
    { id: 6, name: 'Paper Mate', website: 'https://papermate.com' },
    { id: 7, name: 'Logitech', website: 'https://logitech.com' },
    { id: 8, name: '3M', website: 'https://3m.com' },
];

// ─── Units of Measure ───
export const mockUnits = [
    { id: 1, name: 'Unidad', abbreviation: 'Ud' },
    { id: 2, name: 'Caja', abbreviation: 'Cj' },
    { id: 3, name: 'Resma', abbreviation: 'Rm' },
    { id: 4, name: 'Paquete', abbreviation: 'Pq' },
    { id: 5, name: 'Litro', abbreviation: 'Lt' },
];

// ─── Locations ───
export const mockLocations = [
    { id: 1, name: 'Bodega Principal', parent_id: null, type: 'bodega', description: 'Almacén principal' },
    { id: 2, name: 'Estante A', parent_id: 1, type: 'estante', description: 'Estante A - Fungibles' },
    { id: 3, name: 'Estante B', parent_id: 1, type: 'estante', description: 'Estante B - No Fungibles' },
    { id: 4, name: 'Oficina Admin', parent_id: null, type: 'zona', description: 'Oficina administrativa' },
];

// ─── Products ───
export const mockProducts = [
    {
        id: 1, sku: 'CCO-000001', barcode: '7501234567890',
        name: 'Tóner HP 26A Negro', description: 'Cartucho de tóner negro para impresora HP LaserJet Pro',
        category_id: 5, brand_id: 1, unit_id: 1,
        type: 'fungible', has_serial: false,
        min_stock: 3, unit_cost: 45.00, currency: 'USD',
        image_url: null, active: true,
        created_at: '2025-01-10T10:00:00', updated_at: '2025-12-01T15:30:00',
        _categoryName: 'Tóner', _brandName: 'HP', _unitName: 'Unidad', _stock: 8,
    },
    {
        id: 2, sku: 'CCO-000002', barcode: '7501234567891',
        name: 'Resma Papel Bond A4', description: 'Papel bond blanco 75g, 500 hojas por resma',
        category_id: 9, brand_id: 4, unit_id: 3,
        type: 'office_supply', has_serial: false,
        min_stock: 10, unit_cost: 5.50, currency: 'USD',
        image_url: null, active: true,
        created_at: '2025-01-15T09:00:00', updated_at: '2025-12-05T11:00:00',
        _categoryName: 'Papel', _brandName: 'Xerox', _unitName: 'Resma', _stock: 25,
    },
    {
        id: 3, sku: 'CCO-000003', barcode: '7501234567892',
        name: 'Bolígrafos BIC Cristal (Caja x12)', description: 'Caja de 12 bolígrafos BIC Cristal azul',
        category_id: 10, brand_id: 5, unit_id: 2,
        type: 'office_supply', has_serial: false,
        min_stock: 5, unit_cost: 3.20, currency: 'USD',
        image_url: null, active: true,
        created_at: '2025-02-01T08:30:00', updated_at: '2025-11-20T14:00:00',
        _categoryName: 'Escritura', _brandName: 'BIC', _unitName: 'Caja', _stock: 12,
    },
    {
        id: 4, sku: 'CCO-000004', barcode: null,
        name: 'Laptop Dell Latitude 5540', description: 'Laptop corporativa Dell Latitude 5540, i7, 16GB RAM, 512GB SSD',
        category_id: 7, brand_id: 3, unit_id: 1,
        type: 'non_fungible', has_serial: true,
        min_stock: 1, unit_cost: 1200.00, currency: 'USD',
        image_url: null, active: true,
        created_at: '2025-03-01T12:00:00', updated_at: '2025-10-15T09:00:00',
        _categoryName: 'Equipos de Cómputo', _brandName: 'Dell', _unitName: 'Unidad', _stock: 3,
    },
    {
        id: 5, sku: 'CCO-000005', barcode: '7501234567895',
        name: 'Tóner Epson 664 Negro', description: 'Botella de tinta Epson 664 negro para EcoTank',
        category_id: 5, brand_id: 2, unit_id: 1,
        type: 'fungible', has_serial: false,
        min_stock: 5, unit_cost: 12.00, currency: 'USD',
        image_url: null, active: true,
        created_at: '2025-03-10T10:30:00', updated_at: '2025-11-30T16:00:00',
        _categoryName: 'Tóner', _brandName: 'Epson', _unitName: 'Unidad', _stock: 2,
    },
    {
        id: 6, sku: 'CCO-000006', barcode: '7501234567896',
        name: 'Monitor HP 24" FHD', description: 'Monitor HP 24 pulgadas Full HD, IPS, HDMI/VGA',
        category_id: 8, brand_id: 1, unit_id: 1,
        type: 'non_fungible', has_serial: true,
        min_stock: 1, unit_cost: 189.00, currency: 'USD',
        image_url: null, active: true,
        created_at: '2025-04-05T14:00:00', updated_at: '2025-10-10T11:30:00',
        _categoryName: 'Periféricos', _brandName: 'HP', _unitName: 'Unidad', _stock: 5,
    },
    {
        id: 7, sku: 'CCO-000007', barcode: '7501234567897',
        name: 'Post-it 3M 3x3 (Paquete x5)', description: 'Paquete de 5 blocks Post-it 3M colores neón',
        category_id: 10, brand_id: 8, unit_id: 4,
        type: 'office_supply', has_serial: false,
        min_stock: 8, unit_cost: 6.50, currency: 'USD',
        image_url: null, active: true,
        created_at: '2025-05-01T09:00:00', updated_at: '2025-12-01T08:00:00',
        _categoryName: 'Escritura', _brandName: '3M', _unitName: 'Paquete', _stock: 15,
    },
    {
        id: 8, sku: 'CCO-000008', barcode: null,
        name: 'Teclado Logitech K380', description: 'Teclado inalámbrico bluetooth Logitech K380',
        category_id: 8, brand_id: 7, unit_id: 1,
        type: 'non_fungible', has_serial: true,
        min_stock: 2, unit_cost: 39.99, currency: 'USD',
        image_url: null, active: true,
        created_at: '2025-06-15T11:00:00', updated_at: '2025-11-25T10:00:00',
        _categoryName: 'Periféricos', _brandName: 'Logitech', _unitName: 'Unidad', _stock: 4,
    },
    {
        id: 9, sku: 'CCO-000009', barcode: '7501234567899',
        name: 'Carpetas Manila Tamaño Carta', description: 'Paquete de 25 carpetas manila tamaño carta',
        category_id: 3, brand_id: null, unit_id: 4,
        type: 'office_supply', has_serial: false,
        min_stock: 3, unit_cost: 4.80, currency: 'USD',
        image_url: null, active: true,
        created_at: '2025-07-01T08:00:00', updated_at: '2025-12-02T12:00:00',
        _categoryName: 'Oficina', _brandName: 'Genérico', _unitName: 'Paquete', _stock: 1,
    },
    {
        id: 10, sku: 'CCO-000010', barcode: '7501234567900',
        name: 'Grapas Standard 26/6 (Caja x5000)', description: 'Caja de 5000 grapas standard 26/6',
        category_id: 3, brand_id: null, unit_id: 2,
        type: 'office_supply', has_serial: false,
        min_stock: 2, unit_cost: 2.50, currency: 'USD',
        image_url: null, active: true,
        created_at: '2025-08-01T07:30:00', updated_at: '2025-12-03T09:00:00',
        _categoryName: 'Oficina', _brandName: 'Genérico', _unitName: 'Caja', _stock: 7,
    },
];

// ─── Movement Types ───
export const mockMovementTypes = [
    { id: 1, name: 'Entrada', stock_effect: 1 },
    { id: 2, name: 'Salida', stock_effect: -1 },
    { id: 3, name: 'Ajuste Positivo', stock_effect: 1 },
    { id: 4, name: 'Ajuste Negativo', stock_effect: -1 },
    { id: 5, name: 'Devolución', stock_effect: 1 },
];

// ─── Recent Movements ───
export const mockMovements = [
    { id: 1, product_id: 1, product_name: 'Tóner HP 26A Negro', location: 'Bodega Principal', movement_type: 'Entrada', quantity: 10, user_name: 'Admin CCO', reference: 'OC-2025-001', created_at: '2025-12-01T10:30:00' },
    { id: 2, product_id: 2, product_name: 'Resma Papel Bond A4', location: 'Bodega Principal', movement_type: 'Salida', quantity: 5, user_name: 'Juan Bodeguero', reference: 'SOL-2025-045', created_at: '2025-12-02T14:15:00' },
    { id: 3, product_id: 5, product_name: 'Tóner Epson 664 Negro', location: 'Bodega Principal', movement_type: 'Salida', quantity: 3, user_name: 'Juan Bodeguero', reference: 'SOL-2025-046', created_at: '2025-12-03T09:20:00' },
    { id: 4, product_id: 3, product_name: 'Bolígrafos BIC Cristal', location: 'Oficina Admin', movement_type: 'Salida', quantity: 2, user_name: 'Admin CCO', reference: 'SOL-2025-047', created_at: '2025-12-04T11:00:00' },
    { id: 5, product_id: 9, product_name: 'Carpetas Manila', location: 'Bodega Principal', movement_type: 'Ajuste Negativo', quantity: 2, user_name: 'Admin CCO', reference: 'AJ-2025-003', created_at: '2025-12-05T08:45:00' },
];
