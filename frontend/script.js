// Dynamic API URL detection
const API_BASE_URL = window.location.origin.includes('localhost') 
    ? 'http://localhost:2002/api' 
    : window.location.origin + '/api';

let chart = null;

// UI Elements
const fieldSelect = document.getElementById('fieldSelect');
const startDateInput = document.getElementById('startDate');
const endDateInput = document.getElementById('endDate');
const backendStatus = document.getElementById('backendStatus');
const apiUrlElement = document.getElementById('apiUrl');
const deploymentStatus = document.getElementById('deploymentStatus');

// Update UI on load
if (apiUrlElement) apiUrlElement.textContent = `API URL: ${API_BASE_URL}`;

function setStatus() {
    if (!deploymentStatus) return;
    if (window.location.origin.includes('localhost')) {
        deploymentStatus.className = 'status-indicator local';
        deploymentStatus.innerHTML = '<i class="fas fa-circle"></i> Local Development';
    } else {
        deploymentStatus.className = 'status-indicator production';
        deploymentStatus.innerHTML = '<i class="fas fa-circle"></i> Production';
    }
}

function setDefaultDates() {
    if (!startDateInput || !endDateInput) return;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 7); // Last 7 days by default
    
    startDateInput.value = startDate.toISOString().split('T')[0];
    endDateInput.value = endDate.toISOString().split('T')[0];
}

async function checkBackendHealth() {
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        if (response.ok) {
            const data = await response.json();
            backendStatus.innerHTML = `<span style="color: #10b981;">
                <i class="fas fa-check-circle"></i> Connected
                <small style="display: block; font-size: 0.8em;">${data.database}</small>
            </span>`;
            return true;
        } else {
            backendStatus.innerHTML = '<span style="color: #ef4444;"><i class="fas fa-times-circle"></i> Error</span>';
            return false;
        }
    } catch (error) {
        backendStatus.innerHTML = '<span style="color: #ef4444;"><i class="fas fa-unlink"></i> Cannot connect</span>';
        return false;
    }
}

// Main function to fetch data
async function fetchData() {
    const field = fieldSelect.value;
    const start = startDateInput.value;
    const end = endDateInput.value;

    // Validate dates
    if (!start || !end) {
        showAlert('Please select both start and end dates', 'warning');
        return;
    }

    if (new Date(start) > new Date(end)) {
        showAlert('Start date cannot be after end date', 'warning');
        return;
    }

    showLoading(true);

    try {
        // Fetch time-series data
        const dataUrl = `${API_BASE_URL}/measurements?field=${field}&start_date=${start}&end_date=${end}`;
        const dataResponse = await fetch(dataUrl);
        
        if (!dataResponse.ok) {
            throw new Error(`HTTP error! status: ${dataResponse.status}`);
        }
        
        const data = await dataResponse.json();

        // Fetch metrics
        const metricsUrl = `${API_BASE_URL}/measurements/metrics?field=${field}&start_date=${start}&end_date=${end}`;
        const metricsResponse = await fetch(metricsUrl);
        
        if (!metricsResponse.ok) {
            throw new Error(`HTTP error! status: ${metricsResponse.status}`);
        }
        
        const metrics = await metricsResponse.json();

        // Update UI
        updateChart(data, field);
        updateMetrics(metrics);
        showAlert(`Loaded ${data.length} data points for ${field}`, 'success');
        
    } catch (error) {
        console.error('Error fetching data:', error);
        showAlert(`Error: ${error.message}`, 'error');
    } finally {
        showLoading(false);
    }
}

