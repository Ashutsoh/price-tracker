import React, { useState, useEffect } from 'react';
import { Bell, TrendingDown, Search, Plus, Trash2, ExternalLink, RefreshCw, AlertCircle, Zap } from 'lucide-react';

// Configure your backend API URL
const API_URL = process.env.REACT_APP_API_URL || 'https://price-tracker-6z15.onrender.com';

export default function PriceTrackerWithAPI() {
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [alerts, setAlerts] = useState([]);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingPrices, setCheckingPrices] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: 'phones',
    amazonPrice: '',
    amazonUrl: '',
    flipkartPrice: '',
    flipkartUrl: ''
  });

  const categories = [
    { id: 'all', label: 'All Products', emoji: '📦' },
    { id: 'phones', label: 'Phones', emoji: '📱' },
    { id: 'laptops', label: 'Laptops', emoji: '💻' },
    { id: 'earbuds', label: 'Wireless Earbuds', emoji: '🎧' },
    { id: 'smartwatches', label: 'Smartwatches', emoji: '⌚' }
  ];

  // Load initial data
  useEffect(() => {
    loadProducts();
    loadAlerts();
  }, []);

  const loadProducts = async () => {
    try {
      const response = await fetch(`${API_URL}/products`);
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const loadAlerts = async () => {
    try {
      const response = await fetch(`${API_URL}/alerts`);
      const data = await response.json();
      setAlerts(data);
    } catch (error) {
      console.error('Error loading alerts:', error);
    }
  };

  const addProduct = async () => {
    if (!newProduct.name || !newProduct.amazonPrice || !newProduct.flipkartPrice) {
      alert('Please fill in all required fields');
      return;
    }

    if (!newProduct.amazonUrl && !newProduct.flipkartUrl) {
      alert('Please provide at least one product URL for price tracking');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newProduct,
          amazonPrice: parseFloat(newProduct.amazonPrice),
          flipkartPrice: parseFloat(newProduct.flipkartPrice)
        })
      });

      if (response.ok) {
        await loadProducts();
        setNewProduct({
          name: '',
          category: 'phones',
          amazonPrice: '',
          amazonUrl: '',
          flipkartPrice: '',
          flipkartUrl: ''
        });
        setShowAddProduct(false);
      }
    } catch (error) {
      console.error('Error adding product:', error);
      alert('Failed to add product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (productId) => {
    try {
      await fetch(`${API_URL}/products/${productId}`, {
        method: 'DELETE'
      });
      await loadProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const clearAlert = async (alertId) => {
    try {
      await fetch(`${API_URL}/alerts/${alertId}`, {
        method: 'DELETE'
      });
      await loadAlerts();
    } catch (error) {
      console.error('Error clearing alert:', error);
    }
  };

  const checkPriceForProduct = async (productId) => {
    setCheckingPrices(true);
    try {
      const response = await fetch(`${API_URL}/products/${productId}/check-price`, {
        method: 'POST'
      });
      const data = await response.json();
      
      if (data.alerts && data.alerts.length > 0) {
        alert(`Found ${data.alerts.length} price drop(s) for this product!`);
      }
      
      await loadProducts();
      await loadAlerts();
    } catch (error) {
      console.error('Error checking price:', error);
      alert('Failed to check prices. Please try again.');
    } finally {
      setCheckingPrices(false);
    }
  };

  const checkAllPrices = async () => {
    setCheckingPrices(true);
    try {
      const response = await fetch(`${API_URL}/check-all-prices`, {
        method: 'POST'
      });
      const data = await response.json();
      
      alert(`Checked ${data.checked} products. Found ${data.alerts.length} price drop(s)!`);
      
      await loadProducts();
      await loadAlerts();
    } catch (error) {
      console.error('Error checking prices:', error);
      alert('Failed to check prices. Please try again.');
    } finally {
      setCheckingPrices(false);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getBestPrice = (product) => {
    return Math.min(product.amazonPrice, product.flipkartPrice);
  };

  const getCheaperPlatform = (product) => {
    return product.amazonPrice < product.flipkartPrice ? 'amazon' : 'flipkart';
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0e27 0%, #1a1f3a 50%, #2d1b4e 100%)',
      color: '#ffffff',
      fontFamily: '"Space Mono", "Courier New", monospace'
    }}>
      {/* Header */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.02)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '1.5rem 2rem',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{
              margin: 0,
              fontSize: '2rem',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #00d4ff 0%, #7b2ff7 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.02em'
            }}>
              PRICE.TRACKER
            </h1>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.5)' }}>
              Auto-tracking with API • Updates every 6 hours
            </p>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <button
              onClick={checkAllPrices}
              disabled={checkingPrices || products.length === 0}
              style={{
                background: 'rgba(0, 255, 136, 0.1)',
                border: '1px solid rgba(0, 255, 136, 0.3)',
                color: '#00ff88',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                cursor: products.length === 0 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                fontFamily: 'inherit',
                opacity: checkingPrices || products.length === 0 ? 0.5 : 1
              }}
            >
              <Zap size={18} /> {checkingPrices ? 'Checking...' : 'Check All Prices'}
            </button>
            <div style={{ position: 'relative' }}>
              <Bell size={24} style={{ color: alerts.length > 0 ? '#ff3366' : 'rgba(255, 255, 255, 0.5)' }} />
              {alerts.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: -5,
                  right: -5,
                  background: '#ff3366',
                  borderRadius: '50%',
                  width: '20px',
                  height: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 700
                }}>
                  {alerts.length}
                </div>
              )}
            </div>
            <button
              onClick={() => setShowAddProduct(true)}
              style={{
                background: 'linear-gradient(135deg, #00d4ff 0%, #7b2ff7 100%)',
                color: '#ffffff',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                fontFamily: 'inherit',
                transition: 'transform 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <Plus size={18} /> Add Product
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
        {/* Alerts Section */}
        {alerts.length > 0 && (
          <div style={{
            background: 'rgba(255, 51, 102, 0.1)',
            border: '1px solid rgba(255, 51, 102, 0.3)',
            borderRadius: '12px',
            padding: '1.5rem',
            marginBottom: '2rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <AlertCircle size={24} style={{ color: '#ff3366' }} />
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>Price Drop Alerts (20%+ off)</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {alerts.map(alert => (
                <div key={alert.id} style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  padding: '1rem',
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{alert.productName}</div>
                    <div style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                      {alert.platform === 'amazon' ? '📦 Amazon' : '🛒 Flipkart'} • 
                      ₹{alert.oldPrice.toFixed(0)} → ₹{alert.newPrice.toFixed(0)} 
                      <span style={{ color: '#00ff88', fontWeight: 700, marginLeft: '0.5rem' }}>
                        ({alert.percentChange}%)
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => clearAlert(alert.id)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: 'none',
                      padding: '0.5rem',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      color: 'rgba(255, 255, 255, 0.7)'
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
            <Search size={20} style={{
              position: 'absolute',
              left: '1rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'rgba(255, 255, 255, 0.3)'
            }} />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '1rem 1rem 1rem 3rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                color: '#ffffff',
                fontSize: '1rem',
                fontFamily: 'inherit',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: selectedCategory === cat.id 
                    ? 'linear-gradient(135deg, #00d4ff 0%, #7b2ff7 100%)'
                    : 'rgba(255, 255, 255, 0.05)',
                  border: selectedCategory === cat.id 
                    ? 'none'
                    : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: '#ffffff',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontFamily: 'inherit',
                  fontWeight: selectedCategory === cat.id ? 600 : 400,
                  transition: 'all 0.2s'
                }}
              >
                {cat.emoji} {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '4rem 2rem',
            background: 'rgba(255, 255, 255, 0.02)',
            borderRadius: '12px',
            border: '1px dashed rgba(255, 255, 255, 0.1)'
          }}>
            <p style={{ fontSize: '1.25rem', color: 'rgba(255, 255, 255, 0.5)', margin: 0 }}>
              {searchQuery ? 'No products found' : 'No products added yet'}
            </p>
            <p style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.3)', marginTop: '0.5rem' }}>
              Click "Add Product" to start automatic price tracking
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '1.5rem'
          }}>
            {filteredProducts.map(product => {
              const bestPrice = getBestPrice(product);
              const cheaperPlatform = getCheaperPlatform(product);
              const priceDiff = Math.abs(product.amazonPrice - product.flipkartPrice);
              
              return (
                <div key={product.id} style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  transition: 'all 0.3s',
                  position: 'relative'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: '1rem',
                    right: '1rem',
                    background: 'rgba(0, 212, 255, 0.2)',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: '#00d4ff'
                  }}>
                    {categories.find(c => c.id === product.category)?.emoji} {product.category.toUpperCase()}
                  </div>

                  <div style={{ marginBottom: '1rem', paddingRight: '80px' }}>
                    <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.125rem', fontWeight: 700 }}>
                      {product.name}
                    </h3>
                  </div>

                  <div style={{
                    background: 'linear-gradient(135deg, rgba(0, 255, 136, 0.1) 0%, rgba(0, 212, 255, 0.1) 100%)',
                    border: '1px solid rgba(0, 255, 136, 0.3)',
                    borderRadius: '8px',
                    padding: '1rem',
                    marginBottom: '1rem'
                  }}>
                    <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '0.25rem' }}>
                      BEST PRICE
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: '#00ff88' }}>
                      ₹{bestPrice.toFixed(0)}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.7)', marginTop: '0.25rem' }}>
                      on {cheaperPlatform === 'amazon' ? '📦 Amazon' : '🛒 Flipkart'}
                      {priceDiff > 0 && (
                        <span style={{ color: '#00ff88', marginLeft: '0.5rem' }}>
                          (₹{priceDiff.toFixed(0)} cheaper)
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.75rem',
                      background: product.amazonPrice === bestPrice 
                        ? 'rgba(0, 255, 136, 0.05)' 
                        : 'rgba(255, 255, 255, 0.02)',
                      borderRadius: '6px',
                      border: product.amazonPrice === bestPrice 
                        ? '1px solid rgba(0, 255, 136, 0.2)' 
                        : '1px solid rgba(255, 255, 255, 0.05)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1.25rem' }}>📦</span>
                        <div>
                          <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.5)' }}>Amazon</div>
                          <div style={{ fontSize: '1.125rem', fontWeight: 600 }}>₹{product.amazonPrice.toFixed(0)}</div>
                        </div>
                      </div>
                      {product.amazonUrl && (
                        <a href={product.amazonUrl} target="_blank" rel="noopener noreferrer" style={{
                          color: '#00d4ff',
                          display: 'flex',
                          alignItems: 'center'
                        }}>
                          <ExternalLink size={16} />
                        </a>
                      )}
                    </div>

                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.75rem',
                      background: product.flipkartPrice === bestPrice 
                        ? 'rgba(0, 255, 136, 0.05)' 
                        : 'rgba(255, 255, 255, 0.02)',
                      borderRadius: '6px',
                      border: product.flipkartPrice === bestPrice 
                        ? '1px solid rgba(0, 255, 136, 0.2)' 
                        : '1px solid rgba(255, 255, 255, 0.05)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1.25rem' }}>🛒</span>
                        <div>
                          <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.5)' }}>Flipkart</div>
                          <div style={{ fontSize: '1.125rem', fontWeight: 600 }}>₹{product.flipkartPrice.toFixed(0)}</div>
                        </div>
                      </div>
                      {product.flipkartUrl && (
                        <a href={product.flipkartUrl} target="_blank" rel="noopener noreferrer" style={{
                          color: '#00d4ff',
                          display: 'flex',
                          alignItems: 'center'
                        }}>
                          <ExternalLink size={16} />
                        </a>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => checkPriceForProduct(product.id)}
                      disabled={checkingPrices}
                      style={{
                        flex: 1,
                        padding: '0.5rem',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '6px',
                        color: '#ffffff',
                        cursor: checkingPrices ? 'not-allowed' : 'pointer',
                        fontSize: '0.75rem',
                        fontFamily: 'inherit',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.25rem',
                        opacity: checkingPrices ? 0.5 : 1
                      }}
                    >
                      <RefreshCw size={14} /> Check Price
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Delete this product?')) deleteProduct(product.id);
                      }}
                      style={{
                        padding: '0.5rem 0.75rem',
                        background: 'rgba(255, 51, 102, 0.1)',
                        border: '1px solid rgba(255, 51, 102, 0.3)',
                        borderRadius: '6px',
                        color: '#ff3366',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        fontFamily: 'inherit'
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Product Modal */}
      {showAddProduct && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '2rem'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #1a1f3a 0%, #2d1b4e 100%)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            padding: '2rem',
            maxWidth: '500px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.5rem', fontWeight: 700 }}>Add New Product</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                  Product Name *
                </label>
                <input
                  type="text"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '1rem',
                    fontFamily: 'inherit'
                  }}
                  placeholder="e.g., iPhone 15 Pro"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                  Category *
                </label>
                <select
                  value={newProduct.category}
                  onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '1rem',
                    fontFamily: 'inherit'
                  }}
                >
                  <option value="phones">📱 Phones</option>
                  <option value="laptops">💻 Laptops</option>
                  <option value="earbuds">🎧 Wireless Earbuds</option>
                  <option value="smartwatches">⌚ Smartwatches</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                    Amazon Price (₹) *
                  </label>
                  <input
                    type="number"
                    value={newProduct.amazonPrice}
                    onChange={(e) => setNewProduct({...newProduct, amazonPrice: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '1rem',
                      fontFamily: 'inherit'
                    }}
                    placeholder="79999"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                    Flipkart Price (₹) *
                  </label>
                  <input
                    type="number"
                    value={newProduct.flipkartPrice}
                    onChange={(e) => setNewProduct({...newProduct, flipkartPrice: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '1rem',
                      fontFamily: 'inherit'
                    }}
                    placeholder="81999"
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                  Amazon URL * (for auto-tracking)
                </label>
                <input
                  type="url"
                  value={newProduct.amazonUrl}
                  onChange={(e) => setNewProduct({...newProduct, amazonUrl: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '1rem',
                    fontFamily: 'inherit'
                  }}
                  placeholder="https://amazon.in/..."
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                  Flipkart URL * (for auto-tracking)
                </label>
                <input
                  type="url"
                  value={newProduct.flipkartUrl}
                  onChange={(e) => setNewProduct({...newProduct, flipkartUrl: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '1rem',
                    fontFamily: 'inherit'
                  }}
                  placeholder="https://flipkart.com/..."
                />
              </div>

              <div style={{
                background: 'rgba(0, 212, 255, 0.1)',
                border: '1px solid rgba(0, 212, 255, 0.3)',
                borderRadius: '8px',
                padding: '0.75rem',
                fontSize: '0.875rem',
                color: 'rgba(255, 255, 255, 0.7)'
              }}>
                💡 Add product URLs to enable automatic price tracking every 6 hours
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button
                onClick={() => setShowAddProduct(false)}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: '#ffffff',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '1rem',
                  fontFamily: 'inherit',
                  fontWeight: 600,
                  opacity: loading ? 0.5 : 1
                }}
              >
                Cancel
              </button>
              <button
                onClick={addProduct}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: loading ? 'rgba(0, 212, 255, 0.3)' : 'linear-gradient(135deg, #00d4ff 0%, #7b2ff7 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#ffffff',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '1rem',
                  fontFamily: 'inherit',
                  fontWeight: 600
                }}
              >
                {loading ? 'Adding...' : 'Add Product'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
