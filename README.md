# 📊 Analytics Platform

A real-time analytics platform for visualizing time-series data with MongoDB and Chart.js.

## 🚀 Live Demo
- **Replit**: [click](https://analytic-platform--ssaltuwwa.replit.app)
- **Frontend**: Interactive dashboard with charts and metrics
- **Backend**: REST API for data retrieval and analysis

## ✨ Features
- 📈 Interactive time-series charts with Chart.js
- 📊 Statistical metrics (average, min, max, standard deviation)
- 🔄 Real-time data filtering by date range
- 🧪 Automatic test data generation
- 📱 Responsive design for all devices
- 🔒 Secure API with error handling

## 🏗️ Architecture
- **Frontend**: HTML5, CSS3, JavaScript, Chart.js
- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Deployment**: Render.com (Free tier)

## 📁 Project Structure

```
analytics-platform/
├── backend/                    # Node.js/Express API
│   ├── index.js               # Main server file
│   ├── package.json           # Dependencies
│   └── .env.example           # Environment variables template
├── frontend/                  # Static web files
│   ├── index.html             # Dashboard UI
│   ├── style.css              # Styling
│   └── script.js              # Frontend logic
└── render.yaml                # Render deployment config
```

# 📊 Analytics Platform

A real-time analytics platform for visualizing time-series data with MongoDB and Chart.js.

## 🚀 Live Demo
- **Render**: [https://analytics-platform.onrender.com](https://analytics-platform.onrender.com)
- **Frontend**: Interactive dashboard with charts and metrics
- **Backend**: REST API for data retrieval and analysis

## ✨ Features
- 📈 Interactive time-series charts with Chart.js
- 📊 Statistical metrics (average, min, max, standard deviation)
- 🔄 Real-time data filtering by date range
- 🧪 Automatic test data generation
- 📱 Responsive design for all devices
- 🔒 Secure API with error handling

## 🏗️ Architecture
- **Frontend**: HTML5, CSS3, JavaScript, Chart.js
- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Deployment**: Render.com (Free tier)

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or Atlas)

### 1. Clone Repository
```bash
git clone https://github.com/yourusername/analytics-platform.git
cd analytics-platform
```

### 2. Setup Backend
```bash
cd backend
npm install
```

### 3. Run Development Server
```bash
npm start
```

### 4. Open Frontend

Open **http://localhost:2002** in your browser

## 📡 API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Health check |
| `GET` | `/api/measurements` | Get time-series data |
| `GET` | `/api/measurements/metrics` | Get statistical metrics |
| `POST` | `/api/measurements/seed` | Generate test data |

## 👨‍💻 Author

**Saltanat** — [GitHub](https://github.com/ssaltuwwa)

## 🙏 Acknowledgments

* [Chart.js](https://www.chartjs.org/) — for amazing data visualization
* [MongoDB](https://www.mongodb.com/) — for flexible database
* [Render](https://replit.com/) — for free hosting
* [Font Awesome](https://fontawesome.com/) — for icons
