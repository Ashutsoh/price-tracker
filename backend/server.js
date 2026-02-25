// server.js - Backend API for Price Tracking
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');
const cron = require('node-cron');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
// Root route (fix for Cannot GET /)
app.get("/", (req, res) => {
  res.send("Price Tracker Backend is Running 🚀");
});

// In-memory storage (replace with database in production)
let products = [];
let alerts = [];
let priceHistory = {};

// Helper function to scrape Amazon price
async function scrapeAmazonPrice(url) {
  try {
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      }
    });

    const $ = cheerio.load(data);
    
    // Try multiple selectors for Amazon pricing
    let price = null;
    const selectors = [
      '.a-price-whole',
      '#priceblock_ourprice',
      '#priceblock_dealprice',
      '.a-price .a-offscreen',
      '#price_inside_buybox'
    ];

    for (const selector of selectors) {
      const priceText = $(selector).first().text().trim();
      if (priceText) {
        price = parseFloat(priceText.replace(/[^0-9.]/g, ''));
        if (price && price > 0) break;
      }
    }

    return price;
  } catch (error) {
    console.error('Error scraping Amazon:', error.message);
    return null;
  }
}

// Helper function to scrape Flipkart price
async function scrapeFlipkartPrice(url) {
  try {
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      }
    });

    const $ = cheerio.load(data);
    
    // Try multiple selectors for Flipkart pricing
    let price = null;
    const selectors = [
      '._30jeq3._16Jk6d',
      '._30jeq3',
      '.CEmiEU div',
      '._1vC4OE'
    ];

    for (const selector of selectors) {
      const priceText = $(selector).first().text().trim();
      if (priceText) {
        price = parseFloat(priceText.replace(/[^0-9.]/g, ''));
        if (price && price > 0) break;
      }
    }

    return price;
  } catch (error) {
    console.error('Error scraping Flipkart:', error.message);
    return null;
  }
}

// Check prices and create alerts
async function checkPriceDrops(product) {
  const alerts = [];
  
  // Check Amazon
  if (product.amazonUrl) {
    const newPrice = await scrapeAmazonPrice(product.amazonUrl);
    if (newPrice && newPrice > 0) {
      const oldPrice = product.amazonPrice;
      const percentChange = ((newPrice - oldPrice) / oldPrice) * 100;
      
      if (percentChange <= -20) {
        alerts.push({
          id: Date.now().toString() + '-amazon',
          productId: product.id,
          productName: product.name,
          platform: 'amazon',
          oldPrice,
          newPrice,
          percentChange: percentChange.toFixed(1),
          date: new Date().toISOString()
        });
      }
      
      // Update product price
      product.amazonPrice = newPrice;
      
      // Add to price history
      if (!priceHistory[product.id]) {
        priceHistory[product.id] = [];
      }
      priceHistory[product.id].push({
        date: new Date().toISOString(),
        amazonPrice: newPrice,
        flipkartPrice: product.flipkartPrice
      });
    }
  }
  
  // Check Flipkart
  if (product.flipkartUrl) {
    const newPrice = await scrapeFlipkartPrice(product.flipkartUrl);
    if (newPrice && newPrice > 0) {
      const oldPrice = product.flipkartPrice;
      const percentChange = ((newPrice - oldPrice) / oldPrice) * 100;
      
      if (percentChange <= -20) {
        alerts.push({
          id: Date.now().toString() + '-flipkart',
          productId: product.id,
          productName: product.name,
          platform: 'flipkart',
          oldPrice,
          newPrice,
          percentChange: percentChange.toFixed(1),
          date: new Date().toISOString()
        });
      }
      
      // Update product price
      product.flipkartPrice = newPrice;
      
      // Add to price history
      if (!priceHistory[product.id]) {
        priceHistory[product.id] = [];
      }
      const lastHistory = priceHistory[product.id][priceHistory[product.id].length - 1];
      if (lastHistory) {
        lastHistory.flipkartPrice = newPrice;
      } else {
        priceHistory[product.id].push({
          date: new Date().toISOString(),
          amazonPrice: product.amazonPrice,
          flipkartPrice: newPrice
        });
      }
    }
  }
  
  return alerts;
}

// Cron job to check prices every 6 hours
cron.schedule('0 */6 * * *', async () => {
  console.log('Running scheduled price check...');
  
  for (const product of products) {
    const newAlerts = await checkPriceDrops(product);
    alerts.push(...newAlerts);
  }
  
  console.log(`Price check completed. Found ${alerts.length} new alerts.`);
});

// API Routes

// Get all products
app.get('/api/products', (req, res) => {
  res.json(products);
});

// Add a new product
app.post('/api/products', (req, res) => {
  const product = {
    id: Date.now().toString(),
    ...req.body,
    createdAt: new Date().toISOString()
  };
  
  products.push(product);
  priceHistory[product.id] = [{
    date: new Date().toISOString(),
    amazonPrice: product.amazonPrice,
    flipkartPrice: product.flipkartPrice
  }];
  
  res.json(product);
});

// Update a product
app.put('/api/products/:id', (req, res) => {
  const productIndex = products.findIndex(p => p.id === req.params.id);
  
  if (productIndex === -1) {
    return res.status(404).json({ error: 'Product not found' });
  }
  
  products[productIndex] = {
    ...products[productIndex],
    ...req.body,
    updatedAt: new Date().toISOString()
  };
  
  res.json(products[productIndex]);
});

// Delete a product
app.delete('/api/products/:id', (req, res) => {
  products = products.filter(p => p.id !== req.params.id);
  delete priceHistory[req.params.id];
  res.json({ success: true });
});

// Get alerts
app.get('/api/alerts', (req, res) => {
  res.json(alerts);
});

// Clear an alert
app.delete('/api/alerts/:id', (req, res) => {
  alerts = alerts.filter(a => a.id !== req.params.id);
  res.json({ success: true });
});

// Get price history for a product
app.get('/api/products/:id/history', (req, res) => {
  const history = priceHistory[req.params.id] || [];
  res.json(history);
});

// Manual price check for a product
app.post('/api/products/:id/check-price', async (req, res) => {
  const product = products.find(p => p.id === req.params.id);
  
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  
  const newAlerts = await checkPriceDrops(product);
  alerts.push(...newAlerts);
  
  res.json({
    product,
    alerts: newAlerts
  });
});

// Manual price check for all products
app.post('/api/check-all-prices', async (req, res) => {
  const allNewAlerts = [];
  
  for (const product of products) {
    const newAlerts = await checkPriceDrops(product);
    allNewAlerts.push(...newAlerts);
  }
  
  alerts.push(...allNewAlerts);
  
  res.json({
    checked: products.length,
    alerts: allNewAlerts
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    productsCount: products.length,
    alertsCount: alerts.length
  });
});

app.listen(PORT, () => {
  console.log(`Price Tracker API running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;
