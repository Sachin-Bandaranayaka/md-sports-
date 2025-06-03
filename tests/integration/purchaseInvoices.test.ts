/**
 * @jest-environment node
 */
import { PrismaClient } from '@prisma/client';
import { POST as createPurchaseInvoice } from '@/app/api/purchases/route'; // Adjust if direct import isn't feasible
import { PUT as updatePurchaseInvoice } from '@/app/api/purchases/[id]/route'; // Adjust
import { DELETE as deletePurchaseInvoice } from '@/app/api/purchases/[id]/route'; // Adjust
import { NextRequest } from 'next/server';
import { createMocks } from 'node-mocks-http'; // Or any other way to mock NextRequest/Response

const prisma = new PrismaClient();

describe('Purchase Invoice API Integration Tests', () => {
    let createdShopId: string;
    let createdSupplierId: number;
    let createdProductId: number;

    beforeAll(async () => {
        // Seed initial data if necessary, e.g., a default supplier or shop
        // For now, we'll create them in beforeEach or specific tests
    });

    beforeEach(async () => {
        // Clean up database tables to ensure test isolation
        await prisma.purchaseInvoiceItem.deleteMany({});
        await prisma.purchaseInvoice.deleteMany({});
        await prisma.inventoryItem.deleteMany({});
        await prisma.product.deleteMany({});
        await prisma.supplier.deleteMany({});
        await prisma.shop.deleteMany({});

        // Create a shop for testing
        const shop = await prisma.shop.create({
            data: {
                name: 'Test Shop Local',
                location: 'Test Location',
                // Add other required fields if any
            },
        });
        createdShopId = shop.id;

        // Create a supplier for testing
        const supplier = await prisma.supplier.create({
            data: {
                name: 'Test Supplier Local',
                // Add other required fields
            },
        });
        createdSupplierId = supplier.id;

        // Create a product for testing updates/deletes (not for create new product test)
        const product = await prisma.product.create({
            data: {
                name: 'Existing Product',
                price: 100, // retail price
                sku: 'EXISTING001',
                shopId: createdShopId, // Optional: associate with a shop by default
                // weightedAverageCost will be set by purchases
            }
        });
        createdProductId = product.id;
    });

    afterAll(async () => {
        // Clean up database after all tests
        await prisma.purchaseInvoiceItem.deleteMany({});
        await prisma.purchaseInvoice.deleteMany({});
        await prisma.inventoryItem.deleteMany({});
        await prisma.product.deleteMany({});
        await prisma.supplier.deleteMany({});
        await prisma.shop.deleteMany({});
        await prisma.$disconnect();
    });

    describe('POST /api/purchases (Create Purchase Invoice)', () => {
        it('should create a purchase invoice for a new product, update inventory, and set WAC', async () => {
            // 1. Define data for a new product
            const newProductName = 'Brand New Racket';
            const newProductSku = 'NEWB001';
            const purchasePrice = 150;
            const purchaseQuantity = 10;

            // Create product first (as API expects productId)
            // In a real scenario, the UI might create product then purchase, or purchase API handles product creation
            // For this test, assume product is created just before, or API implies its creation from purchase (not current API)
            // Let's assume for now product must exist, if API doesn't create it from purchase items.
            // The current API's POST /api/purchases expects item.productId, implying product exists.

            const newTestProduct = await prisma.product.create({
                data: {
                    name: newProductName,
                    sku: newProductSku,
                    price: 250, // Retail price
                    shopId: createdShopId // Optional default shop association
                }
            });
            const newTestProductId = newTestProduct.id;

            // 2. Prepare the request body for POST /api/purchases
            const purchaseInvoicePayload = {
                supplierId: createdSupplierId.toString(),
                date: new Date().toISOString(),
                items: [
                    {
                        productId: newTestProductId.toString(),
                        quantity: purchaseQuantity,
                        price: purchasePrice,
                    },
                ],
                distributions: [ // Explicit distribution is crucial based on current POST API
                    {
                        [createdShopId]: purchaseQuantity
                    }
                ],
                totalAmount: purchaseQuantity * purchasePrice,
                status: 'paid',
            };

            // 3. Construct a NextRequest instance
            const req = new NextRequest('http://localhost/api/purchases', {
                method: 'POST',
                body: JSON.stringify(purchaseInvoicePayload),
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            // Simulate the API call
            const response = await createPurchaseInvoice(req);
            const responseBody = await response.json();

            // 4. Assertions
            expect(response.status).toBe(201); // Or 200 depending on your API's success response for POST
            expect(responseBody.data).toHaveProperty('id');
            const createdInvoiceId = responseBody.data.id;

            // Verify PurchaseInvoice in DB
            const dbInvoice = await prisma.purchaseInvoice.findUnique({
                where: { id: createdInvoiceId },
                include: { items: true },
            });
            expect(dbInvoice).not.toBeNull();
            expect(dbInvoice?.supplierId).toBe(createdSupplierId);
            expect(dbInvoice?.items.length).toBe(1);
            expect(dbInvoice?.items[0].productId).toBe(newTestProductId);
            expect(dbInvoice?.items[0].quantity).toBe(purchaseQuantity);
            expect(dbInvoice?.items[0].price).toBe(purchasePrice);

            // Verify InventoryItem in DB
            const dbInventoryItem = await prisma.inventoryItem.findFirst({
                where: {
                    productId: newTestProductId,
                    shopId: createdShopId,
                },
            });
            expect(dbInventoryItem).not.toBeNull();
            expect(dbInventoryItem?.quantity).toBe(purchaseQuantity);
            // The POST route seems to calculate shopSpecificCost too.
            // WAC = (Current Total Value + New Purchase Value) / (Current Quantity + New Quantity)
            // For new item, existing shopSpecificCost is 0, currentQuantity is 0.
            // So newShopSpecificCost should be newCost (purchasePrice)
            expect(dbInventoryItem?.shopSpecificCost).toBe(purchasePrice);


            // Verify Product WAC in DB
            const dbProduct = await prisma.product.findUnique({
                where: { id: newTestProductId },
            });
            expect(dbProduct).not.toBeNull();
            // For a new product, WAC should be equal to the purchase price of this first batch
            expect(dbProduct?.weightedAverageCost).toBe(purchasePrice);
        }, 15000); // Increased timeout

        it('should create a purchase for an existing product, update inventory, and recalculate WACs', async () => {
            // 0. Initial state: Product exists, potentially with some inventory and WAC
            const initialPurchasePrice = 120;
            const initialPurchaseQuantity = 5;
            const existingProductId = createdProductId; // From beforeEach

            // Create an initial purchase to set up existing inventory and WAC
            const initialPayload = {
                supplierId: createdSupplierId.toString(),
                date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
                items: [{
                    productId: existingProductId.toString(),
                    quantity: initialPurchaseQuantity,
                    price: initialPurchasePrice,
                }],
                distributions: [{ [createdShopId]: initialPurchaseQuantity }],
                totalAmount: initialPurchaseQuantity * initialPurchasePrice,
                status: 'paid',
            };
            const initialReq = new NextRequest('http://localhost/api/purchases', {
                method: 'POST',
                body: JSON.stringify(initialPayload),
                headers: { 'Content-Type': 'application/json' }
            });
            await createPurchaseInvoice(initialReq);

            const productBeforeNewPurchase = await prisma.product.findUnique({ where: { id: existingProductId } });
            const inventoryBeforeNewPurchase = await prisma.inventoryItem.findFirst({ where: { productId: existingProductId, shopId: createdShopId } });

            expect(productBeforeNewPurchase?.weightedAverageCost).toBe(initialPurchasePrice);
            expect(inventoryBeforeNewPurchase?.quantity).toBe(initialPurchaseQuantity);
            expect(inventoryBeforeNewPurchase?.shopSpecificCost).toBe(initialPurchasePrice);

            // 1. Define data for the new purchase of the existing product
            const newPurchasePrice = 100;
            const newPurchaseQuantity = 8;

            // 2. Prepare the request body
            const purchaseInvoicePayload = {
                supplierId: createdSupplierId.toString(),
                date: new Date().toISOString(),
                items: [
                    {
                        productId: existingProductId.toString(),
                        quantity: newPurchaseQuantity,
                        price: newPurchasePrice,
                    },
                ],
                distributions: [
                    {
                        [createdShopId]: newPurchaseQuantity
                    }
                ],
                totalAmount: newPurchaseQuantity * newPurchasePrice,
                status: 'paid',
            };

            // 3. Simulate API call
            const req = new NextRequest('http://localhost/api/purchases', {
                method: 'POST',
                body: JSON.stringify(purchaseInvoicePayload),
                headers: { 'Content-Type': 'application/json' }
            });
            const response = await createPurchaseInvoice(req);
            const responseBody = await response.json();

            // 4. Assertions
            expect(response.status).toBe(201);
            const createdInvoiceId = responseBody.data.id;

            // Verify InventoryItem
            const dbInventoryItem = await prisma.inventoryItem.findFirst({
                where: {
                    productId: existingProductId,
                    shopId: createdShopId,
                },
            });
            const expectedTotalQuantity = initialPurchaseQuantity + newPurchaseQuantity;
            expect(dbInventoryItem?.quantity).toBe(expectedTotalQuantity);

            // Verify shopSpecificCost recalculation
            // SSC = ((oldQty * oldSSC) + (newQty * newPrice)) / (oldQty + newQty)
            const expectedShopSpecificCost =
                ((initialPurchaseQuantity * initialPurchasePrice) + (newPurchaseQuantity * newPurchasePrice)) /
                (initialPurchaseQuantity + newPurchaseQuantity);
            expect(dbInventoryItem?.shopSpecificCost).toBeCloseTo(expectedShopSpecificCost);

            // Verify Product WAC recalculation
            // WAC = ((oldTotalQty * oldWAC) + (newPurchaseQty * newPurchasePrice)) / (newTotalQty + newPurchaseQty)
            // In this case, product WAC was initialPurchasePrice for initialPurchaseQuantity.
            const expectedProductWAC =
                ((initialPurchaseQuantity * initialPurchasePrice) + (newPurchaseQuantity * newPurchasePrice)) /
                (initialPurchaseQuantity + newPurchaseQuantity);
            const dbProduct = await prisma.product.findUnique({ where: { id: existingProductId } });
            expect(dbProduct?.weightedAverageCost).toBeCloseTo(expectedProductWAC);
        }, 15000); // Increased timeout

        it('should create a purchase with multiple items and update inventory/WAC for each', async () => {
            // 1. Create two distinct products for this test
            const product1Data = { name: 'MultiItem Product A', sku: 'MULTI001', price: 50, shopId: createdShopId };
            const product2Data = { name: 'MultiItem Product B', sku: 'MULTI002', price: 75, shopId: createdShopId };
            const product1 = await prisma.product.create({ data: product1Data });
            const product2 = await prisma.product.create({ data: product2Data });

            const purchasePrice1 = 40;
            const purchaseQuantity1 = 5;
            const purchasePrice2 = 60;
            const purchaseQuantity2 = 3;

            // 2. Prepare the request body
            const purchaseInvoicePayload = {
                supplierId: createdSupplierId.toString(),
                date: new Date().toISOString(),
                items: [
                    {
                        productId: product1.id.toString(),
                        quantity: purchaseQuantity1,
                        price: purchasePrice1,
                    },
                    {
                        productId: product2.id.toString(),
                        quantity: purchaseQuantity2,
                        price: purchasePrice2,
                    },
                ],
                distributions: [ // Explicit distribution for each item
                    { [createdShopId]: purchaseQuantity1 }, // Distribution for item 1
                    { [createdShopId]: purchaseQuantity2 }  // Distribution for item 2
                ],
                totalAmount: (purchaseQuantity1 * purchasePrice1) + (purchaseQuantity2 * purchasePrice2),
                status: 'pending',
            };

            // 3. Simulate API call
            const req = new NextRequest('http://localhost/api/purchases', {
                method: 'POST',
                body: JSON.stringify(purchaseInvoicePayload),
                headers: { 'Content-Type': 'application/json' }
            });
            const response = await createPurchaseInvoice(req);
            const responseBody = await response.json();

            // 4. Assertions
            expect(response.status).toBe(201);
            const createdInvoiceId = responseBody.data.id;

            // Verify PurchaseInvoice and its items
            const dbInvoice = await prisma.purchaseInvoice.findUnique({
                where: { id: createdInvoiceId },
                include: { items: { orderBy: { productId: 'asc' } } } // Order to ensure consistent assertion
            });
            expect(dbInvoice?.items.length).toBe(2);
            // Assuming product1.id < product2.id due to creation order for consistent checks
            const sortedProducts = [product1, product2].sort((a, b) => a.id - b.id);

            expect(dbInvoice?.items[0].productId).toBe(sortedProducts[0].id);
            expect(dbInvoice?.items[0].quantity).toBe(purchaseQuantity1);
            expect(dbInvoice?.items[0].price).toBe(purchasePrice1);

            expect(dbInvoice?.items[1].productId).toBe(sortedProducts[1].id);
            expect(dbInvoice?.items[1].quantity).toBe(purchaseQuantity2);
            expect(dbInvoice?.items[1].price).toBe(purchasePrice2);

            // Verify InventoryItem and Product WAC for Product 1
            const dbInventoryItem1 = await prisma.inventoryItem.findFirst({
                where: { productId: product1.id, shopId: createdShopId },
            });
            expect(dbInventoryItem1?.quantity).toBe(purchaseQuantity1);
            expect(dbInventoryItem1?.shopSpecificCost).toBe(purchasePrice1);
            const dbProduct1 = await prisma.product.findUnique({ where: { id: product1.id } });
            expect(dbProduct1?.weightedAverageCost).toBe(purchasePrice1);

            // Verify InventoryItem and Product WAC for Product 2
            const dbInventoryItem2 = await prisma.inventoryItem.findFirst({
                where: { productId: product2.id, shopId: createdShopId },
            });
            expect(dbInventoryItem2?.quantity).toBe(purchaseQuantity2);
            expect(dbInventoryItem2?.shopSpecificCost).toBe(purchasePrice2);
            const dbProduct2 = await prisma.product.findUnique({ where: { id: product2.id } });
            expect(dbProduct2?.weightedAverageCost).toBe(purchasePrice2);
        }, 15000); // Increased timeout

        it('should distribute a single purchase item to multiple shops', async () => {
            // 1. Create two new shops for this test
            const shopA = await prisma.shop.create({ data: { name: 'Test Shop A', location: 'Loc A' } });
            const shopB = await prisma.shop.create({ data: { name: 'Test Shop B', location: 'Loc B' } });

            // 2. Create a new product
            const product = await prisma.product.create({ data: { name: 'Split Product', sku: 'SPLIT001', price: 200 } });
            const purchasePrice = 180;
            const totalQuantity = 10;
            const quantityForShopA = 6;
            const quantityForShopB = 4;

            expect(quantityForShopA + quantityForShopB).toBe(totalQuantity); // Sanity check

            // 3. Prepare request body
            const purchaseInvoicePayload = {
                supplierId: createdSupplierId.toString(),
                date: new Date().toISOString(),
                items: [
                    {
                        productId: product.id.toString(),
                        quantity: totalQuantity, // Total quantity for the item line
                        price: purchasePrice,
                    },
                ],
                distributions: [
                    { // Distribution for the single item, split into two shops
                        [shopA.id]: quantityForShopA,
                        [shopB.id]: quantityForShopB,
                    }
                ],
                totalAmount: totalQuantity * purchasePrice,
                status: 'paid',
            };

            // 4. Simulate API call
            const req = new NextRequest('http://localhost/api/purchases', {
                method: 'POST',
                body: JSON.stringify(purchaseInvoicePayload),
                headers: { 'Content-Type': 'application/json' }
            });
            const response = await createPurchaseInvoice(req);
            const responseBody = await response.json();

            // 5. Assertions
            expect(response.status).toBe(201);

            // Verify InventoryItem for Shop A
            const invItemA = await prisma.inventoryItem.findFirst({
                where: { productId: product.id, shopId: shopA.id }
            });
            expect(invItemA).not.toBeNull();
            expect(invItemA?.quantity).toBe(quantityForShopA);
            expect(invItemA?.shopSpecificCost).toBe(purchasePrice);

            // Verify InventoryItem for Shop B
            const invItemB = await prisma.inventoryItem.findFirst({
                where: { productId: product.id, shopId: shopB.id }
            });
            expect(invItemB).not.toBeNull();
            expect(invItemB?.quantity).toBe(quantityForShopB);
            expect(invItemB?.shopSpecificCost).toBe(purchasePrice);

            // Verify Product WAC (should be the purchase price as it's all new stock)
            const dbProduct = await prisma.product.findUnique({ where: { id: product.id } });
            expect(dbProduct?.weightedAverageCost).toBe(purchasePrice);
        }, 15000); // Increased timeout

        it('should fail to create a purchase if a productId does not exist', async () => {
            const nonExistentProductId = 999999; // Assuming this ID won't exist
            const purchasePrice = 100;
            const purchaseQuantity = 5;

            const purchaseInvoicePayload = {
                supplierId: createdSupplierId.toString(),
                date: new Date().toISOString(),
                items: [
                    {
                        productId: nonExistentProductId.toString(),
                        quantity: purchaseQuantity,
                        price: purchasePrice,
                    },
                ],
                distributions: [
                    { [createdShopId]: purchaseQuantity }
                ],
                totalAmount: purchaseQuantity * purchasePrice,
                status: 'paid',
            };

            const req = new NextRequest('http://localhost/api/purchases', {
                method: 'POST',
                body: JSON.stringify(purchaseInvoicePayload),
                headers: { 'Content-Type': 'application/json' }
            });
            const response = await createPurchaseInvoice(req);

            // Expect a client error (e.g., 400 or 404) or potentially 500 if not handled gracefully
            // For robust error handling, API should return specific error code.
            // Prisma will throw an error if a related record (product) is not found for foreign key.
            // This will likely result in a 500 if not caught and handled by the API route.
            // Let's aim for the API to catch this and return a more specific client error.
            // For now, we'll check if it's NOT a success (201).
            // A more precise check would be for 400/404/422 depending on planned error handling.
            expect(response.status).toBe(500); // Or 400/404 if you implement specific error handling

            const responseBody = await response.json();
            expect(responseBody.error).toBeDefined();
            // Optionally, check for a specific error message or code if your API provides one.
        }, 15000); // Increased timeout

        it('should fail to create a purchase if a supplierId does not exist', async () => {
            const newTestProduct = await prisma.product.create({
                data: {
                    name: 'Product For Invalid Supplier Test',
                    sku: 'INV SUP001',
                    price: 100,
                }
            });
            const purchasePrice = 80;
            const purchaseQuantity = 5;
            const nonExistentSupplierId = 999999; // Assuming this ID won't exist

            const purchaseInvoicePayload = {
                supplierId: nonExistentSupplierId.toString(), // Invalid supplier
                date: new Date().toISOString(),
                items: [
                    {
                        productId: newTestProduct.id.toString(),
                        quantity: purchaseQuantity,
                        price: purchasePrice,
                    },
                ],
                distributions: [
                    { [createdShopId]: purchaseQuantity }
                ],
                totalAmount: purchaseQuantity * purchasePrice,
                status: 'paid',
            };

            const req = new NextRequest('http://localhost/api/purchases', {
                method: 'POST',
                body: JSON.stringify(purchaseInvoicePayload),
                headers: { 'Content-Type': 'application/json' }
            });
            const response = await createPurchaseInvoice(req);

            expect(response.status).toBe(500); // Expecting 500 as Prisma throws P2003

            const responseBody = await response.json();
            expect(responseBody.error).toBeDefined();
        });
    });

    describe('PUT /api/purchases/:id (Update Purchase Invoice)', () => {
        let existingInvoiceId: string;
        let productForUpdateTestsId: number;
        const initialPurchasePrice = 50;
        const initialPurchaseQuantity = 10;

        beforeEach(async () => {
            // Create a product specifically for these update/delete tests if not already created
            // The global createdProductId can be used if it fits, or make a new one.
            // Let's use the global one for simplicity, assuming beforeEach cleans it up.
            productForUpdateTestsId = createdProductId;

            // Create an initial purchase invoice to be updated or deleted in tests
            const initialInvoicePayload = {
                supplierId: createdSupplierId.toString(),
                date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
                items: [
                    {
                        productId: productForUpdateTestsId.toString(),
                        quantity: initialPurchaseQuantity,
                        price: initialPurchasePrice,
                    },
                ],
                distributions: [
                    { [createdShopId]: initialPurchaseQuantity }
                ],
                totalAmount: initialPurchaseQuantity * initialPurchasePrice,
                status: 'paid',
            };
            const req = new NextRequest('http://localhost/api/purchases', {
                method: 'POST',
                body: JSON.stringify(initialInvoicePayload),
                headers: { 'Content-Type': 'application/json' },
            });
            const response = await createPurchaseInvoice(req);
            const body = await response.json();
            existingInvoiceId = body.data.id;

            // Sanity check: verify initial state
            const initialProduct = await prisma.product.findUnique({ where: { id: productForUpdateTestsId } });
            expect(initialProduct?.weightedAverageCost).toBe(initialPurchasePrice);
            const initialInventory = await prisma.inventoryItem.findFirst({
                where: { productId: productForUpdateTestsId, shopId: createdShopId }
            });
            expect(initialInventory?.quantity).toBe(initialPurchaseQuantity);
            expect(initialInventory?.shopSpecificCost).toBe(initialPurchasePrice);
        });

        it('should update item quantity (increase), recalculate stock and WACs', async () => {
            const quantityIncrease = 5;
            const newQuantity = initialPurchaseQuantity + quantityIncrease;
            // Price remains the same for this item in this update scenario
            const updatedPriceForItem = initialPurchasePrice;

            const updatePayload = {
                // We need to send the complete structure expected by the PUT route
                // This includes all items, even if only one is changing.
                // The PUT route logic might compare with existing items to see what changed.
                items: [
                    {
                        // If the item had an ID (PurchaseInvoiceItem id), it might be needed.
                        // Let's assume for now the PUT matches items based on productId if not item ID.
                        // Based on current PUT route, it expects productId.
                        productId: productForUpdateTestsId.toString(),
                        quantity: newQuantity,
                        price: updatedPriceForItem, // Send the original price if it hasn't changed
                    }
                ],
                distributions: [
                    // The distributions in PUT might need to reflect the *new total* for the item
                    { [createdShopId]: newQuantity }
                ],
                // Other fields like supplierId, date, totalAmount might be updatable too.
                // For this test, focus on item quantity change.
                // The PUT route recalculates totalAmount based on items if not provided or if items change.
                // Let's assume totalAmount will be recalculated by the API.
                // supplierId and date could be part of the payload if they are updatable.
                // For now, keeping it minimal to test item update.
                // The PUT handler re-calculates total amount, so not sending it.
            };

            const req = new NextRequest(`http://localhost/api/purchases/${existingInvoiceId}`, {
                method: 'PUT',
                body: JSON.stringify(updatePayload),
                headers: { 'Content-Type': 'application/json' },
                // IMPORTANT: Need to pass route params for [id] to the handler
                // This is not standard NextRequest but how test setup might need it or how handler expects it.
                // The actual handler `updatePurchaseInvoice(request: NextRequest, { params }: { params: { id: string } })`
                // needs `params`. node-mocks-http `createMocks` handles this well.
                // For direct NextRequest, we pass it in context to the handler call.
            });

            // Simulate API call - updatePurchaseInvoice(req, { params: { id: existingInvoiceId } })
            // This is how you call it if you are testing the handler directly in Jest with context
            const response = await updatePurchaseInvoice(req, { params: { id: existingInvoiceId } });
            const responseBody = await response.json();

            expect(response.status).toBe(200);
            expect(responseBody.data).toHaveProperty('id', existingInvoiceId);

            // Verify InventoryItem stock and shopSpecificCost
            const updatedInventory = await prisma.inventoryItem.findFirst({
                where: { productId: productForUpdateTestsId, shopId: createdShopId }
            });
            expect(updatedInventory?.quantity).toBe(newQuantity);

            // WAC calculation: ((oldQty * oldSSC) + (addedQty * priceOfAddedQty)) / (newTotalQty)
            // In this specific update, the PUT route reverses the old item and adds the new one as if it's a new purchase line for WAC calcs.
            // So, the old initialPurchaseQuantity at initialPurchasePrice is reversed.
            // Then, newQuantity at updatedPriceForItem is added.
            // However, the current PUT logic first reverses *all* old items based on their *original* recorded cost.
            // Then it adds *all* new items based on their *new* cost.
            // So for the product WAC: (TotalValueBefore - OldItemValue + NewItemValue) / (TotalStockBefore - OldItemQty + NewItemQty)
            // And for shop specific WAC: (ShopValueBefore - OldItemValueInShop + NewItemValueInShop) / (ShopStockBefore - OldItemQtyInShop + NewItemQtyInShop)

            // Let's check the logic from src/app/api/purchases/[id]/route.ts
            // 1. It fetches the old invoice.
            // 2. It reverses inventory adjustments for ALL old items (decrease stock, WAC updated).
            // 3. It processes ALL new/updated items as if they are new purchases (increase stock, WAC updated).

            // So, after reversal of initialPurchaseQuantity at initialPurchasePrice:
            // Product WAC and ShopSpecificCost would be effectively 0 if this were the only product/stock.
            // Then, adding newQuantity at updatedPriceForItem:
            // The new WACs should become updatedPriceForItem.
            expect(updatedInventory?.shopSpecificCost).toBeCloseTo(updatedPriceForItem);

            // Verify Product WAC
            const updatedProduct = await prisma.product.findUnique({ where: { id: productForUpdateTestsId } });
            expect(updatedProduct?.weightedAverageCost).toBeCloseTo(updatedPriceForItem);

            // Verify PurchaseInvoiceItem in DB reflects the change
            const dbInvoice = await prisma.purchaseInvoice.findUnique({
                where: { id: existingInvoiceId },
                include: { items: true },
            });
            expect(dbInvoice?.items.length).toBe(1);
            expect(dbInvoice?.items[0].quantity).toBe(newQuantity);
            expect(dbInvoice?.items[0].price).toBe(updatedPriceForItem);
            expect(dbInvoice?.total).toBe(newQuantity * updatedPriceForItem);
        }, 15000); // Increased timeout

        it('should update item quantity (decrease), recalculate stock and WACs', async () => {
            const quantityDecrease = 3;
            const newQuantity = initialPurchaseQuantity - quantityDecrease;
            expect(newQuantity).toBeGreaterThanOrEqual(0); // Ensure we don't go negative for this test logic

            const updatedPriceForItem = initialPurchasePrice; // Price remains the same

            const updatePayload = {
                items: [
                    {
                        productId: productForUpdateTestsId.toString(),
                        quantity: newQuantity,
                        price: updatedPriceForItem,
                    }
                ],
                distributions: [
                    { [createdShopId]: newQuantity }
                ],
            };

            const req = new NextRequest(`http://localhost/api/purchases/${existingInvoiceId}`, {
                method: 'PUT',
                body: JSON.stringify(updatePayload),
                headers: { 'Content-Type': 'application/json' },
            });

            const response = await updatePurchaseInvoice(req, { params: { id: existingInvoiceId } });
            const responseBody = await response.json();

            expect(response.status).toBe(200);
            expect(responseBody.data).toHaveProperty('id', existingInvoiceId);

            // Verify InventoryItem stock and shopSpecificCost
            const updatedInventory = await prisma.inventoryItem.findFirst({
                where: { productId: productForUpdateTestsId, shopId: createdShopId }
            });
            expect(updatedInventory?.quantity).toBe(newQuantity);

            // Due to the reversal and re-addition logic of the PUT route:
            // The old initialPurchaseQuantity at initialPurchasePrice is reversed.
            // Then, newQuantity at updatedPriceForItem is added.
            // So, new WACs should become updatedPriceForItem (which is initialPurchasePrice).
            expect(updatedInventory?.shopSpecificCost).toBeCloseTo(updatedPriceForItem);

            // Verify Product WAC
            const updatedProduct = await prisma.product.findUnique({ where: { id: productForUpdateTestsId } });
            expect(updatedProduct?.weightedAverageCost).toBeCloseTo(updatedPriceForItem);

            // Verify PurchaseInvoiceItem in DB
            const dbInvoice = await prisma.purchaseInvoice.findUnique({
                where: { id: existingInvoiceId },
                include: { items: true },
            });
            expect(dbInvoice?.items.length).toBe(1);
            expect(dbInvoice?.items[0].quantity).toBe(newQuantity);
            expect(dbInvoice?.items[0].price).toBe(updatedPriceForItem);
            expect(dbInvoice?.total).toBe(newQuantity * updatedPriceForItem);
        }, 15000); // Increased timeout

        it('should update item price, recalculate stock and WACs', async () => {
            const newPriceForItem = initialPurchasePrice + 25; // New price, e.g., 50 + 25 = 75
            const quantityUnchanged = initialPurchaseQuantity; // Quantity remains the same

            const updatePayload = {
                items: [
                    {
                        productId: productForUpdateTestsId.toString(),
                        quantity: quantityUnchanged,
                        price: newPriceForItem,
                    }
                ],
                distributions: [
                    { [createdShopId]: quantityUnchanged }
                ],
                // totalAmount will be recalculated by the API
            };

            const req = new NextRequest(`http://localhost/api/purchases/${existingInvoiceId}`, {
                method: 'PUT',
                body: JSON.stringify(updatePayload),
                headers: { 'Content-Type': 'application/json' },
            });

            const response = await updatePurchaseInvoice(req, { params: { id: existingInvoiceId } });
            const responseBody = await response.json();

            expect(response.status).toBe(200);
            expect(responseBody.data).toHaveProperty('id', existingInvoiceId);

            // Verify InventoryItem stock (should be unchanged) and shopSpecificCost
            const updatedInventory = await prisma.inventoryItem.findFirst({
                where: { productId: productForUpdateTestsId, shopId: createdShopId }
            });
            expect(updatedInventory?.quantity).toBe(quantityUnchanged);
            // WAC logic in PUT: reverses old, adds new. So shopSpecificCost should reflect newPriceForItem.
            expect(updatedInventory?.shopSpecificCost).toBeCloseTo(newPriceForItem);

            // Verify Product WAC
            const updatedProduct = await prisma.product.findUnique({ where: { id: productForUpdateTestsId } });
            expect(updatedProduct?.weightedAverageCost).toBeCloseTo(newPriceForItem);

            // Verify PurchaseInvoiceItem in DB
            const dbInvoice = await prisma.purchaseInvoice.findUnique({
                where: { id: existingInvoiceId },
                include: { items: true },
            });
            expect(dbInvoice?.items.length).toBe(1);
            expect(dbInvoice?.items[0].quantity).toBe(quantityUnchanged);
            expect(dbInvoice?.items[0].price).toBe(newPriceForItem);
            expect(dbInvoice?.total).toBe(quantityUnchanged * newPriceForItem);
        }, 15000); // Increased timeout

        it('should add a new item to an existing invoice, update stock and WACs', async () => {
            // 1. Define a new product for the new item
            const newItemProduct = await prisma.product.create({
                data: {
                    name: 'Newly Added Product for PUT',
                    sku: 'PUTNEW001',
                    price: 200, // Retail price
                }
            });
            const newItemProductId = newItemProduct.id;
            const newItemQuantity = 7;
            const newItemPrice = 120;

            // Original item details (from beforeEach setup)
            const originalItemProductId = productForUpdateTestsId;
            const originalItemQuantity = initialPurchaseQuantity;
            const originalItemPrice = initialPurchasePrice;

            // 2. Prepare the update payload with both original and new item
            const updatePayload = {
                items: [
                    {
                        productId: originalItemProductId.toString(),
                        quantity: originalItemQuantity,
                        price: originalItemPrice,
                    },
                    {
                        productId: newItemProductId.toString(),
                        quantity: newItemQuantity,
                        price: newItemPrice,
                    }
                ],
                distributions: [
                    { [createdShopId]: originalItemQuantity }, // Distribution for original item
                    { [createdShopId]: newItemQuantity }      // Distribution for new item
                ],
                // totalAmount will be recalculated by the API
            };

            // 3. Simulate API call
            const req = new NextRequest(`http://localhost/api/purchases/${existingInvoiceId}`, {
                method: 'PUT',
                body: JSON.stringify(updatePayload),
                headers: { 'Content-Type': 'application/json' },
            });
            const response = await updatePurchaseInvoice(req, { params: { id: existingInvoiceId } });
            const responseBody = await response.json();

            // 4. Assertions
            expect(response.status).toBe(200);
            expect(responseBody.data).toHaveProperty('id', existingInvoiceId);

            // Verify PurchaseInvoice in DB
            const dbInvoice = await prisma.purchaseInvoice.findUnique({
                where: { id: existingInvoiceId },
                include: { items: { orderBy: { productId: 'asc' } } }, // Order for consistent checks
            });
            expect(dbInvoice?.items.length).toBe(2);

            const expectedTotal = (originalItemQuantity * originalItemPrice) + (newItemQuantity * newItemPrice);
            expect(dbInvoice?.total).toBe(expectedTotal);

            // Find the items in the response (order might vary, so find by productId)
            const dbOriginalItem = dbInvoice?.items.find(item => item.productId === originalItemProductId);
            const dbNewItem = dbInvoice?.items.find(item => item.productId === newItemProductId);

            expect(dbOriginalItem).toBeDefined();
            expect(dbOriginalItem?.quantity).toBe(originalItemQuantity);
            expect(dbOriginalItem?.price).toBe(originalItemPrice);

            expect(dbNewItem).toBeDefined();
            expect(dbNewItem?.quantity).toBe(newItemQuantity);
            expect(dbNewItem?.price).toBe(newItemPrice);

            // Verify InventoryItem and Product WAC for the original item
            // (Due to PUT logic of reverse & re-add, WACs should reflect its current price)
            const originalInventory = await prisma.inventoryItem.findFirst({
                where: { productId: originalItemProductId, shopId: createdShopId }
            });
            expect(originalInventory?.quantity).toBe(originalItemQuantity);
            expect(originalInventory?.shopSpecificCost).toBeCloseTo(originalItemPrice);
            const originalProduct = await prisma.product.findUnique({ where: { id: originalItemProductId } });
            expect(originalProduct?.weightedAverageCost).toBeCloseTo(originalItemPrice);

            // Verify InventoryItem and Product WAC for the NEW item
            const newInventory = await prisma.inventoryItem.findFirst({
                where: { productId: newItemProductId, shopId: createdShopId }
            });
            expect(newInventory?.quantity).toBe(newItemQuantity);
            expect(newInventory?.shopSpecificCost).toBeCloseTo(newItemPrice);
            const newProductDb = await prisma.product.findUnique({ where: { id: newItemProductId } });
            expect(newProductDb?.weightedAverageCost).toBeCloseTo(newItemPrice);
        }, 15000); // Increased timeout

        it('should remove an item from an existing invoice, update stock and WACs', async () => {
            // 1. Setup: Ensure an invoice with at least two items exists.
            // We'll use the existing `productForUpdateTestsId` and create one more product and item.
            const productToRemove = await prisma.product.create({
                data: {
                    name: 'Product To Be Removed',
                    sku: 'PUTRMV001',
                    price: 300,
                }
            });
            const productToRemoveId = productToRemove.id;
            const productToRemoveQuantity = 4;
            const productToRemovePrice = 40;

            // Update the existing invoice (created in global beforeEach for PUT) to include this second item first.
            const addSecondItemPayload = {
                items: [
                    {
                        productId: productForUpdateTestsId.toString(),
                        quantity: initialPurchaseQuantity,
                        price: initialPurchasePrice,
                    },
                    {
                        productId: productToRemoveId.toString(),
                        quantity: productToRemoveQuantity,
                        price: productToRemovePrice,
                    }
                ],
                distributions: [
                    { [createdShopId]: initialPurchaseQuantity },
                    { [createdShopId]: productToRemoveQuantity }
                ],
            };
            const addReq = new NextRequest(`http://localhost/api/purchases/${existingInvoiceId}`, {
                method: 'PUT',
                body: JSON.stringify(addSecondItemPayload),
                headers: { 'Content-Type': 'application/json' },
            });
            await updatePurchaseInvoice(addReq, { params: { id: existingInvoiceId } });

            // Sanity check: Invoice should have 2 items
            let invoiceWithTwoItems = await prisma.purchaseInvoice.findUnique({ where: { id: existingInvoiceId }, include: { items: true } });
            expect(invoiceWithTwoItems?.items.length).toBe(2);

            // 2. Prepare the update payload that only contains the item we want to keep.
            const updatePayloadToRemoveItem = {
                items: [
                    {
                        productId: productForUpdateTestsId.toString(), // Keep this one
                        quantity: initialPurchaseQuantity,
                        price: initialPurchasePrice,
                    }
                ],
                distributions: [
                    { [createdShopId]: initialPurchaseQuantity } // Distribution for the kept item
                ],
            };

            // 3. Simulate API call to remove the item
            const removeReq = new NextRequest(`http://localhost/api/purchases/${existingInvoiceId}`, {
                method: 'PUT',
                body: JSON.stringify(updatePayloadToRemoveItem),
                headers: { 'Content-Type': 'application/json' },
            });
            const response = await updatePurchaseInvoice(removeReq, { params: { id: existingInvoiceId } });
            const responseBody = await response.json();

            // 4. Assertions
            expect(response.status).toBe(200);
            expect(responseBody.data).toHaveProperty('id', existingInvoiceId);

            // Verify PurchaseInvoice in DB - should now have only 1 item
            const dbInvoice = await prisma.purchaseInvoice.findUnique({
                where: { id: existingInvoiceId },
                include: { items: true },
            });
            expect(dbInvoice?.items.length).toBe(1);
            expect(dbInvoice?.items[0].productId).toBe(productForUpdateTestsId);
            expect(dbInvoice?.items[0].quantity).toBe(initialPurchaseQuantity);
            expect(dbInvoice?.items[0].price).toBe(initialPurchasePrice);
            expect(dbInvoice?.total).toBe(initialPurchaseQuantity * initialPurchasePrice);

            // Verify InventoryItem and Product WAC for the KEPT item
            const keptInventory = await prisma.inventoryItem.findFirst({
                where: { productId: productForUpdateTestsId, shopId: createdShopId }
            });
            expect(keptInventory?.quantity).toBe(initialPurchaseQuantity);
            expect(keptInventory?.shopSpecificCost).toBeCloseTo(initialPurchasePrice);
            const keptProduct = await prisma.product.findUnique({ where: { id: productForUpdateTestsId } });
            expect(keptProduct?.weightedAverageCost).toBeCloseTo(initialPurchasePrice);

            // Verify InventoryItem and Product WAC for the REMOVED item
            // Stock should be zero or the item might be gone from inventory if it was the only purchase
            // WAC on product should be 0 if no other purchases exist.
            const removedInventory = await prisma.inventoryItem.findFirst({
                where: { productId: productToRemoveId, shopId: createdShopId }
            });
            // The PUT logic reverses stock. If this was the only stock, it becomes 0.
            expect(removedInventory?.quantity).toBe(0);
            // ShopSpecificCost might become 0 or NaN if quantity is 0. The API sets it to 0 for safety.
            expect(removedInventory?.shopSpecificCost).toBeCloseTo(0);

            const removedProductDb = await prisma.product.findUnique({ where: { id: productToRemoveId } });
            // If no other purchase items for this product, WAC should become 0.
            const otherPurchasesOfRemovedItem = await prisma.purchaseInvoiceItem.count({
                where: { productId: productToRemoveId }
            });
            if (otherPurchasesOfRemovedItem === 0) {
                expect(removedProductDb?.weightedAverageCost).toBeCloseTo(0);
            } // Else, it would be based on other purchases, which this test doesn't set up.

        }, 15000); // Increased timeout
    });

    describe('DELETE /api/purchases/:id (Delete Purchase Invoice)', () => {
        let invoiceToDeleteId: string;
        let productForDeleteTestId: number;
        const deleteTestInitialPrice = 60;
        const deleteTestInitialQuantity = 12;

        beforeEach(async () => {
            // Ensure product exists for the test
            const product = await prisma.product.create({
                data: {
                    name: 'Product For Delete Test',
                    sku: 'DELPROD001',
                    price: 100, // retail
                }
            });
            productForDeleteTestId = product.id;

            // Create an initial purchase invoice to be deleted
            const initialInvoicePayload = {
                supplierId: createdSupplierId.toString(),
                date: new Date().toISOString(),
                items: [
                    {
                        productId: productForDeleteTestId.toString(),
                        quantity: deleteTestInitialQuantity,
                        price: deleteTestInitialPrice,
                    },
                ],
                distributions: [
                    { [createdShopId]: deleteTestInitialQuantity } // Explicit distribution
                ],
                totalAmount: deleteTestInitialQuantity * deleteTestInitialPrice,
                status: 'paid',
            };
            const req = new NextRequest('http://localhost/api/purchases', {
                method: 'POST',
                body: JSON.stringify(initialInvoicePayload),
                headers: { 'Content-Type': 'application/json' },
            });
            const response = await createPurchaseInvoice(req);
            const body = await response.json();
            invoiceToDeleteId = body.data.id;

            // Sanity check: verify initial state after creation
            const initialProductDB = await prisma.product.findUnique({ where: { id: productForDeleteTestId } });
            expect(initialProductDB?.weightedAverageCost).toBe(deleteTestInitialPrice);
            const initialInventory = await prisma.inventoryItem.findFirst({
                where: { productId: productForDeleteTestId, shopId: createdShopId }
            });
            expect(initialInventory?.quantity).toBe(deleteTestInitialQuantity);
            expect(initialInventory?.shopSpecificCost).toBe(deleteTestInitialPrice);
        });

        it('should delete a purchase invoice and correctly reverse stock and WACs for a single-item invoice with explicit distribution', async () => {
            // 1. Call the DELETE endpoint
            const deleteReq = new NextRequest(`http://localhost/api/purchases/${invoiceToDeleteId}`, {
                method: 'DELETE',
            });
            const deleteResponse = await deletePurchaseInvoice(deleteReq, { params: { id: invoiceToDeleteId } });

            // 2. Assertions for DELETE response
            expect(deleteResponse.status).toBe(200);
            const deleteResponseBody = await deleteResponse.json();
            expect(deleteResponseBody.message).toBe('Purchase invoice deleted successfully');

            // 3. Verify PurchaseInvoice is deleted from DB
            const dbInvoice = await prisma.purchaseInvoice.findUnique({
                where: { id: invoiceToDeleteId },
            });
            expect(dbInvoice).toBeNull();

            // 4. Verify PurchaseInvoiceItems are deleted
            const dbInvoiceItems = await prisma.purchaseInvoiceItem.findMany({
                where: { purchaseInvoiceId: invoiceToDeleteId },
            });
            expect(dbInvoiceItems.length).toBe(0);

            // 5. Verify InventoryItem stock is reversed
            const updatedInventory = await prisma.inventoryItem.findFirst({
                where: { productId: productForDeleteTestId, shopId: createdShopId }
            });
            // Assuming this was the only purchase, stock should be 0
            expect(updatedInventory?.quantity).toBe(0);
            // ShopSpecificCost should also be 0 if stock is 0
            expect(updatedInventory?.shopSpecificCost).toBeCloseTo(0);


            // 6. Verify Product WAC is recalculated (should be 0 if this was the only purchase)
            const updatedProduct = await prisma.product.findUnique({
                where: { id: productForDeleteTestId },
            });
            // If no other purchase items for this product, WAC should become 0.
            const otherPurchasesOfProduct = await prisma.purchaseInvoiceItem.count({
                where: {
                    productId: productForDeleteTestId,
                    // purchaseInvoiceId: { not: invoiceToDeleteId } // Not needed as original invoice items are gone
                }
            });
            if (otherPurchasesOfProduct === 0) { // This should be true for this test
                expect(updatedProduct?.weightedAverageCost).toBeCloseTo(0);
            }
        });

        it('should delete a purchase and reverse stock/WAC when product is in a single inferred shop', async () => {
            // 1. Setup: Create dedicated entities for this test to ensure isolation.
            const testShop = await prisma.shop.create({
                data: { name: 'Inferred Delete Test Shop', location: 'Loc X' }
            });
            const testSupplier = await prisma.supplier.create({
                data: { name: 'Inferred Delete Test Supplier' }
            });
            const testProduct = await prisma.product.create({
                data: {
                    name: 'Product for Inferred Delete',
                    sku: 'INFDEL001',
                    price: 200, // retail price
                    weightedAverageCost: 0
                }
            });

            // Create an inventory item for this product in the test shop.
            // This makes it the "single inferred shop".
            await prisma.inventoryItem.create({
                data: {
                    productId: testProduct.id,
                    shopId: testShop.id,
                    quantity: 0, // Will be updated by the purchase
                    shopSpecificCost: 0
                }
            });

            const purchaseQuantity = 12;
            const purchasePrice = 60;

            const inferredShopInvoicePayload = {
                supplierId: testSupplier.id.toString(),
                date: new Date().toISOString(),
                items: [
                    {
                        productId: testProduct.id.toString(),
                        quantity: purchaseQuantity,
                        price: purchasePrice,
                    },
                ],
                // NO distributions property here for inference to kick in on POST
                totalAmount: purchaseQuantity * purchasePrice,
                status: 'paid',
            };

            // Create the purchase invoice (this is where the failure was happening)
            const createReq = new NextRequest('http://localhost/api/purchases', {
                method: 'POST',
                body: JSON.stringify(inferredShopInvoicePayload),
                headers: { 'Content-Type': 'application/json' },
            });
            const createResponse = await createPurchaseInvoice(createReq);
            expect(createResponse.status).toBe(201); // Assert successful creation

            const createBody = await createResponse.json();
            const invoiceIdForInferredDelete = createBody.data.id;

            // Sanity check: Verify stock and WAC after creation
            const inventoryAfterCreate = await prisma.inventoryItem.findFirst({
                where: { productId: testProduct.id, shopId: testShop.id }
            });
            expect(inventoryAfterCreate?.quantity).toBe(purchaseQuantity);
            expect(inventoryAfterCreate?.shopSpecificCost).toBeCloseTo(purchasePrice);
            const productAfterCreate = await prisma.product.findUnique({ where: { id: testProduct.id } });
            expect(productAfterCreate?.weightedAverageCost).toBeCloseTo(purchasePrice);

            // 2. Call the DELETE endpoint
            const deleteReq = new NextRequest(`http://localhost/api/purchases/${invoiceIdForInferredDelete}`, {
                method: 'DELETE',
            });
            const deleteResponse = await deletePurchaseInvoice(deleteReq, { params: { id: invoiceIdForInferredDelete } });

            // 3. Assertions for DELETE response
            expect(deleteResponse.status).toBe(200);
            const deleteResponseBody = await deleteResponse.json();
            expect(deleteResponseBody.message).toBe('Purchase invoice deleted successfully');

            // 4. Verify PurchaseInvoice and Items are deleted
            const dbInvoice = await prisma.purchaseInvoice.findUnique({ where: { id: invoiceIdForInferredDelete } });
            expect(dbInvoice).toBeNull();
            const dbInvoiceItems = await prisma.purchaseInvoiceItem.findMany({ where: { purchaseInvoiceId: invoiceIdForInferredDelete } });
            expect(dbInvoiceItems.length).toBe(0);

            // 5. Verify InventoryItem stock and shopSpecificCost are reversed in the inferred shop
            const updatedInventory = await prisma.inventoryItem.findFirst({
                where: { productId: testProduct.id, shopId: testShop.id }
            });
            expect(updatedInventory?.quantity).toBe(0);
            expect(updatedInventory?.shopSpecificCost).toBeCloseTo(0);

            // 6. Verify Product WAC is recalculated to 0
            const updatedProductDB = await prisma.product.findUnique({ where: { id: testProduct.id } });
            expect(updatedProductDB?.weightedAverageCost).toBeCloseTo(0);

            // Cleanup dedicated entities for this test
            await prisma.inventoryItem.deleteMany({ where: { productId: testProduct.id } });
            await prisma.product.delete({ where: { id: testProduct.id } });
            await prisma.supplier.delete({ where: { id: testSupplier.id } });
            await prisma.shop.delete({ where: { id: testShop.id } });
        }, 15000); // Added a longer timeout as a precaution

        it('should delete an invoice with multiple items, reversing stock/WAC for each', async () => {
            // 1. Setup: Create multiple products and an invoice with items from these products.
            // For simplicity, distribute each to the main createdShopId from global beforeEach.

            const productA = await prisma.product.create({
                data: { name: 'Multi-Del Prod A', sku: 'MDEL00A', price: 100, weightedAverageCost: 0 }
            });
            const productB = await prisma.product.create({
                data: { name: 'Multi-Del Prod B', sku: 'MDEL00B', price: 200, weightedAverageCost: 0 }
            });

            const quantityA = 5;
            const priceA = 50;
            const quantityB = 3;
            const priceB = 120;

            const multiItemInvoicePayload = {
                supplierId: createdSupplierId.toString(),
                date: new Date().toISOString(),
                items: [
                    { productId: productA.id.toString(), quantity: quantityA, price: priceA },
                    { productId: productB.id.toString(), quantity: quantityB, price: priceB },
                ],
                distributions: [
                    { [createdShopId]: quantityA }, // Item A to main shop
                    { [createdShopId]: quantityB }  // Item B to main shop
                ],
                totalAmount: (quantityA * priceA) + (quantityB * priceB),
                status: 'paid',
            };

            const createReq = new NextRequest('http://localhost/api/purchases', {
                method: 'POST',
                body: JSON.stringify(multiItemInvoicePayload),
                headers: { 'Content-Type': 'application/json' },
            });
            const createResponse = await createPurchaseInvoice(createReq);
            expect(createResponse.status).toBe(201);
            const createBody = await createResponse.json();
            const multiItemInvoiceId = createBody.data.id;

            // Sanity check inventory and WAC after creation
            const invA_afterCreate = await prisma.inventoryItem.findFirst({ where: { productId: productA.id, shopId: createdShopId } });
            expect(invA_afterCreate?.quantity).toBe(quantityA);
            expect(invA_afterCreate?.shopSpecificCost).toBe(priceA);
            const prodA_afterCreate = await prisma.product.findUnique({ where: { id: productA.id } });
            expect(prodA_afterCreate?.weightedAverageCost).toBe(priceA);

            const invB_afterCreate = await prisma.inventoryItem.findFirst({ where: { productId: productB.id, shopId: createdShopId } });
            expect(invB_afterCreate?.quantity).toBe(quantityB);
            expect(invB_afterCreate?.shopSpecificCost).toBe(priceB);
            const prodB_afterCreate = await prisma.product.findUnique({ where: { id: productB.id } });
            expect(prodB_afterCreate?.weightedAverageCost).toBe(priceB);

            // 2. Call DELETE endpoint
            const deleteReq = new NextRequest(`http://localhost/api/purchases/${multiItemInvoiceId}`, {
                method: 'DELETE',
            });
            const deleteResponse = await deletePurchaseInvoice(deleteReq, { params: { id: multiItemInvoiceId } });
            expect(deleteResponse.status).toBe(200);

            // 3. Verify invoice and items are deleted
            const dbInvoice = await prisma.purchaseInvoice.findUnique({ where: { id: multiItemInvoiceId } });
            expect(dbInvoice).toBeNull();
            const dbInvoiceItems = await prisma.purchaseInvoiceItem.findMany({ where: { purchaseInvoiceId: multiItemInvoiceId } });
            expect(dbInvoiceItems.length).toBe(0);

            // 4. Verify stock and WAC for Product A are reversed
            const invA_afterDelete = await prisma.inventoryItem.findFirst({ where: { productId: productA.id, shopId: createdShopId } });
            expect(invA_afterDelete?.quantity).toBe(0);
            expect(invA_afterDelete?.shopSpecificCost).toBeCloseTo(0);
            const prodA_afterDelete = await prisma.product.findUnique({ where: { id: productA.id } });
            expect(prodA_afterDelete?.weightedAverageCost).toBeCloseTo(0);

            // 5. Verify stock and WAC for Product B are reversed
            const invB_afterDelete = await prisma.inventoryItem.findFirst({ where: { productId: productB.id, shopId: createdShopId } });
            expect(invB_afterDelete?.quantity).toBe(0);
            expect(invB_afterDelete?.shopSpecificCost).toBeCloseTo(0);
            const prodB_afterDelete = await prisma.product.findUnique({ where: { id: productB.id } });
            expect(prodB_afterDelete?.weightedAverageCost).toBeCloseTo(0);

            // Clean up products and their inventory items created for this test
            await prisma.inventoryItem.deleteMany({ where: { productId: { in: [productA.id, productB.id] } } });
            await prisma.product.deleteMany({ where: { id: { in: [productA.id, productB.id] } } });
        }, 15000); // Timeout for safety
    });

}); 