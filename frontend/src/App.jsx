import { useEffect, useMemo, useState } from 'react'
import './App.css'

const API_BASE_URL = 'http://localhost:5000'

function App() {
  const [products, setProducts] = useState([])
  const [allProducts, setAllProducts] = useState([])

  const [loadingProducts, setLoadingProducts] = useState(true)
  const [searchingProducts, setSearchingProducts] = useState(false)
  const [productsError, setProductsError] = useState('')

  const [searchTerm, setSearchTerm] = useState('')
  const [activeSearch, setActiveSearch] = useState('')
  const [radius, setRadius] = useState(5)

  const [activeSection, setActiveSection] = useState('home')
  const [language, setLanguage] = useState('English')

  const [showVoiceSearch, setShowVoiceSearch] = useState(false)
  const [showImageSearch, setShowImageSearch] = useState(false)
  const [showBarcodeSearch, setShowBarcodeSearch] = useState(false)

  const [selectedProduct, setSelectedProduct] = useState(null)
  const [showReservationModal, setShowReservationModal] = useState(false)
  const [reservationStatus, setReservationStatus] = useState(null)
  const [reservationSubmitting, setReservationSubmitting] = useState(false)
  const [reservationError, setReservationError] = useState('')

  const [assistantMessage, setAssistantMessage] = useState('')
  const [assistantResponse, setAssistantResponse] = useState('')
  const [assistantLoading, setAssistantLoading] = useState(false)

  const [shopkeeperMode, setShopkeeperMode] = useState(false)
  const [inventorySearch, setInventorySearch] = useState('')

  // --------------------------------------------------
  // LOAD ALL PRODUCTS FROM BACKEND
  // --------------------------------------------------

  const loadAllProducts = async () => {
    try {
      setLoadingProducts(true)
      setProductsError('')

      const response = await fetch(`${API_BASE_URL}/api/products`)

      if (!response.ok) {
        throw new Error('Failed to load products')
      }

      const data = await response.json()

      setAllProducts(data)

      // Initial display based on selected radius
      const nearbyProducts = data.filter(
        (product) => Number(product.distance) <= Number(radius)
      )

      setProducts(nearbyProducts)
    } catch (error) {
      console.error(error)
      setProductsError(
        'Unable to connect to the ShopSphere backend. Please make sure the backend server is running on port 5000.'
      )
    } finally {
      setLoadingProducts(false)
    }
  }

  // --------------------------------------------------
  // SEARCH PRODUCTS THROUGH BACKEND
  // --------------------------------------------------

  const fetchProducts = async (query = '', selectedRadius = radius) => {
    try {
      setSearchingProducts(true)
      setProductsError('')

      const url =
        `${API_BASE_URL}/api/products/search` +
        `?q=${encodeURIComponent(query)}` +
        `&radius=${encodeURIComponent(selectedRadius)}`

      const response = await fetch(url)

      if (!response.ok) {
        throw new Error('Product search failed')
      }

      const data = await response.json()

      setProducts(data)
    } catch (error) {
      console.error(error)
      setProductsError(
        'Could not fetch products from the backend. Please check whether the backend is running.'
      )
    } finally {
      setSearchingProducts(false)
    }
  }

  useEffect(() => {
    loadAllProducts()
  }, [])

  // --------------------------------------------------
  // SEARCH HANDLERS
  // --------------------------------------------------

  const handleSearch = async (event) => {
    event?.preventDefault()

    const query = searchTerm.trim()

    setActiveSearch(query)
    setActiveSection('compare')

    await fetchProducts(query, radius)
  }

  const handleQuickSearch = async (term) => {
    setSearchTerm(term)
    setActiveSearch(term)
    setActiveSection('compare')

    await fetchProducts(term, radius)
  }

  const handleRadiusChange = async (value) => {
    setRadius(value)

    await fetchProducts(activeSearch, value)
  }

  // --------------------------------------------------
  // NAVIGATION
  // --------------------------------------------------

  const handleSectionChange = async (section) => {
    setActiveSection(section)

    if (section === 'compare') {
      await fetchProducts(activeSearch, radius)
    }
  }

  // --------------------------------------------------
  // PRODUCT FILTER
  // --------------------------------------------------

  const filteredProducts = useMemo(() => {
    return products.filter(
      (product) => Number(product.distance) <= Number(radius)
    )
  }, [products, radius])

  const inventoryProducts = useMemo(() => {
    const query = inventorySearch.toLowerCase().trim()

    if (!query) {
      return allProducts
    }

    return allProducts.filter(
      (product) =>
        product.name.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query) ||
        product.shopName.toLowerCase().includes(query)
    )
  }, [allProducts, inventorySearch])

  // --------------------------------------------------
  // RESERVATION
  // --------------------------------------------------

  const openReservationModal = (product) => {
    setSelectedProduct(product)
    setReservationStatus(null)
    setReservationError('')
    setShowReservationModal(true)
  }

  const closeReservationModal = () => {
    if (reservationSubmitting) return

    setShowReservationModal(false)
    setSelectedProduct(null)
    setReservationError('')
  }

  const confirmReservation = async () => {
    if (!selectedProduct) return

    try {
      setReservationSubmitting(true)
      setReservationError('')

      const response = await fetch(`${API_BASE_URL}/api/reservations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: selectedProduct.id,
          customerName: 'Demo Customer',
          customerPhone: '',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Reservation failed')
      }

      setReservationStatus(data.reservation)
      setShowReservationModal(false)
    } catch (error) {
      console.error(error)

      setReservationError(
        error.message || 'Unable to create reservation.'
      )
    } finally {
      setReservationSubmitting(false)
    }
  }

  // --------------------------------------------------
  // AI SHOPPING ASSISTANT
  // --------------------------------------------------

  const askAssistant = async () => {
    const message = assistantMessage.trim()

    if (!message) {
      setAssistantResponse('Please enter a shopping question.')
      return
    }

    try {
      setAssistantLoading(true)

      const lowerMessage = message.toLowerCase()

      const matchedProduct = allProducts.find((product) =>
        lowerMessage.includes(product.name.toLowerCase()) ||
        lowerMessage.includes(product.category.toLowerCase())
      )

      if (matchedProduct) {
        setAssistantResponse(
          `${matchedProduct.name} is available at ${matchedProduct.shopName}. ` +
          `Online price is ₹${matchedProduct.onlinePrice.toLocaleString()} and ` +
          `nearby shop price is ₹${matchedProduct.shopPrice.toLocaleString()}. ` +
          `The shop is ${matchedProduct.distance} km away and has ` +
          `${matchedProduct.stock} units available.`
        )
      } else {
        const cheaperOption = [...allProducts].sort(
          (a, b) => a.shopPrice - b.shopPrice
        )[0]

        if (cheaperOption) {
          setAssistantResponse(
            `I could not find an exact product match. ` +
            `One available option in the current demo inventory is ` +
            `${cheaperOption.name} at ${cheaperOption.shopName}, ` +
            `with a nearby shop price of ₹${cheaperOption.shopPrice.toLocaleString()}.`
          )
        } else {
          setAssistantResponse(
            'No products are currently available.'
          )
        }
      }
    } catch (error) {
      console.error(error)
      setAssistantResponse(
        'Sorry, I could not process your request.'
      )
    } finally {
      setAssistantLoading(false)
    }
  }

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <div className="app">

      {/* ================= HEADER ================= */}

      <header className="header">
        <div className="logo-section">
          <div className="logo-icon">S</div>

          <div>
            <h1>ShopSphere</h1>
            <p>Online + Offline Shopping</p>
          </div>
        </div>

        <nav className="nav">
          <button
            className={activeSection === 'home' ? 'nav-btn active' : 'nav-btn'}
            onClick={() => handleSectionChange('home')}
          >
            Home
          </button>

          <button
            className={
              activeSection === 'compare'
                ? 'nav-btn active'
                : 'nav-btn'
            }
            onClick={() => handleSectionChange('compare')}
          >
            Compare
          </button>

          <button
            className={
              activeSection === 'reservations'
                ? 'nav-btn active'
                : 'nav-btn'
            }
            onClick={() => handleSectionChange('reservations')}
          >
            Reservations
          </button>

          <button
            className={
              activeSection === 'assistant'
                ? 'nav-btn active'
                : 'nav-btn'
            }
            onClick={() => handleSectionChange('assistant')}
          >
            AI Assistant
          </button>

          <button
            className={
              activeSection === 'shopkeeper'
                ? 'nav-btn active'
                : 'nav-btn'
            }
            onClick={() => {
              setShopkeeperMode(true)
              setActiveSection('shopkeeper')
            }}
          >
            Shopkeeper
          </button>
        </nav>

        <select
          className="language-select"
          value={language}
          onChange={(event) => setLanguage(event.target.value)}
        >
          <option>English</option>
          <option>Telugu</option>
          <option>Tenglish</option>
        </select>
      </header>

      {/* ================= HOME ================= */}

      {activeSection === 'home' && (
        <main>

          <section className="hero-section">
            <div className="hero-content">

              <span className="hero-badge">
                Smart Shopping • Online + Offline
              </span>

              <h2>
                Find it online.
                <br />
                Find it nearby.
                <br />
                <span>Choose what works for you.</span>
              </h2>

              <p>
                ShopSphere helps you compare online prices,
                nearby shop prices, availability, distance and
                delivery options before you buy.
              </p>

              <form
                className="search-container"
                onSubmit={handleSearch}
              >
                <span className="search-icon">⌕</span>

                <input
                  type="text"
                  placeholder="Search for a product..."
                  value={searchTerm}
                  onChange={(event) =>
                    setSearchTerm(event.target.value)
                  }
                />

                <button
                  type="button"
                  className="search-tool"
                  onClick={() => setShowVoiceSearch(true)}
                  title="Voice Search"
                >
                  🎙️
                </button>

                <button
                  type="button"
                  className="search-tool"
                  onClick={() => setShowImageSearch(true)}
                  title="Image Search"
                >
                  📷
                </button>

                <button
                  type="button"
                  className="search-tool"
                  onClick={() => setShowBarcodeSearch(true)}
                  title="Barcode Search"
                >
                  ▣
                </button>

                <button
                  type="submit"
                  className="search-button"
                >
                  Search
                </button>
              </form>

              <div className="quick-searches">
                <span>Try:</span>

                <button
                  onClick={() => handleQuickSearch('Laptop')}
                >
                  Laptop
                </button>

                <button
                  onClick={() => handleQuickSearch('Mobile')}
                >
                  Mobile
                </button>

                <button
                  onClick={() => handleQuickSearch('Headphones')}
                >
                  Headphones
                </button>

                <button
                  onClick={() => handleQuickSearch('Mouse')}
                >
                  Mouse
                </button>
              </div>

            </div>
          </section>

          <section className="how-section">
            <div className="section-heading">
              <span>HOW IT WORKS</span>
              <h3>One search. Two ways to buy.</h3>
              <p>
                ShopSphere gives you the information you need
                to decide between online shopping and nearby
                physical stores.
              </p>
            </div>

            <div className="steps-grid">

              <div className="step-card">
                <div className="step-number">01</div>
                <div className="step-icon">🔎</div>
                <h4>Search</h4>
                <p>
                  Search by text, voice, image or barcode.
                </p>
              </div>

              <div className="step-card">
                <div className="step-number">02</div>
                <div className="step-icon">⚖️</div>
                <h4>Compare</h4>
                <p>
                  Compare online and nearby shop options.
                </p>
              </div>

              <div className="step-card">
                <div className="step-number">03</div>
                <div className="step-icon">🧭</div>
                <h4>Decide</h4>
                <p>
                  Choose based on price, distance and availability.
                </p>
              </div>

              <div className="step-card">
                <div className="step-number">04</div>
                <div className="step-icon">🛍️</div>
                <h4>Buy or Reserve</h4>
                <p>
                  Buy online or reserve at a nearby physical shop.
                </p>
              </div>

            </div>
          </section>

          <section className="feature-section">
            <div className="feature-card">
              <div className="feature-icon">🌐</div>
              <h4>Online Shopping</h4>
              <p>
                Compare online prices, ratings, reviews and
                delivery information from available sources.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🏪</div>
              <h4>Nearby Shops</h4>
              <p>
                Find physical shops, availability, price,
                distance and reservation options.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🧠</div>
              <h4>AI Shopping Assistant</h4>
              <p>
                Get conversational shopping support and
                personalized recommendations.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">💾</div>
              <h4>Hindsight Memory</h4>
              <p>
                Remember useful user preferences and past
                shopping interactions.
              </p>
            </div>
          </section>

        </main>
      )}

      {/* ================= COMPARE ================= */}

      {activeSection === 'compare' && (
        <main className="page-container">

          <div className="page-header">
            <div>
              <span className="section-label">
                PRODUCT COMPARISON
              </span>

              <h2>
                {activeSearch
                  ? `Results for "${activeSearch}"`
                  : 'Compare Products'}
              </h2>

              <p>
                Compare online and nearby physical-shop options.
              </p>
            </div>

            <div className="radius-selector">
              <span>Search radius:</span>

              {[2, 5, 10].map((value) => (
                <button
                  key={value}
                  className={
                    radius === value
                      ? 'radius-btn active'
                      : 'radius-btn'
                  }
                  onClick={() => handleRadiusChange(value)}
                >
                  {value} km
                </button>
              ))}
            </div>
          </div>

          {productsError && (
            <div className="tool-message">
              {productsError}
            </div>
          )}

          {(loadingProducts || searchingProducts) && (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>
                {loadingProducts
                  ? 'Loading products from backend...'
                  : 'Searching products...'}
              </p>
            </div>
          )}

          {!loadingProducts &&
            !searchingProducts &&
            filteredProducts.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">🔍</div>
                <h3>No products found</h3>
                <p>
                  Try another search term or increase the radius.
                </p>
              </div>
            )}

          <div className="product-grid">

            {filteredProducts.map((product) => (
              <article
                className="product-card"
                key={product.id}
              >

                <div className="product-image">
                  <span>
                    {product.category === 'Laptop'
                      ? '💻'
                      : product.category === 'Mobile'
                        ? '📱'
                        : product.category === 'Audio'
                          ? '🎧'
                          : product.category === 'Monitor'
                            ? '🖥️'
                            : '🛒'}
                  </span>
                </div>

                <div className="product-content">

                  <div className="product-category">
                    {product.category}
                  </div>

                  <h3>{product.name}</h3>

                  <div className="rating">
                    ⭐ {product.rating}
                    <span>
                      ({product.reviews} reviews)
                    </span>
                  </div>

                  <div className="compare-box">

                    <div className="compare-row">
                      <span>Online</span>
                      <strong>
                        ₹{product.onlinePrice.toLocaleString()}
                      </strong>
                    </div>

                    <div className="compare-row nearby">
                      <span>Nearby Shop</span>
                      <strong>
                        ₹{product.shopPrice.toLocaleString()}
                      </strong>
                    </div>

                  </div>

                  <div className="shop-info">

                    <div>
                      <span className="shop-label">
                        Shop
                      </span>

                      <strong>
                        {product.shopName}
                      </strong>
                    </div>

                    <div className="shop-details">
                      <span>
                        📍 {product.distance} km
                      </span>

                      <span>
                        📦 {product.stock} available
                      </span>
                    </div>

                  </div>

                  <div className="product-actions">

                    <button
                      className="primary-btn"
                      onClick={() =>
                        openReservationModal(product)
                      }
                    >
                      Reserve at Shop
                    </button>

                    <button
                      className="secondary-btn"
                      onClick={() => {
                        setSelectedProduct(product)
                      }}
                    >
                      View Details
                    </button>

                  </div>

                </div>
              </article>
            ))}

          </div>

        </main>
      )}

      {/* ================= RESERVATIONS ================= */}

      {activeSection === 'reservations' && (
        <main className="page-container">

          <div className="page-header">
            <div>
              <span className="section-label">
                RESERVATIONS
              </span>

              <h2>Your Reservations</h2>

              <p>
                Track products you have requested from nearby shops.
              </p>
            </div>
          </div>

          {reservationStatus ? (
            <div className="reservation-status-card">

              <div className="success-icon">✓</div>

              <h3>
                Reservation Request Created
              </h3>

              <p>
                Your request for{' '}
                <strong>
                  {reservationStatus.productName}
                </strong>{' '}
                has been sent to{' '}
                <strong>
                  {reservationStatus.shopName}
                </strong>.
              </p>

              <div className="reservation-details">

                <div>
                  <span>Reservation ID</span>
                  <strong>
                    #{reservationStatus.id}
                  </strong>
                </div>

                <div>
                  <span>Price</span>
                  <strong>
                    ₹{reservationStatus.price.toLocaleString()}
                  </strong>
                </div>

                <div>
                  <span>Status</span>
                  <strong className="status-pending">
                    {reservationStatus.status}
                  </strong>
                </div>

              </div>

              <button
                className="primary-btn"
                onClick={() => setReservationStatus(null)}
              >
                Close
              </button>

            </div>
          ) : (
            <div className="empty-state">

              <div className="empty-icon">📋</div>

              <h3>No active reservations</h3>

              <p>
                Search for a product and reserve it from a
                nearby shop.
              </p>

              <button
                className="primary-btn"
                onClick={() =>
                  handleSectionChange('compare')
                }
              >
                Find Products
              </button>

            </div>
          )}

        </main>
      )}

      {/* ================= AI ASSISTANT ================= */}

      {activeSection === 'assistant' && (
        <main className="page-container">

          <div className="page-header">
            <div>
              <span className="section-label">
                AI SHOPPING ASSISTANT
              </span>

              <h2>
                Shop smarter with AI
              </h2>

              <p>
                Ask questions about products, prices and nearby
                availability.
              </p>
            </div>
          </div>

          <div className="assistant-layout">

            <div className="assistant-card">

              <div className="assistant-header">
                <div className="assistant-avatar">
                  ✨
                </div>

                <div>
                  <h3>ShopSphere AI</h3>
                  <p>
                    Your shopping assistant
                  </p>
                </div>
              </div>

              <div className="assistant-body">

                <div className="assistant-message">
                  Hi! 👋 I can help you find and compare
                  products.
                </div>

                {assistantResponse && (
                  <div className="assistant-message user-question">
                    {assistantResponse}
                  </div>
                )}

              </div>

              <div className="assistant-input">

                <input
                  type="text"
                  placeholder="Ask something like: Where can I find a laptop?"
                  value={assistantMessage}
                  onChange={(event) =>
                    setAssistantMessage(event.target.value)
                  }
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      askAssistant()
                    }
                  }}
                />

                <button
                  className="primary-btn"
                  onClick={askAssistant}
                  disabled={assistantLoading}
                >
                  {assistantLoading
                    ? 'Thinking...'
                    : 'Ask AI'}
                </button>

              </div>

            </div>

            <div className="memory-card">

              <div className="memory-icon">
                🧠
              </div>

              <h3>Hindsight Memory</h3>

              <p>
                ShopSphere can use Hindsight to retain,
                recall and reflect on useful shopping
                interactions.
              </p>

              <div className="memory-points">

                <div>
                  <strong>Retain</strong>
                  <span>
                    Store useful interaction memories
                  </span>
                </div>

                <div>
                  <strong>Recall</strong>
                  <span>
                    Retrieve relevant past context
                  </span>
                </div>

                <div>
                  <strong>Reflect</strong>
                  <span>
                    Improve future shopping assistance
                  </span>
                </div>

              </div>

              <div className="memory-status">
                Hindsight integration: MVP placeholder
              </div>

            </div>

          </div>

        </main>
      )}

      {/* ================= SHOPKEEPER ================= */}

      {activeSection === 'shopkeeper' && (
        <main className="page-container">

          <div className="page-header">

            <div>
              <span className="section-label">
                SHOPKEEPER DASHBOARD
              </span>

              <h2>
                Manage your shop
              </h2>

              <p>
                Manage inventory and reservation requests.
              </p>
            </div>

            <button
              className="secondary-btn"
              onClick={() => {
                setShopkeeperMode(false)
                setActiveSection('home')
              }}
            >
              Exit Dashboard
            </button>

          </div>

          <div className="dashboard-stats">

            <div className="stat-card">
              <span>Products</span>
              <strong>{allProducts.length}</strong>
            </div>

            <div className="stat-card">
              <span>Available Stock</span>
              <strong>
                {allProducts.reduce(
                  (total, product) =>
                    total + Number(product.stock || 0),
                  0
                )}
              </strong>
            </div>

            <div className="stat-card">
              <span>Nearby Products</span>
              <strong>
                {
                  allProducts.filter(
                    (product) =>
                      Number(product.distance) <= 5
                  ).length
                }
              </strong>
            </div>

            <div className="stat-card">
              <span>Reservations</span>
              <strong>
                {reservationStatus ? 1 : 0}
              </strong>
            </div>

          </div>

          <div className="dashboard-section">

            <div className="dashboard-heading">

              <div>
                <h3>Inventory</h3>
                <p>
                  Manage your available products.
                </p>
              </div>

              <input
                className="inventory-search"
                type="text"
                placeholder="Search inventory..."
                value={inventorySearch}
                onChange={(event) =>
                  setInventorySearch(event.target.value)
                }
              />

            </div>

            <div className="inventory-table">

              <div className="inventory-header">
                <span>Product</span>
                <span>Category</span>
                <span>Price</span>
                <span>Stock</span>
                <span>Status</span>
              </div>

              {inventoryProducts.map((product) => (
                <div
                  className="inventory-row"
                  key={product.id}
                >

                  <div className="inventory-product">
                    <span className="inventory-icon">
                      {product.category === 'Laptop'
                        ? '💻'
                        : product.category === 'Mobile'
                          ? '📱'
                          : '📦'}
                    </span>

                    <strong>
                      {product.name}
                    </strong>
                  </div>

                  <span>
                    {product.category}
                  </span>

                  <strong>
                    ₹{product.shopPrice.toLocaleString()}
                  </strong>

                  <span>
                    {product.stock}
                  </span>

                  <span
                    className={
                      product.stock > 0
                        ? 'stock-available'
                        : 'stock-unavailable'
                    }
                  >
                    {product.stock > 0
                      ? 'Available'
                      : 'Out of Stock'}
                  </span>

                </div>
              ))}

            </div>

          </div>

          <div className="dashboard-section">

            <div className="dashboard-heading">

              <div>
                <h3>Reservation Requests</h3>
                <p>
                  Handle customer reservation requests.
                </p>
              </div>

            </div>

            {reservationStatus ? (
              <div className="reservation-request">

                <div>
                  <strong>
                    {reservationStatus.productName}
                  </strong>

                  <p>
                    Customer: {reservationStatus.customerName}
                  </p>

                  <p>
                    Price: ₹
                    {reservationStatus.price.toLocaleString()}
                  </p>
                </div>

                <div className="request-actions">

                  <button
                    className="primary-btn"
                    onClick={() =>
                      setReservationStatus({
                        ...reservationStatus,
                        status: 'Accepted',
                      })
                    }
                  >
                    Accept
                  </button>

                  <button
                    className="danger-btn"
                    onClick={() =>
                      setReservationStatus({
                        ...reservationStatus,
                        status: 'Rejected',
                      })
                    }
                  >
                    Reject
                  </button>

                </div>

              </div>
            ) : (
              <div className="empty-state small">

                <div className="empty-icon">
                  📋
                </div>

                <h3>
                  No reservation requests
                </h3>

                <p>
                  New customer requests will appear here.
                </p>

              </div>
            )}

          </div>

        </main>
      )}

      {/* ================= PRODUCT DETAIL ================= */}

      {selectedProduct &&
        !showReservationModal &&
        activeSection === 'compare' && (
          <div className="modal-overlay">

            <div className="modal product-detail-modal">

              <button
                className="modal-close"
                onClick={() =>
                  setSelectedProduct(null)
                }
              >
                ×
              </button>

              <div className="detail-icon">
                {selectedProduct.category === 'Laptop'
                  ? '💻'
                  : selectedProduct.category === 'Mobile'
                    ? '📱'
                    : selectedProduct.category === 'Audio'
                      ? '🎧'
                      : '📦'}
              </div>

              <span className="product-category">
                {selectedProduct.category}
              </span>

              <h2>
                {selectedProduct.name}
              </h2>

              <div className="rating">
                ⭐ {selectedProduct.rating}
                <span>
                  ({selectedProduct.reviews} reviews)
                </span>
              </div>

              <div className="detail-grid">

                <div>
                  <span>Online Price</span>
                  <strong>
                    ₹
                    {selectedProduct.onlinePrice.toLocaleString()}
                  </strong>
                </div>

                <div>
                  <span>Nearby Price</span>
                  <strong>
                    ₹
                    {selectedProduct.shopPrice.toLocaleString()}
                  </strong>
                </div>

                <div>
                  <span>Shop</span>
                  <strong>
                    {selectedProduct.shopName}
                  </strong>
                </div>

                <div>
                  <span>Distance</span>
                  <strong>
                    {selectedProduct.distance} km
                  </strong>
                </div>

                <div>
                  <span>Stock</span>
                  <strong>
                    {selectedProduct.stock}
                  </strong>
                </div>

                <div>
                  <span>Delivery</span>
                  <strong>
                    {selectedProduct.delivery}
                  </strong>
                </div>

              </div>

              <button
                className="primary-btn full-width"
                onClick={() =>
                  openReservationModal(selectedProduct)
                }
              >
                Reserve at Nearby Shop
              </button>

            </div>

          </div>
        )}

      {/* ================= RESERVATION MODAL ================= */}

      {showReservationModal &&
        selectedProduct && (
          <div className="modal-overlay">

            <div className="modal">

              <button
                className="modal-close"
                onClick={closeReservationModal}
              >
                ×
              </button>

              <div className="modal-icon">
                🏪
              </div>

              <h2>
                Reserve Product
              </h2>

              <p>
                Send a reservation request to:
              </p>

              <div className="reservation-product">

                <strong>
                  {selectedProduct.name}
                </strong>

                <span>
                  {selectedProduct.shopName}
                </span>

                <strong>
                  ₹
                  {selectedProduct.shopPrice.toLocaleString()}
                </strong>

              </div>

              <div className="reservation-info">

                <div>
                  <span>Distance</span>
                  <strong>
                    {selectedProduct.distance} km
                  </strong>
                </div>

                <div>
                  <span>Available Stock</span>
                  <strong>
                    {selectedProduct.stock}
                  </strong>
                </div>

              </div>

              {reservationError && (
                <div className="tool-message">
                  {reservationError}
                </div>
              )}

              <div className="modal-actions">

                <button
                  className="secondary-btn"
                  onClick={closeReservationModal}
                  disabled={reservationSubmitting}
                >
                  Cancel
                </button>

                <button
                  className="primary-btn"
                  onClick={confirmReservation}
                  disabled={reservationSubmitting}
                >
                  {reservationSubmitting
                    ? 'Sending...'
                    : 'Confirm Reservation'}
                </button>

              </div>

            </div>

          </div>
        )}

      {/* ================= VOICE SEARCH MODAL ================= */}

      {showVoiceSearch && (
        <div className="modal-overlay">

          <div className="modal tool-modal">

            <button
              className="modal-close"
              onClick={() =>
                setShowVoiceSearch(false)
              }
            >
              ×
            </button>

            <div className="modal-icon">
              🎙️
            </div>

            <h2>
              Voice Search
            </h2>

            <p>
              Voice search interface is ready for
              speech-recognition integration.
            </p>

            <div className="voice-animation">
              🎙️
            </div>

            <button
              className="primary-btn"
              onClick={() =>
                setShowVoiceSearch(false)
              }
            >
              Close
            </button>

          </div>

        </div>
      )}

      {/* ================= IMAGE SEARCH MODAL ================= */}

      {showImageSearch && (
        <div className="modal-overlay">

          <div className="modal tool-modal">

            <button
              className="modal-close"
              onClick={() =>
                setShowImageSearch(false)
              }
            >
              ×
            </button>

            <div className="modal-icon">
              📷
            </div>

            <h2>
              Image Search
            </h2>

            <p>
              Upload a product image to identify and search
              for matching products.
            </p>

            <div className="upload-box">
              <span>📁</span>
              <p>
                Image recognition integration
                will be connected later.
              </p>
            </div>

            <button
              className="primary-btn"
              onClick={() =>
                setShowImageSearch(false)
              }
            >
              Close
            </button>

          </div>

        </div>
      )}

      {/* ================= BARCODE SEARCH MODAL ================= */}

      {showBarcodeSearch && (
        <div className="modal-overlay">

          <div className="modal tool-modal">

            <button
              className="modal-close"
              onClick={() =>
                setShowBarcodeSearch(false)
              }
            >
              ×
            </button>

            <div className="modal-icon">
              ▣
            </div>

            <h2>
              Barcode Search
            </h2>

            <p>
              Scan a product barcode to search for matching
              online and nearby shop results.
            </p>

            <div className="barcode-placeholder">
              ▦
            </div>

            <button
              className="primary-btn"
              onClick={() =>
                setShowBarcodeSearch(false)
              }
            >
              Close
            </button>

          </div>

        </div>
      )}

      {/* ================= FOOTER ================= */}

      <footer className="footer">

        <div className="footer-brand">

          <div className="logo-section">
            <div className="logo-icon">
              S
            </div>

            <div>
              <h3>ShopSphere</h3>
              <p>
                Online + Offline Shopping Platform
              </p>
            </div>
          </div>

          <p>
            Helping customers make informed shopping
            decisions by comparing online and nearby
            physical-store options.
          </p>

        </div>

        <div className="footer-links">

          <div>
            <h4>Platform</h4>
            <button
              onClick={() =>
                handleSectionChange('home')
              }
            >
              Home
            </button>

            <button
              onClick={() =>
                handleSectionChange('compare')
              }
            >
              Compare
            </button>

            <button
              onClick={() =>
                handleSectionChange('assistant')
              }
            >
              AI Assistant
            </button>
          </div>

          <div>
            <h4>Shopping</h4>

            <button
              onClick={() =>
                handleQuickSearch('Laptop')
              }
            >
              Laptops
            </button>

            <button
              onClick={() =>
                handleQuickSearch('Mobile')
              }
            >
              Mobiles
            </button>

            <button
              onClick={() =>
                handleQuickSearch('Headphones')
              }
            >
              Audio
            </button>
          </div>

          <div>
            <h4>Technology</h4>

            <span>React</span>
            <span>Node.js</span>
            <span>MySQL</span>
            <span>Gemini AI</span>
            <span>Hindsight</span>
          </div>

        </div>

        <div className="footer-bottom">
          <span>
            © 2026 ShopSphere
          </span>

          <span>
            Built for Hackathon MVP
          </span>
        </div>

      </footer>

    </div>
  )
}

export default App