// Seed test data
async function seedTestData() {
    if (!confirm('This will generate test data for the last 30 days. Continue?')) {
        return;
    }

    try {
        showLoading(true);
        const response = await fetch(`${API_BASE_URL}/measurements/seed`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
        
        const result = await response.json();
        showAlert(result.message, 'success');
        
        // Reload data after seeding
        setTimeout(fetchData, 1000);
    } catch (error) {
        console.error('Error seeding data:', error);
        showAlert('Error generating test data', 'error');
    } finally {
        showLoading(false);
    }
}

// Update chart
function updateChart(data, field) {
    const canvas = document.getElementById('timeSeriesChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Destroy existing chart
    if (chart) {
        chart.destroy();
        chart = null;
    }

    // Handle empty data
    if (!data || data.length === 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.font = '16px Poppins, sans-serif';
        ctx.fillStyle = '#6b7280';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('No data available for selected range', canvas.width/2, canvas.height/2);
        return;
    }

    // Prepare labels and data
    const labels = data.map(d => {
        const date = new Date(d.timestamp);
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    });
    
    const values = data.map(d => d[field] || 0);
    
    const metricNames = {
        'temperature': 'Temperature (°C)',
        'humidity': 'Humidity (%)',
        'co2': 'CO2 (ppm)'
    };

    // Create new chart
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: metricNames[field],
                data: values,
                borderColor: '#4f46e5',
                backgroundColor: 'rgba(79, 70, 229, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 3,
                pointHoverRadius: 6,
                pointBackgroundColor: '#4f46e5'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        font: {
                            family: "'Poppins', sans-serif"
                        }
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            return `${metricNames[field]}: ${context.parsed.y.toFixed(2)}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        font: { 
                            family: "'Poppins', sans-serif" 
                        },
                        maxRotation: 45,
                        minRotation: 45
                    }
                },
                y: {
                    beginAtZero: false,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        font: { 
                            family: "'Poppins', sans-serif" 
                        }
                    },
                    title: {
                        display: true,
                        text: metricNames[field],
                        font: {
                            family: "'Poppins', sans-serif"
                        }
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'nearest'
            }
        }
    });
}

// Update metrics display
function updateMetrics(metrics) {
    if (document.getElementById('avg')) 
        document.getElementById('avg').textContent = metrics.avg ? metrics.avg.toFixed(2) : '0.00';
    
    if (document.getElementById('min')) 
        document.getElementById('min').textContent = metrics.min ? metrics.min.toFixed(2) : '0.00';
    
    if (document.getElementById('max')) 
        document.getElementById('max').textContent = metrics.max ? metrics.max.toFixed(2) : '0.00';
    
    if (document.getElementById('stdDev')) 
        document.getElementById('stdDev').textContent = metrics.stdDev ? metrics.stdDev.toFixed(2) : '0.00';
    
    if (document.getElementById('count')) 
        document.getElementById('count').textContent = metrics.count || '0';
}

// Show alert message
function showAlert(message, type = 'info') {
    const oldAlert = document.querySelector('.alert');
    if (oldAlert) oldAlert.remove();

    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    
    let icon = 'info-circle';
    if (type === 'success') icon = 'check-circle';
    if (type === 'warning') icon = 'exclamation-triangle';
    if (type === 'error') icon = 'times-circle';
    
    alert.innerHTML = `
        <i class="fas fa-${icon}"></i>
        ${message}
        <button onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;

    alert.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === 'success' ? '#10b981' : type === 'warning' ? '#f59e0b' : '#ef4444'};
        color: white;
        border-radius: 12px;
        display: flex;
        align-items: center;
        gap: 10px;
        z-index: 1000;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        animation: slideIn 0.3s ease;
    `;

    alert.querySelector('button').style.cssText = `
        background: transparent;
        border: none;
        color: white;
        cursor: pointer;
        margin-left: 10px;
    `;

    document.body.appendChild(alert);

    setTimeout(() => {
        if (alert.parentElement) {
            alert.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => alert.remove(), 300);
        }
    }, 3000);
}

// Show loading state
function showLoading(show) {
    const loadBtn = document.querySelector('.load-btn');
    if (loadBtn) {
        if (show) {
            loadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
            loadBtn.disabled = true;
        } else {
            loadBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Load Data';
            loadBtn.disabled = false;
        }
    }
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Initialize application
document.addEventListener('DOMContentLoaded', async () => {
    setStatus();
    setDefaultDates();
    
    // Check backend health
    const isHealthy = await checkBackendHealth();
    
    // Load data if backend is healthy
    if (isHealthy) {
        fetchData();
    }
});