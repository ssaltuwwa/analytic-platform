const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Путь к фронтенд файлам
const frontendPath = path.join(__dirname, '..', 'frontend');
console.log('Frontend path:', frontendPath);

// Serve static files
app.use(express.static(frontendPath));

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/analytics';

// Схема данных
const measurementSchema = new mongoose.Schema({
  timestamp: { type: Date, required: true, index: true },
  temperature: { type: Number, required: true },
  humidity: { type: Number, required: true },
  co2: { type: Number, required: true }
});

const Measurement = mongoose.model('Measurement', measurementSchema);

// Функция авто-генерации данных
async function autoSeed() {
  try {
    const count = await Measurement.countDocuments();
    if (count === 0) {
      console.log('Generating dummy data...');
      const dummyData = [];
      const now = new Date();
      
      for (let i = 0; i < 50; i++) {
        dummyData.push({
          timestamp: new Date(now.getTime() - i * 3600000), // Каждый час назад
          temperature: 20 + Math.random() * 5,
          humidity: 45 + Math.random() * 10,
          co2: 400 + Math.random() * 200
        });
      }
      await Measurement.insertMany(dummyData);
      console.log(`Generated ${dummyData.length} dummy records`);
    } else {
      console.log(`Database already has ${count} records`);
    }
  } catch (error) {
    console.error('Error seeding data:', error);
  }
}

// Connect to MongoDB
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully');
    autoSeed();
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    console.log('⚠️  Make sure MongoDB is running or check your connection string');
  });

// API для получения данных с фильтрацией по дате
app.get('/api/measurements', async (req, res) => {
  try {
    const { field = 'temperature', start_date, end_date } = req.query;
    
    // Validate field
    const allowedFields = ['temperature', 'humidity', 'co2'];
    if (!allowedFields.includes(field)) {
      return res.status(400).json({ 
        error: 'Invalid field. Allowed: temperature, humidity, co2' 
      });
    }

    let query = {};

    // Add date filtering
    if (start_date || end_date) {
      query.timestamp = {};
      
      if (start_date) {
        const startDate = new Date(start_date);
        if (isNaN(startDate.getTime())) {
          return res.status(400).json({ error: 'Invalid start_date format' });
        }
        query.timestamp.$gte = startDate;
      }
      
      if (end_date) {
        const endDate = new Date(end_date);
        if (isNaN(endDate.getTime())) {
          return res.status(400).json({ error: 'Invalid end_date format' });
        }
        query.timestamp.$lte = endDate;
      }
    }

    const data = await Measurement.find(query)
      .select(`timestamp ${field}`)
      .sort({ timestamp: 1 })
      .limit(100);

    res.json(data);
  } catch (err) {
    console.error('Error fetching measurements:', err);
    res.status(500).json({ error: err.message });
  }
});

// API для получения метрик (avg, min, max, stdDev)
app.get('/api/measurements/metrics', async (req, res) => {
  try {
    const { field = 'temperature', start_date, end_date } = req.query;
    
    // Validate field
    const allowedFields = ['temperature', 'humidity', 'co2'];
    if (!allowedFields.includes(field)) {
      return res.status(400).json({ 
        error: 'Invalid field. Allowed: temperature, humidity, co2' 
      });
    }

    let match = {};

    // Add date filtering
    if (start_date || end_date) {
      match.timestamp = {};
      
      if (start_date) {
        const startDate = new Date(start_date);
        if (isNaN(startDate.getTime())) {
          return res.status(400).json({ error: 'Invalid start_date format' });
        }
        match.timestamp.$gte = startDate;
      }
      
      if (end_date) {
        const endDate = new Date(end_date);
        if (isNaN(endDate.getTime())) {
          return res.status(400).json({ error: 'Invalid end_date format' });
        }
        match.timestamp.$lte = endDate;
      }
    }

    // Calculate metrics using aggregation
    const result = await Measurement.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          avg: { $avg: `$${field}` },
          min: { $min: `$${field}` },
          max: { $max: `$${field}` },
          stdDev: { $stdDevPop: `$${field}` },
          count: { $sum: 1 }
        }
      }
    ]);

    // If no data found, return zeros
    const metrics = result[0] || { 
      avg: 0, 
      min: 0, 
      max: 0, 
      stdDev: 0, 
      count: 0 
    };

    res.json(metrics);
  } catch (err) {
    console.error('Error calculating metrics:', err);
    res.status(500).json({ error: err.message });
  }
});

// API для генерации тестовых данных
app.post('/api/measurements/seed', async (req, res) => {
  try {
    // Optional: clear existing data
    // await Measurement.deleteMany({});
    
    const measurements = [];
    const now = new Date();
    
    // Generate 720 data points (30 days * 24 hours)
    for (let i = 0; i < 720; i++) {
      const timestamp = new Date(now);
      timestamp.setHours(now.getHours() - i);
      
      measurements.push({
        timestamp,
        temperature: 20 + Math.sin(i * 0.1) * 5 + (Math.random() * 2 - 1),
        humidity: 50 + Math.sin(i * 0.05) * 15 + (Math.random() * 5 - 2.5),
        co2: 400 + Math.sin(i * 0.02) * 200 + (Math.random() * 100 - 50)
      });
    }
    
    await Measurement.insertMany(measurements);
    
    res.json({ 
      message: `✅ Successfully added ${measurements.length} test measurements`,
      count: measurements.length,
      timeRange: 'Last 30 days (720 hours)'
    });
  } catch (err) {
    console.error('Error seeding data:', err);
    res.status(500).json({ 
      error: 'Failed to seed data',
      message: err.message 
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Analytics Platform API is running',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    version: '1.0.0'
  });
});

// Serve index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

const PORT = process.env.PORT || 2002;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 API Health: http://localhost:${PORT}/api/health`);
  console.log(`🌐 Frontend: http://localhost:${PORT}`);
  console.log(`📈 API endpoints:`);
  console.log(`   GET  /api/measurements`);
  console.log(`   GET  /api/measurements/metrics`);
  console.log(`   POST /api/measurements/seed`);
});