// Helper function to ensure items have all required fields
export const prepareItemsForSubmission = (items: any[]) => {
    return items.map(item => ({
        productId: Number(item.productId || 0),
        quantity: Number(item.quantity || 0),
        price: Number(item.unitPrice || 0),
        total: Number(item.quantity || 0) * Number(item.unitPrice || 0)
    }));
}; 