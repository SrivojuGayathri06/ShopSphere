const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const { HindsightClient } = require('@vectorize-io/hindsight-client')

dotenv.config()

const app = express()

// Render provides PORT automatically.
// Local computer will use 5000.
const PORT = process.env.PORT || 5000

app.use(cors())
app.use(express.json())

// ===============================
// HINDSIGHT
// ===============================

const hindsight = new HindsightClient({
  baseUrl:
    process.env.HINDSIGHT_BASE_URL ||
    'https://api.hindsight.vectorize.io',
  apiKey: process.env.HINDSIGHT_API_KEY,
})

const BANK_ID =
  process.env.HINDSIGHT_BANK_ID || 'shopsphere-memory'

// ===============================
// PRODUCTS
// ===============================

const products = [
  {
    id: 1,
    name: 'HP Laptop',
    category: 'Laptop',
    onlinePrice: 45000,
    shopPrice: 44500,
    shopName: 'Sri Lakshmi Electronics',
    distance: 2.1,
    rating: 4.5,
    reviews: 128,
    delivery: '2-3 days',
    availability: 'Available',
    stock: 4,
  },
  {
    id: 2,
    name: 'Samsung Galaxy Phone',
    category: 'Mobile',
    onlinePrice: 25000,
    shopPrice: 24500,
    shopName: 'Mobile World',
    distance: 1.5,
    rating: 4.6,
    reviews: 214,
    delivery: '1-2 days',
    availability: 'Available',
    stock: 7,
  },
  {
    id: 3,
    name: 'Dell Laptop',
    category: 'Laptop',
    onlinePrice: 55000,
    shopPrice: 53500,
    shopName: 'Computer Point',
    distance: 3.2,
    rating: 4.4,
    reviews: 96,
    delivery: '2-3 days',
    availability: 'Available',
    stock: 3,
  },
  {
    id: 4,
    name: 'Boat Headphones',
    category: 'Audio',
    onlinePrice: 2000,
    shopPrice: 1800,
    shopName: 'Sound Hub',
    distance: 1.2,
    rating: 4.3,
    reviews: 342,
    delivery: '1 day',
    availability: 'Available',
    stock: 12,
  },
  {
    id: 5,
    name: 'Logitech Wireless Mouse',
    category: 'Computer Accessories',
    onlinePrice: 1200,
    shopPrice: 1050,
    shopName: 'Tech Zone',
    distance: 4.4,
    rating: 4.5,
    reviews: 87,
    delivery: '1-2 days',
    availability: 'Available',
    stock: 8,
  },
  {
    id: 6,
    name: 'Samsung Monitor',
    category: 'Monitor',
    onlinePrice: 14500,
    shopPrice: 13900,
    shopName: 'Digital World',
    distance: 6.8,
    rating: 4.2,
    reviews: 73,
    delivery: '2-4 days',
    availability: 'Available',
    stock: 2,
  },
]

// ===============================
// BASIC ROUTES
// ===============================

app.get('/', (req, res) => {
  res.json({
    message: 'ShopSphere backend is running successfully!',
  })
})

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'ShopSphere Backend',
    time: new Date().toISOString(),
  })
})

// ===============================
// PRODUCT ROUTES
// ===============================

app.get('/api/products', (req, res) => {
  res.json(products)
})

app.get('/api/products/search', (req, res) => {
  const query = req.query.q || ''
  const radius = Number(req.query.radius) || 10

  const results = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(query.toLowerCase()) ||
      product.category.toLowerCase().includes(query.toLowerCase())

    const matchesRadius = product.distance <= radius

    return matchesSearch && matchesRadius
  })

  res.json(results)
})

app.get('/api/products/:id', (req, res) => {
  const id = Number(req.params.id)

  const product = products.find((item) => item.id === id)

  if (!product) {
    return res.status(404).json({
      message: 'Product not found',
    })
  }

  res.json(product)
})

// ===============================
// HINDSIGHT RETAIN
// ===============================

app.post('/api/memory/retain', async (req, res) => {
  try {
    const { content } = req.body

    if (!content) {
      return res.status(400).json({
        message: 'Memory content is required',
      })
    }

    await hindsight.retain(BANK_ID, content)

    res.json({
      success: true,
      operation: 'RETAIN',
      message: 'Memory stored successfully in Hindsight',
      content,
    })
  } catch (error) {
    console.error('Hindsight RETAIN error:', error)

    res.status(500).json({
      success: false,
      operation: 'RETAIN',
      message: 'Failed to store memory',
      error: error.message,
    })
  }
})

// ===============================
// HINDSIGHT RECALL
// ===============================

app.get('/api/memory/recall', async (req, res) => {
  try {
    const query =
      req.query.q || 'What does this user prefer?'

    const result = await hindsight.recall(BANK_ID, query)

    res.json({
      success: true,
      operation: 'RECALL',
      query,
      memories: result.results || [],
    })
  } catch (error) {
    console.error('Hindsight RECALL error:', error)

    res.status(500).json({
      success: false,
      operation: 'RECALL',
      message: 'Failed to recall memories',
      error: error.message,
    })
  }
})

// ===============================
// HINDSIGHT REFLECT
// ===============================

app.post('/api/memory/reflect', async (req, res) => {
  try {
    const { query } = req.body

    if (!query) {
      return res.status(400).json({
        message: 'Reflection query is required',
      })
    }

    const result = await hindsight.reflect(BANK_ID, query)

    res.json({
      success: true,
      operation: 'REFLECT',
      query,
      answer: result.text,
      basedOn: result.based_on || [],
    })
  } catch (error) {
    console.error('Hindsight REFLECT error:', error)

    res.status(500).json({
      success: false,
      operation: 'REFLECT',
      message: 'Failed to reflect over memories',
      error: error.message,
    })
  }
})

// ===============================
// RESERVATION
// ===============================

app.post('/api/reservations', async (req, res) => {
  try {
    const {
      productId,
      customerName,
      customerPhone,
    } = req.body

    if (!productId) {
      return res.status(400).json({
        message: 'Product ID is required',
      })
    }

    const product = products.find(
      (item) => item.id === Number(productId)
    )

    if (!product) {
      return res.status(404).json({
        message: 'Product not found',
      })
    }

    const reservation = {
      id: Date.now(),
      productId: product.id,
      productName: product.name,
      shopName: product.shopName,
      customerName:
        customerName || 'Demo Customer',
      customerPhone: customerPhone || '',
      price: product.shopPrice,
      status: 'Pending',
      createdAt: new Date().toISOString(),
    }

    // Store reservation in Hindsight
    const memoryText =
      `Customer ${reservation.customerName} reserved ` +
      `${product.name} from ${product.shopName} ` +
      `at ₹${product.shopPrice}. ` +
      `Reservation status: ${reservation.status}.`

    try {
      await hindsight.retain(BANK_ID, memoryText)
    } catch (memoryError) {
      console.error(
        'Reservation created but Hindsight failed:',
        memoryError.message
      )
    }

    res.status(201).json({
      message:
        'Reservation request created successfully',
      reservation,
      hindsight:
        'Reservation interaction sent to Hindsight',
    })
  } catch (error) {
    console.error('Reservation error:', error)

    res.status(500).json({
      message: 'Failed to create reservation',
      error: error.message,
    })
  }
})

// ===============================
// START SERVER
// ===============================

app.listen(PORT, '0.0.0.0', () => {
  console.log(
    `ShopSphere backend running on port ${PORT}`
  )

  console.log(
    `Hindsight Memory Bank: ${BANK_ID}`
  )
})