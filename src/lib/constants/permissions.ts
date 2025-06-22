/**
 * Permission Constants
 * 
 * Centralized permission definitions for the application.
 * Use these constants instead of hardcoded strings to ensure consistency
 * and enable better TypeScript support.
 */

export const PERMISSIONS = {
  // Sales permissions
  SALES_VIEW: 'sales:view' as const,
  SALES_CREATE: 'sales:create' as const,
  SALES_EDIT: 'sales:edit' as const,
  SALES_DELETE: 'sales:delete' as const,
  SALES_MANAGE: 'sales:manage' as const,
  SALES_UPDATE: 'sales:update' as const,

  // Inventory permissions
  INVENTORY_VIEW: 'inventory:view' as const,
  INVENTORY_CREATE: 'inventory:create' as const,
  INVENTORY_EDIT: 'inventory:edit' as const,
  INVENTORY_DELETE: 'inventory:delete' as const,
  INVENTORY_MANAGE: 'inventory:manage' as const,
  INVENTORY_TRANSFER: 'inventory:transfer' as const,
  INVENTORY_ADJUST: 'inventory:adjust' as const,
  INVENTORY_UPDATE: 'inventory:update' as const,

  // User permissions (plural)
  USERS_VIEW: 'users:view' as const,
  USERS_CREATE: 'users:create' as const,
  USERS_EDIT: 'users:edit' as const,
  USERS_DELETE: 'users:delete' as const,
  USERS_MANAGE: 'users:manage' as const,

  // User permissions (singular)
  USER_VIEW: 'user:view' as const,
  USER_CREATE: 'user:create' as const,
  USER_EDIT: 'user:edit' as const,
  USER_DELETE: 'user:delete' as const,
  USER_MANAGE: 'user:manage' as const,
  USER_UPDATE: 'user:update' as const,

  // Shop permissions
  SHOP_VIEW: 'shop:view' as const,
  SHOP_CREATE: 'shop:create' as const,
  SHOP_EDIT: 'shop:edit' as const,
  SHOP_DELETE: 'shop:delete' as const,
  SHOP_MANAGE: 'shop:manage' as const,
  SHOP_ASSIGNED_ONLY: 'shop:assigned_only' as const,
  SHOP_DISTRIBUTION_VIEW: 'shop:distribution:view' as const,

  // Customer permissions (plural)
  CUSTOMERS_VIEW: 'customers:view' as const,
  CUSTOMERS_CREATE: 'customers:create' as const,
  CUSTOMERS_EDIT: 'customers:edit' as const,
  CUSTOMERS_DELETE: 'customers:delete' as const,

  // Customer permissions (singular)
  CUSTOMER_VIEW: 'customer:view' as const,
  CUSTOMER_CREATE: 'customer:create' as const,
  CUSTOMER_EDIT: 'customer:edit' as const,
  CUSTOMER_DELETE: 'customer:delete' as const,

  // Supplier permissions (plural)
  SUPPLIERS_VIEW: 'suppliers:view' as const,
  SUPPLIERS_CREATE: 'suppliers:create' as const,
  SUPPLIERS_EDIT: 'suppliers:edit' as const,
  SUPPLIERS_DELETE: 'suppliers:delete' as const,

  // Supplier permissions (singular)
  SUPPLIER_VIEW: 'supplier:view' as const,
  SUPPLIER_CREATE: 'supplier:create' as const,
  SUPPLIER_EDIT: 'supplier:edit' as const,
  SUPPLIER_DELETE: 'supplier:delete' as const,

  // Purchase permissions (plural)
  PURCHASES_VIEW: 'purchases:view' as const,
  PURCHASES_CREATE: 'purchases:create' as const,
  PURCHASES_EDIT: 'purchases:edit' as const,
  PURCHASES_DELETE: 'purchases:delete' as const,

  // Purchase permissions (singular)
  PURCHASE_VIEW: 'purchase:view' as const,
  PURCHASE_CREATE: 'purchase:create' as const,
  PURCHASE_EDIT: 'purchase:edit' as const,
  PURCHASE_DELETE: 'purchase:delete' as const,

  // Quotation permissions (plural)
  QUOTATIONS_VIEW: 'quotations:view' as const,
  QUOTATIONS_CREATE: 'quotations:create' as const,
  QUOTATIONS_EDIT: 'quotations:edit' as const,
  QUOTATIONS_DELETE: 'quotations:delete' as const,

  // Quotation permissions (singular)
  QUOTATION_VIEW: 'quotation:view' as const,
  QUOTATION_CREATE: 'quotation:create' as const,
  QUOTATION_EDIT: 'quotation:edit' as const,
  QUOTATION_DELETE: 'quotation:delete' as const,

  // Report permissions (plural)
  REPORTS_VIEW: 'reports:view' as const,
  REPORTS_CREATE: 'reports:create' as const,
  REPORTS_EXPORT: 'reports:export' as const,

  // Report permissions (singular)
  REPORT_VIEW: 'report:view' as const,
  REPORT_CREATE: 'report:create' as const,
  REPORT_EXPORT: 'report:export' as const,

  // Accounting permissions
  ACCOUNTING_VIEW: 'accounting:view' as const,
  ACCOUNTING_CREATE: 'accounting:create' as const,
  ACCOUNTING_EDIT: 'accounting:edit' as const,
  ACCOUNTING_DELETE: 'accounting:delete' as const,

  // Settings permissions
  SETTINGS_VIEW: 'settings:view' as const,
  SETTINGS_EDIT: 'settings:edit' as const,
  SETTINGS_MANAGE: 'settings:manage' as const,

  // Dashboard permissions
  DASHBOARD_VIEW: 'dashboard:view' as const,
  VIEW_SALES: 'view_sales' as const,
  MANAGE_DASHBOARD: 'manage_dashboard' as const,

  // Product permissions (plural)
  PRODUCTS_VIEW: 'products:view' as const,
  PRODUCTS_CREATE: 'products:create' as const,
  PRODUCTS_EDIT: 'products:edit' as const,
  PRODUCTS_DELETE: 'products:delete' as const,

  // Product permissions (singular)
  PRODUCT_VIEW: 'product:view' as const,
  PRODUCT_CREATE: 'product:create' as const,
  PRODUCT_EDIT: 'product:edit' as const,
  PRODUCT_DELETE: 'product:delete' as const,
  PRODUCT_UPDATE: 'product:update' as const,

  // Product permissions (alternative format)
  READ_PRODUCTS: 'read:products' as const,
  WRITE_PRODUCTS: 'write:products' as const,

  // Category permissions (plural)
  CATEGORIES_VIEW: 'categories:view' as const,
  CATEGORIES_CREATE: 'categories:create' as const,
  CATEGORIES_EDIT: 'categories:edit' as const,
  CATEGORIES_DELETE: 'categories:delete' as const,

  // Category permissions (singular)
  CATEGORY_VIEW: 'category:view' as const,
  CATEGORY_CREATE: 'category:create' as const,
  CATEGORY_EDIT: 'category:edit' as const,
  CATEGORY_DELETE: 'category:delete' as const,
  CATEGORY_UPDATE: 'category:update' as const,

  // Brand permissions (plural)
  BRANDS_VIEW: 'brands:view' as const,
  BRANDS_CREATE: 'brands:create' as const,
  BRANDS_EDIT: 'brands:edit' as const,
  BRANDS_DELETE: 'brands:delete' as const,

  // Brand permissions (singular)
  BRAND_VIEW: 'brand:view' as const,
  BRAND_CREATE: 'brand:create' as const,
  BRAND_EDIT: 'brand:edit' as const,
  BRAND_DELETE: 'brand:delete' as const,

  // Transfer permissions (plural)
  TRANSFERS_VIEW: 'transfers:view' as const,
  TRANSFERS_CREATE: 'transfers:create' as const,
  TRANSFERS_EDIT: 'transfers:edit' as const,
  TRANSFERS_DELETE: 'transfers:delete' as const,

  // Transfer permissions (singular)
  TRANSFER_VIEW: 'transfer:view' as const,
  TRANSFER_CREATE: 'transfer:create' as const,
  TRANSFER_EDIT: 'transfer:edit' as const,
  TRANSFER_DELETE: 'transfer:delete' as const,

  // Invoice permissions
  INVOICE_VIEW: 'invoice:view' as const,
  INVOICE_CREATE: 'invoice:create' as const,
  INVOICE_EDIT: 'invoice:edit' as const,
  INVOICE_DELETE: 'invoice:delete' as const,
  READ_INVOICES: 'read:invoices' as const,
  WRITE_INVOICES: 'write:invoices' as const,

  // Legacy dashboard permissions
  VIEW_TRANSFERS: 'view_transfers' as const,

  // Shop update permission
  SHOP_UPDATE: 'shop:update' as const,

  // Customer update permission
  CUSTOMER_UPDATE: 'customer:update' as const,

  // Health check permission
  HEALTH_CHECK: 'health:check' as const,

  // Dashboard shops permission
  DASHBOARD_SHOPS: 'dashboard:shops' as const,

  // Inventory shop permission
  INVENTORY_SHOP: 'inventory:shop' as const,

  // Transfer stats permission
  TRANSFERS_STATS: 'transfers:stats' as const,

  // Transfer list and detail permissions
  TRANSFERS_LIST: 'transfers:list' as const,
  TRANSFERS_DETAIL: 'transfers:detail' as const,

  // Dashboard specific permissions
  DASHBOARD_SUMMARY: 'dashboard:summary' as const,
  DASHBOARD_INVENTORY: 'dashboard:inventory' as const,
  DASHBOARD_ALL: 'dashboard:all' as const,

  // Sales create shop permission
  SALES_CREATE_SHOP: 'sales:create:shop' as const,

  // Generic write permission
  WRITE: 'write' as const,

  // Realtime permissions
  REALTIME_UPDATES: 'realtime:updates' as const,
  REALTIME_LAST_POLL: 'realtime:last_poll' as const,
  REALTIME_NOTIFICATIONS: 'realtime:notifications' as const,

  // Inventory specific permissions
  INVENTORY_CATEGORY: 'inventory:category' as const,
  INVENTORY_SEARCH: 'inventory:search' as const,
  INVENTORY_ANALYTICS: 'inventory:analytics' as const,
  INVENTORY_SUMMARY: 'inventory:summary' as const,
  INVENTORY_ITEM: 'inventory:item' as const,

  // List permissions
  CUSTOMERS_LIST: 'customers:list' as const,
  PRODUCTS_LIST: 'products:list' as const,
  INVOICES_LIST: 'invoices:list' as const,
  CATEGORIES_LIST: 'categories:list' as const,
  SHOPS_LIST: 'shops:list' as const,

  // Stats permissions
  INVOICES_STATS: 'invoices:stats' as const,

  // Quotation manage permission
  QUOTATION_MANAGE: 'quotation:manage' as const,

  // Shop view costs permission
  SHOP_VIEW_COSTS: 'shop:view_costs' as const,

  // Payment permissions
  PAYMENT_RECORD: 'payment:record' as const,
  PAYMENT_VIEW: 'payment:view' as const,

  // Receipt permissions
  RECEIPT_VIEW: 'receipt:view' as const,

  // Audit permissions
  AUDIT_VIEW: 'audit:view' as const,

  // CSS class (not a real permission but appears in code)
  HOVER_UNDERLINE: 'hover:underline' as const,

  // Admin permissions
  ADMIN_ALL: 'admin:all' as const,
  WILDCARD: '*' as const,
  LEGACY_ALL: 'ALL' as const,
} as const;

