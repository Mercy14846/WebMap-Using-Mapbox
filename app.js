// Replace with your Mapbox access token
mapboxgl.accessToken = 'pk.eyJ1IjoibWVyY3ljaWEiLCJhIjoiY202cW03eTA0MW13NDJtczRnOXdlbXEwYSJ9.K8g2wopw3X6Jw5hdomJ4lQ';

// Initialize the map
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/dark-v10',
    center: [13, 20], // Default center
    zoom: 2
});

// Add navigation controls
map.addControl(new mapboxgl.NavigationControl());

// Store our API endpoint
const API_URL = 'CIA_CIruVm9aOP_2025-06-22-2025-06-24.csv';

// Variables to store our data and layers
let climateData = [];
let heatmapLayer = null;

// Color scales for different data types
const colorScales = {
    temperature: [
        [0, 'blue'],
        [0.2, 'cyan'],
        [0.4, 'lime'],
        [0.6, 'yellow'],
        [0.8, 'orange'],
        [1, 'red']
    ],
    humidity: [
        [0, 'white'],
        [0.3, 'lightblue'],
        [0.6, 'blue'],
        [1, 'darkblue']
    ],
    wind_speed: [
        [0, 'green'],
        [0.3, 'yellow'],
        [0.6, 'orange'],
        [1, 'red']
    ],
    precipitation: [
        [0, 'white'],
        [0.3, 'lightblue'],
        [0.6, 'blue'],
        [1, 'darkblue']
    ]
};

// Function to load data from API or CSV
async function loadData() {
    try {
        // Parse the local CSV file in the folder
        Papa.parse(API_URL, {
            download: true,
            header: true,
            skipEmptyLines: true,
            complete: function(results) {
                // Fetch the file as text to extract lat/lng from header
                fetch(API_URL)
                    .then(res => res.text())
                    .then(text => {
                        const latMatch = text.match(/latitude:\s*([\-\d.]+)/);
                        const lngMatch = text.match(/longitude:\s*([\-\d.]+)/);
                        const lat = latMatch ? parseFloat(latMatch[1]) : null;
                        const lng = lngMatch ? parseFloat(lngMatch[1]) : null;

                        climateData = results.data.map(row => ({
                            lat: lat,
                            lng: lng,
                            temperature: parseFloat(row['temperature (°C)']),
                            humidity: parseFloat(row['humidity (%)']),
                            wind_speed: row['wind_speed'] ? parseFloat(row['wind_speed']) : 0,
                            precipitation: row['rain (mm/hr)'] ? parseFloat(row['rain (mm/hr)']) : 0
                        }));
                        updateHeatmap();
                    });
            }
        });
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

// CSV Upload Handler
if (document.getElementById('csv-upload')) {
    document.getElementById('csv-upload').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: function(results) {
                // Extract lat/lng from file header (first few lines)
                const reader = new FileReader();
                reader.onload = function(event) {
                    const text = event.target.result;
                    const latMatch = text.match(/latitude:\s*([\-\d.]+)/);
                    const lngMatch = text.match(/longitude:\s*([\-\d.]+)/);
                    const lat = latMatch ? parseFloat(latMatch[1]) : null;
                    const lng = lngMatch ? parseFloat(lngMatch[1]) : null;

                    climateData = results.data.map(row => ({
                        lat: lat,
                        lng: lng,
                        temperature: parseFloat(row['temperature (°C)']),
                        humidity: parseFloat(row['humidity (%)']),
                        wind_speed: row['wind_speed'] ? parseFloat(row['wind_speed']) : 0,
                        precipitation: row['rain (mm/hr)'] ? parseFloat(row['rain (mm/hr)']) : 0
                    }));
                    updateHeatmap();
                };
                reader.readAsText(file);
            }
        });
    });
}

