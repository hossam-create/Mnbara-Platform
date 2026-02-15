import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import customerIdRoutes from './routes/customer-id.routes'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3010

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'customer-id-service' })
})

// API Routes
app.use('/api/customer-id', customerIdRoutes)

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err)
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  })
})

app.listen(PORT, () => {
  console.log(`Customer ID Service running on port ${PORT}`)
})

export default app