/**
 * Type representing all valid permission values
 */
export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

/**
 * Permission categories for easier management
 */
export const PERMISSION_CATEGORIES = {
  SALES: [
    PERMISSIONS.SALES_VIEW,
    PERMISSIONS.SALES_CREATE,
    PERMISSIONS.SALES_EDIT,
    PERMISSIONS.SALES_DELETE,
    PERMISSIONS.SALES_MANAGE
  ],
  INVENTORY: [
    PERMISSIONS.INVENTORY_VIEW,
    PERMISSIONS.INVENTORY_CREATE,
    PERMISSIONS.INVENTORY_EDIT,
    PERMISSIONS.INVENTORY_DELETE,
    PERMISSIONS.INVENTORY_MANAGE
  ],
  QUOTATIONS: [
    PERMISSIONS.QUOTATIONS_VIEW,
    PERMISSIONS.QUOTATIONS_CREATE,
    PERMISSIONS.QUOTATIONS_EDIT,
    PERMISSIONS.QUOTATIONS_DELETE
  ],
  PRODUCTS: [
    PERMISSIONS.PRODUCTS_VIEW,
    PERMISSIONS.PRODUCTS_CREATE,
    PERMISSIONS.PRODUCTS_EDIT,
    PERMISSIONS.PRODUCTS_DELETE
  ],
  USERS: [
    PERMISSIONS.USERS_VIEW,
    PERMISSIONS.USERS_CREATE,
    PERMISSIONS.USERS_EDIT,
    PERMISSIONS.USERS_DELETE
  ],
  REPORTS: [
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_CREATE
  ],
  SETTINGS: [
    PERMISSIONS.SETTINGS_VIEW,
    PERMISSIONS.SETTINGS_EDIT
  ],
  ACCOUNTING: [
    PERMISSIONS.ACCOUNTING_VIEW,
    PERMISSIONS.ACCOUNTING_EDIT
  ],
  SHOP: [
    PERMISSIONS.SHOP_VIEW,
    PERMISSIONS.SHOP_MANAGE,
    PERMISSIONS.SHOP_ASSIGNED_ONLY
  ],
  ADMIN: [
    PERMISSIONS.ADMIN_ALL,
    PERMISSIONS.LEGACY_ALL,
    PERMISSIONS.WILDCARD
  ]
} as const;

