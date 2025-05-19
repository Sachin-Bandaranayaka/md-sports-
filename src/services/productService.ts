import { Product } from '@/lib/models';

export const productService = {
    /**
     * Get all products
     */
    getAllProducts: async () => {
        try {
            return await Product.findAll({
                where: { isActive: true }
            });
        } catch (error) {
            console.error('Error fetching products:', error);
            throw error;
        }
    },

    /**
     * Get a product by ID
     */
    getProductById: async (id: number) => {
        try {
            return await Product.findOne({
                where: { id, isActive: true }
            });
        } catch (error) {
            console.error(`Error fetching product with ID ${id}:`, error);
            throw error;
        }
    },

    /**
     * Create a new product
     */
    createProduct: async (productData: any) => {
        try {
            return await Product.create(productData);
        } catch (error) {
            console.error('Error creating product:', error);
            throw error;
        }
    },

    /**
     * Update a product
     */
    updateProduct: async (id: number, productData: any) => {
        try {
            const product = await Product.findByPk(id);

            if (!product) {
                throw new Error(`Product with ID ${id} not found`);
            }

            return await product.update(productData);
        } catch (error) {
            console.error(`Error updating product with ID ${id}:`, error);
            throw error;
        }
    },

    /**
     * Delete a product (soft delete)
     */
    deleteProduct: async (id: number) => {
        try {
            const product = await Product.findByPk(id);

            if (!product) {
                throw new Error(`Product with ID ${id} not found`);
            }

            return await product.update({ isActive: false });
        } catch (error) {
            console.error(`Error deleting product with ID ${id}:`, error);
            throw error;
        }
    }
}; 