// Function to update the heatmap based on selected parameters
function updateHeatmap() {
    if (!climateData.length) return;
    
    const dataType = document.getElementById('data-type').value;
    const radius = parseInt(document.getElementById('radius').value);
    const intensity = parseInt(document.getElementById('intensity').value);
    
    // Remove existing heatmap layer if it exists
    if (map.getLayer('heatmap-layer')) {
        map.removeLayer('heatmap-layer');
        map.removeSource('heatmap-source');
    }
    
    // Prepare the data for the heatmap
    const features = climateData.map(point => ({
        type: 'Feature',
        geometry: {
            type: 'Point',
            coordinates: [point.lng, point.lat]
        },
        properties: {
            // Normalize the value between 0 and 1 for the heatmap
            value: normalizeValue(point[dataType], dataType)
        }
    }));
    
    // Add the heatmap source and layer
    map.addSource('heatmap-source', {
        type: 'geojson',
        data: {
            type: 'FeatureCollection',
            features: features
        }
    });
    
    map.addLayer({
        id: 'heatmap-layer',
        type: 'heatmap',
        source: 'heatmap-source',
        paint: {
            // Increase intensity as zoom level increases
            'heatmap-intensity': intensity,
            // Color scale for the heatmap
            'heatmap-color': [
                'interpolate',
                ['linear'],
                ['heatmap-density'],
                ...colorScales[dataType].flat()
            ],
            // Radius of each point
            'heatmap-radius': radius,
            // Decrease opacity to see underlying map
            'heatmap-opacity': 0.7,
            // Transition from heatmap to circle layer by zoom level
            'heatmap-weight': [
                'interpolate',
                ['linear'],
                ['zoom'],
                0, 1,
                9, 3
            ]
        }
    });
    
    // Update the legend
    updateLegend(dataType);
}

// Function to normalize values between 0 and 1 for the heatmap
function normalizeValue(value, dataType) {
    // Get all values for this data type
    const values = climateData.map(item => item[dataType]);
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    // Normalize between 0 and 1
    return (value - min) / (max - min);
}

// Function to update the legend
function updateLegend(dataType) {
    const legendContent = document.getElementById('legend-content');
    const colors = colorScales[dataType];
    
    let html = `<div><strong>${getDataTypeLabel(dataType)}</strong></div>`;
    
    // Get min and max values for the current data type
    const values = climateData.map(item => item[dataType]);
    const min = Math.min(...values).toFixed(1);
    const max = Math.max(...values).toFixed(1);
    
    // Create gradient for legend
    html += `<div style="background: linear-gradient(to right, ${colors.map(c => c[1]).join(', ')}; 
             height: 20px; width: 100%; margin-top: 5px;"></div>`;
    html += `<div style="display: flex; justify-content: space-between;">
                <span>${min}</span>
                <span>${max}</span>
             </div>`;
    
    legendContent.innerHTML = html;
}

// Helper function to get display label for data type
function getDataTypeLabel(dataType) {
    const labels = {
        temperature: 'Temperature (°C)',
        humidity: 'Humidity (%)',
        wind_speed: 'Wind Speed (km/h)',
        precipitation: 'Precipitation (mm)'
    };
    return labels[dataType];
}

// Event listeners for controls
document.getElementById('data-type').addEventListener('change', updateHeatmap);
document.getElementById('radius').addEventListener('input', updateHeatmap);
document.getElementById('intensity').addEventListener('input', updateHeatmap);

// Load data when the map is ready
map.on('load', () => {
    loadData();
    
    // Add click event to show data at a point
    map.on('click', (e) => {
        const features = map.queryRenderedFeatures(e.point, {
            layers: ['heatmap-layer']
        });
        
        if (features.length) {
            // Find the nearest data point (simplified for demo)
            const clickedCoords = e.lngLat;
            let closestPoint = null;
            let minDistance = Infinity;
            
            climateData.forEach(point => {
                const distance = Math.sqrt(
                    Math.pow(point.lat - clickedCoords.lat, 2) + 
                    Math.pow(point.lng - clickedCoords.lng, 2)
                );
                
                if (distance < minDistance) {
                    minDistance = distance;
                    closestPoint = point;
                }
            });
            
            if (closestPoint) {
                const dataType = document.getElementById('data-type').value;
                new mapboxgl.Popup()
                    .setLngLat(clickedCoords)
                    .setHTML(`
                        <strong>Climate Data</strong><br>
                        Latitude: ${closestPoint.lat.toFixed(4)}<br>
                        Longitude: ${closestPoint.lng.toFixed(4)}<br>
                        ${getDataTypeLabel(dataType)}: ${closestPoint[dataType]}
                    `)
                    .addTo(map);
            }
        }
    });
});