/**
 * Validates if a permission string follows the correct format
 * @param permission - The permission string to validate
 * @returns boolean indicating if the permission is valid
 */
export function isValidPermission(permission: string): boolean {
  const validPatterns = [
    /^[a-z]+:[a-z]+$/,           // module:action (e.g., sales:view)
    /^[a-z]+:[a-z]+:[a-z]+$/,   // module:submodule:action (e.g., shop:distribution:view)
    /^[a-z]+:[a-z_]+$/,         // module:action_with_underscore (e.g., shop:assigned_only)
    /^[a-z_]+:[a-z_]+$/,        // legacy format with underscores
    /^[a-z_]+$/,                // legacy single word permissions (e.g., view_dashboard)
    /^[a-z]+:[a-z]+$/,          // read:products format
    /^\*$/,                     // wildcard
    /^admin:all$/,              // admin permission
    /^ALL$/                     // legacy admin permission
  ];
  
  return validPatterns.some(pattern => pattern.test(permission));
}

/**
 * Helper function to get all permissions in a category
 */
export function getPermissionsByCategory(category: keyof typeof PERMISSION_CATEGORIES): readonly Permission[] {
  return PERMISSION_CATEGORIES[category];
}

/**
 * All valid permissions as an array
 */
export const ALL_PERMISSIONS = Object.values(PERMISSIONS) as Permission[];