const { chromium } = require('playwright');

(async () => {
  let browser;
  try {
    console.log('Launching browser...');
    browser = await chromium.launch(); // You can also try 'firefox' or 'webkit'
    const context = await browser.newContext();
    const page = await context.newPage();

    const appUrl = 'http://localhost:3000'; // Your application's URL
    console.log(`Navigating to ${appUrl}...`);

    // Start HAR recording
    await context.tracing.start({
        name: 'homepage-trace',
        screenshots: true,
        snapshots: true,
        sources: true
    });
    await page.goto(appUrl, { waitUntil: 'networkidle' }); // waits until network is idle
    console.log('Page loaded.');

    // Get performance metrics from the browser's Performance API
    const performanceMetrics = await page.evaluate(() => {
      const timing = window.performance.timing;
      return {
        domContentLoadedEventEnd: timing.domContentLoadedEventEnd - timing.navigationStart,
        loadEventEnd: timing.loadEventEnd - timing.navigationStart,
        // You can add more metrics from performance.timing or performance.getEntriesByType('navigation')
      };
    });

    console.log('\nPerformance Metrics (in milliseconds):');
    console.log(`  DOMContentLoaded: ${performanceMetrics.domContentLoadedEventEnd} ms`);
    console.log(`  Page Load Time (load event): ${performanceMetrics.loadEventEnd} ms`);

    // Stop HAR recording and save to a file
    const harPath = 'homepage-load.har';
    await context.tracing.stop({ path: harPath });
    console.log(`\nNetwork trace (HAR file) saved to: ${harPath}`);
    console.log('You can analyze this file with browser dev tools or online HAR viewers.');

  } catch (error) {
    console.error('Error during Playwright test:', error);
  } finally {
    if (browser) {
      await browser.close();
      console.log('Browser closed.');
    }
  }
})(); 