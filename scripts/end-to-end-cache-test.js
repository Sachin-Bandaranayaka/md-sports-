#!/usr/bin/env node

/**
 * End-to-End Cache Test for Purchase Invoice Editing
 * This simulates the exact user workflow described in the issue
 */

const { default: fetch } = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

// Helper to add delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function endToEndCacheTest() {
    console.log('🚀 Starting End-to-End Purchase Invoice Cache Test');
    console.log('=' .repeat(60));
    
    try {
        // Step 1: Get a purchase invoice to test with
        console.log('📋 Step 1: Finding a purchase invoice to test...');
        
        const listResponse = await fetch(`${BASE_URL}/api/purchases`);
        if (!listResponse.ok) {
            console.log(`❌ Failed to fetch purchases: ${listResponse.status}`);
            return;
        }
        
        const listData = await listResponse.json();
        const invoices = listData.data || listData || [];
        
        if (!invoices.length) {
            console.log('❌ No purchase invoices found. Please create one first.');
            return;
        }
        
        const testInvoice = invoices[0];
        console.log(`✅ Found invoice ID ${testInvoice.id} with ${testInvoice.items?.length || 'unknown'} items`);
        
        // Step 2: Fetch the original invoice data (simulating page load)
        console.log('\n📖 Step 2: Fetching original invoice data...');
        
        const originalResponse = await fetch(`${BASE_URL}/api/purchases/${testInvoice.id}`);
        if (!originalResponse.ok) {
            console.log(`❌ Failed to fetch invoice: ${originalResponse.status}`);
            return;
        }
        
        const originalData = await originalResponse.json();
        const originalETag = originalResponse.headers.get('etag');
        
        console.log(`✅ Original invoice fetched successfully`);
        console.log(`📊 Original total: ${originalData.total}`);
        console.log(`🏷️  Original ETag: ${originalETag}`);
        
        if (originalData.items && originalData.items.length > 0) {
            const firstItem = originalData.items[0];
            console.log(`📦 First item: ${firstItem.product?.name || 'Unknown'} - Qty: ${firstItem.quantity}`);
        }
        
        // Step 3: Simulate an edit (modify the invoice data)
        console.log('\n📝 Step 3: Simulating invoice edit...');
        
        const editedData = { ...originalData };
        
        // Modify the first item's quantity (simulating user edit)
        if (editedData.items && editedData.items.length > 0) {
            const oldQuantity = editedData.items[0].quantity;
            const newQuantity = oldQuantity + 5; // Add 5 to the quantity
            editedData.items[0].quantity = newQuantity;
            
            console.log(`📈 Changing quantity from ${oldQuantity} to ${newQuantity}`);
            
            // Prepare the submission data as the form would
            const submissionData = {
                ...editedData,
                items: editedData.items.map(item => ({
                    productId: item.productId,
                    quantity: Number(item.quantity),
                    price: Number(item.price),
                    id: item.id || undefined
                })),
                totalAmount: editedData.total || 0,
                paidAmount: editedData.paidAmount || 0,
            };
            
            // Step 4: Submit the update (simulating form submission)
            console.log('\n💾 Step 4: Submitting invoice update...');
            
            const updateResponse = await fetch(`${BASE_URL}/api/purchases/${testInvoice.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(submissionData)
            });
            
            if (!updateResponse.ok) {
                const errorData = await updateResponse.json();
                console.log(`❌ Update failed: ${updateResponse.status}`);
                console.log(`❌ Error: ${errorData.error || errorData.message || 'Unknown error'}`);
                return;
            }
            
            console.log('✅ Invoice updated successfully!');
            
            // Step 5: Immediate cache invalidation (simulating form's revalidation call)
            console.log('\n🔄 Step 5: Triggering cache invalidation...');
            
            try {
                const revalidateResponse = await fetch(`${BASE_URL}/api/revalidate`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        tags: ['purchase-invoices', `purchase-${testInvoice.id}`],
                        paths: [`/purchases/${testInvoice.id}`, `/purchases/${testInvoice.id}/edit`, '/purchases']
                    }),
                });
                
                if (revalidateResponse.ok) {
                    console.log('✅ Cache invalidation triggered successfully');
                } else {
                    console.log('⚠️  Cache invalidation failed (might be auth-related, but update should work)');
                }
            } catch (revalidateError) {
                console.log('⚠️  Cache invalidation error (might be auth-related, but update should work)');
            }
            
            // Step 6: Fetch the invoice again immediately (simulating returning to edit page)
            console.log('\n📖 Step 6: Fetching invoice immediately after update...');
            
            // Add timestamp for cache busting (as implemented in the fix)
            const timestamp = Date.now();
            const immediateResponse = await fetch(
                `${BASE_URL}/api/purchases/${testInvoice.id}?t=${timestamp}`,
                {
                    headers: {
                        'Cache-Control': 'no-cache, no-store, must-revalidate',
                        'Pragma': 'no-cache',
                        'Expires': '0'
                    }
                }
            );
            
            if (!immediateResponse.ok) {
                console.log(`❌ Failed to fetch updated invoice: ${immediateResponse.status}`);
                return;
            }
            
            const immediateData = await immediateResponse.json();
            const immediateETag = immediateResponse.headers.get('etag');
            
            console.log(`✅ Updated invoice fetched successfully`);
            console.log(`📊 Updated total: ${immediateData.total}`);
            console.log(`🏷️  Updated ETag: ${immediateETag}`);
            
            if (immediateData.items && immediateData.items.length > 0) {
                const updatedFirstItem = immediateData.items[0];
                console.log(`📦 Updated first item: ${updatedFirstItem.product?.name || 'Unknown'} - Qty: ${updatedFirstItem.quantity}`);
                
                // Step 7: Verify the change is visible
                console.log('\n🧪 Step 7: Verifying changes are immediately visible...');
                
                if (updatedFirstItem.quantity === newQuantity) {
                    console.log('🎉 SUCCESS! Updated quantity is immediately visible');
                    console.log(`✅ Quantity correctly shows ${updatedFirstItem.quantity} (expected ${newQuantity})`);
                } else {
                    console.log('❌ FAILURE! Updated quantity is not visible');
                    console.log(`❌ Quantity shows ${updatedFirstItem.quantity} but expected ${newQuantity}`);
                    console.log('❌ This indicates caching issues persist');
                }
                
                // Step 8: Check ETag differences
                console.log('\n🏷️  Step 8: Verifying ETag changes...');
                
                if (originalETag !== immediateETag) {
                    console.log('✅ ETags are different, indicating fresh data');
                    console.log(`   Original: ${originalETag}`);
                    console.log(`   Updated:  ${immediateETag}`);
                } else {
                    console.log('⚠️  ETags are the same, might indicate caching issues');
                    console.log(`   Both: ${originalETag}`);
                }
                
            } else {
                console.log('❌ No items found in updated invoice');
            }
            
        } else {
            console.log('❌ No items found in original invoice to modify');
        }
        
    } catch (error) {
        console.log(`❌ Test failed with error: ${error.message}`);
        console.error(error);
    }
    
    console.log('\n' + '=' .repeat(60));
    console.log('🏁 End-to-End Cache Test Completed!');
    console.log('\n📝 Summary:');
    console.log('   This test simulates the exact workflow you described:');
    console.log('   1. Load a purchase invoice');
    console.log('   2. Edit it (change quantity)');
    console.log('   3. Save the changes');
    console.log('   4. Return to the edit page immediately');
    console.log('   5. Verify changes are visible without waiting');
    console.log('\n💡 Next: Test manually in the browser to confirm UI behavior');
}

// Run the test
endToEndCacheTest().catch(console.error); 