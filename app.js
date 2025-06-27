// Replace with your Mapbox access token
mapboxgl.accessToken = 'pk.eyJ1IjoibWVyY3ljaWEiLCJhIjoiY202cW03eTA0MW13NDJtczRnOXdlbXEwYSJ9.K8g2wopw3X6Jw5hdomJ4lQ';

// Initialize the map
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/dark-v10',
    center: [20, 2], // Centered on Africa
    zoom: 3.2
});

// Add navigation controls
map.addControl(new mapboxgl.NavigationControl());

// Store our API endpoint
const API_URL = 'CIA_CIruVm9aOP_2025-06-22-2025-06-24.csv';

// Variables to store our data and layers
let climateData = [];
let allData = [];
let heatmapLayers = {};
let currentTimeIndex = 0;
let timer = null;
let stationMarkers = [];
let activeOverlays = new Set(['temperature']); // Track active overlays

// Test markers with enhanced data
const testMarkers = [
  { name: "LASEPA-008", location: "6.462088,3.550920", temperature: 28, wind_speed: 10, pm25: 35, state: "active" },
  { name: "LASEPA-001", location: "6.462155,3.550898", temperature: 32, wind_speed: 8, pm25: 50, state: "active" },
  { name: "LASEPA-010", location: "6.474743,3.611033", temperature: 36, wind_speed: 12, pm25: 80, state: "active" },
  { name: "LASEPA-007", location: "6.612907,3.360933", temperature: 41, wind_speed: 15, pm25: 120, state: "active" },
  { name: "Nairobi-001", location: "-1.2921,36.8219", temperature: 25, wind_speed: 18, pm25: 60, state: "active" },
  { name: "Cairo-001", location: "30.0444,31.2357", temperature: 39, wind_speed: 22, pm25: 90, state: "active" },
  { name: "Johannesburg-001", location: "-26.2041,28.0473", temperature: 22, wind_speed: 20, pm25: 40, state: "active" },
  { name: "Dakar-001", location: "14.7167,-17.4677", temperature: 31, wind_speed: 14, pm25: 55, state: "active" },
  { name: "Accra-001", location: "5.6037,-0.1870", temperature: 29, wind_speed: 11, pm25: 45, state: "active" },
  { name: "Addis-001", location: "9.03,38.74", temperature: 20, wind_speed: 10, pm25: 30, state: "active" },
  { name: "Algiers-001", location: "36.7538,3.0588", temperature: 34, wind_speed: 16, pm25: 70, state: "active" },
  { name: "Casablanca-001", location: "33.5731,-7.5898", temperature: 27, wind_speed: 13, pm25: 38, state: "active" },
  { name: "Kampala-001", location: "0.3476,32.5825", temperature: 26, wind_speed: 9, pm25: 42, state: "active" },
  { name: "Tripoli-001", location: "32.8872,13.1913", temperature: 37, wind_speed: 19, pm25: 85, state: "active" },
  { name: "Khartoum-001", location: "15.5007,32.5599", temperature: 40, wind_speed: 21, pm25: 110, state: "active" },
  { name: "Tunis-001", location: "36.8065,10.1815", temperature: 33, wind_speed: 12, pm25: 60, state: "active" },
  { name: "Luanda-001", location: "-8.8390,13.2894", temperature: 29, wind_speed: 8, pm25: 50, state: "active" },
  { name: "Kinshasa-001", location: "-4.4419,15.2663", temperature: 30, wind_speed: 10, pm25: 55, state: "active" },
  { name: "Abuja-001", location: "9.0579,7.4951", temperature: 35, wind_speed: 17, pm25: 75, state: "active" },
  { name: "Marrakesh-001", location: "31.6295,-7.9811", temperature: 38, wind_speed: 15, pm25: 95, state: "active" },
  { name: "Bamako-001", location: "12.6392,-8.0029", temperature: 37, wind_speed: 13, pm25: 80, state: "active" },
  { name: "Libreville-001", location: "0.4162,9.4673", temperature: 28, wind_speed: 9, pm25: 40, state: "active" },
  { name: "Maputo-001", location: "-25.9692,32.5732", temperature: 24, wind_speed: 12, pm25: 35, state: "active" },
  { name: "Harare-001", location: "-17.8252,31.0335", temperature: 23, wind_speed: 10, pm25: 30, state: "active" },
  { name: "Gaborone-001", location: "-24.6282,25.9231", temperature: 27, wind_speed: 11, pm25: 38, state: "active" },
  { name: "Port Harcourt-001", location: "4.8156,7.0498", temperature: 33, wind_speed: 14, pm25: 70, state: "active" },
  { name: "Ouagadougou-001", location: "12.3714,-1.5197", temperature: 36, wind_speed: 15, pm25: 85, state: "active" },
  { name: "Lusaka-001", location: "-15.3875,28.3228", temperature: 25, wind_speed: 10, pm25: 32, state: "active" },
  { name: "Kigali-001", location: "-1.9706,30.1044", temperature: 22, wind_speed: 8, pm25: 28, state: "active" },
  { name: "Yaounde-001", location: "3.8480,11.5021", temperature: 29, wind_speed: 12, pm25: 45, state: "active" }
];

// Track marker objects for toggling
let testMarkerObjects = [];
let markersVisible = true;

// Color scales for the 3 variables
const colorScales = {
  temperature: [
    0, 'blue',
    0.25, 'cyan',
    0.5, 'lime',
    0.75, 'yellow',
    1, 'red'
  ],
  wind_speed: [
    0, 'white',
    0.25, 'lightblue',
    0.5, 'blue',
    0.75, 'purple',
    1, 'black'
  ],
  pm25: [
    0, 'green',
    0.25, 'yellow',
    0.5, 'orange',
    0.75, 'red',
    1, 'maroon'
  ]
};

// Variable ranges for normalization
const variableRanges = {
  temperature: { min: 0, max: 50 },
  wind_speed: { min: 0, max: 50 },
  pm25: { min: 0, max: 200 }
};

// Function to load data from CSV
async function loadData() {
    try {
        Papa.parse(API_URL, {
            download: true,
            header: true,
            skipEmptyLines: true,
            complete: function(results) {
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
                            pressure: parseFloat(row['pressure (hPa)']),
                            rain: parseFloat(row['rain (mm/hr)']),
                            humidity: parseFloat(row['humidity (%)']),
                            wind_speed: row['wind_speed'] ? parseFloat(row['wind_speed']) : 0,
                            date: row['date']
                        }));
                        updateAllHeatmaps();
                    });
            }
        });
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

// Function to create heatmap data with 1km radius
function createHeatmapData(variable, radiusKm = 1) {
    const data = [];
    const radiusDegrees = radiusKm / 111; // Approximate conversion from km to degrees
    
    // Add data from CSV
    if (climateData.length > 0) {
        climateData.forEach(point => {
            if (point[variable] !== undefined && !isNaN(point[variable])) {
                // Create a grid of points within the radius
                for (let i = 0; i < 25; i++) {
                    for (let j = 0; j < 25; j++) {
                        const latOffset = (i - 12) * radiusDegrees / 12;
                        const lngOffset = (j - 12) * radiusDegrees / 12;
                        const distance = Math.sqrt(latOffset * latOffset + lngOffset * lngOffset);
                        
                        if (distance <= radiusDegrees) {
                            const intensity = 1 - (distance / radiusDegrees);
                            data.push({
                                type: 'Feature',
                                geometry: {
                                    type: 'Point',
                                    coordinates: [point.lng + lngOffset, point.lat + latOffset]
                                },
                                properties: {
                                    value: normalizeValue(point[variable], variable) * intensity
                                }
                            });
                        }
                    }
                }
            }
        });
    }
    
    // Add data from test markers
    testMarkers.forEach(marker => {
        if (marker[variable] !== undefined && !isNaN(marker[variable])) {
            const [lat, lng] = marker.location.split(',').map(Number);
            
            // Create a grid of points within the radius
            for (let i = 0; i < 25; i++) {
                for (let j = 0; j < 25; j++) {
                    const latOffset = (i - 12) * radiusDegrees / 12;
                    const lngOffset = (j - 12) * radiusDegrees / 12;
                    const distance = Math.sqrt(latOffset * latOffset + lngOffset * lngOffset);
                    
                    if (distance <= radiusDegrees) {
                        const intensity = 1 - (distance / radiusDegrees);
                        data.push({
                            type: 'Feature',
                            geometry: {
                                type: 'Point',
                                coordinates: [lng + lngOffset, lat + latOffset]
                            },
                            properties: {
                                value: normalizeValue(marker[variable], variable) * intensity
                            }
                        });
                    }
                }
            }
        }
    });
    
    return data;
}

// Function to update all heatmaps based on active overlays
function updateAllHeatmaps() {
    // Remove all existing heatmap layers
    Object.keys(heatmapLayers).forEach(variable => {
        if (map.getLayer(`heatmap-${variable}`)) {
            map.removeLayer(`heatmap-${variable}`);
        }
        if (map.getSource(`heatmap-source-${variable}`)) {
            map.removeSource(`heatmap-source-${variable}`);
        }
    });
    
    // Clear heatmap layers object
    heatmapLayers = {};
    
    // Add heatmaps for active overlays
    activeOverlays.forEach(variable => {
        const data = createHeatmapData(variable, 1); // Fixed 1km radius
        
        if (data.length > 0) {
            // Add the heatmap source
            map.addSource(`heatmap-source-${variable}`, {
                type: 'geojson',
                data: {
                    type: 'FeatureCollection',
                    features: data
                }
            });
            
            // Add the heatmap layer
            map.addLayer({
                id: `heatmap-${variable}`,
                type: 'heatmap',
                source: `heatmap-source-${variable}`,
                paint: {
                    'heatmap-intensity': 3,
                    'heatmap-color': colorScales[variable],
                    'heatmap-radius': 40,
                    'heatmap-opacity': 0.8,
                    'heatmap-weight': [
                        'interpolate',
                        ['linear'],
                        ['get', 'value'],
                        0, 0,
                        1, 1
                    ]
                }
            });
            
            heatmapLayers[variable] = true;
        }
    });
    
    // Update legend
    updateLegend();
}

// Function to normalize values between 0 and 1
function normalizeValue(value, variable) {
    const range = variableRanges[variable];
    if (!range) return 0;
    
    const normalized = (value - range.min) / (range.max - range.min);
    return Math.max(0, Math.min(1, normalized));
}

// Function to update legend
function updateLegend() {
    const legendContent = document.getElementById('legend-content');
    legendContent.innerHTML = '';
    
    activeOverlays.forEach(variable => {
        const legendItem = document.createElement('div');
        legendItem.className = 'legend-item';
        
        const title = document.createElement('h5');
        title.textContent = getVariableLabel(variable);
        legendItem.appendChild(title);
        
        const gradientBar = document.createElement('div');
        gradientBar.className = 'legend-gradient-bar';
        gradientBar.style.background = `linear-gradient(to right, ${colorScales[variable].join(', ')})`;
        legendItem.appendChild(gradientBar);
        
        const labels = document.createElement('div');
        labels.className = 'legend-labels';
        const range = variableRanges[variable];
        labels.innerHTML = `<span>${range.min}</span><span>${range.max}</span>`;
        legendItem.appendChild(labels);
        
        legendContent.appendChild(legendItem);
    });
}

// Function to get variable label
function getVariableLabel(variable) {
    const labels = {
        temperature: '🌡️ Temperature (°C)',
        wind_speed: '💨 Wind Speed (km/h)',
        pm25: '🌫️ PM2.5 (µg/m³)'
    };
    return labels[variable] || variable;
}

// Function to update overlay visual state
function updateOverlayVisualState() {
    const checkboxes = ['temperature', 'wind_speed', 'pm25'];
    checkboxes.forEach(variable => {
        const checkboxElement = document.getElementById(`checkbox-${variable}`);
        if (checkboxElement) {
            if (activeOverlays.has(variable)) {
                checkboxElement.classList.add('active-overlay');
            } else {
                checkboxElement.classList.remove('active-overlay');
            }
        }
    });
}

// Event listeners for overlay toggles
function setupOverlayListeners() {
    const overlayCheckboxes = [
        'toggle-temperature', 'toggle-wind_speed', 'toggle-pm25'
    ];
    
    overlayCheckboxes.forEach(id => {
        const checkbox = document.getElementById(id);
        if (checkbox) {
            checkbox.addEventListener('change', function() {
                const variable = id.replace('toggle-', '');
                if (this.checked) {
                    activeOverlays.add(variable);
                } else {
                    activeOverlays.delete(variable);
                }
                updateAllHeatmaps();
                updateOverlayVisualState();
            });
        }
    });
}

// Function to get temperature color
function getTempColor(temp) {
    if (temp < 25) return "#00ff00"; // Green
    if (temp < 30) return "#ffff00"; // Yellow
    if (temp < 35) return "#ff8800"; // Orange
    return "#ff0000"; // Red
}

// Function to add test markers
function addTestMarkers() {
    // Remove any existing markers first
    testMarkerObjects.forEach(m => m.remove());
    testMarkerObjects = [];
    
    testMarkers.forEach(marker => {
        const [lat, lng] = marker.location.split(',').map(Number);
        const color = getTempColor(marker.temperature);
        
        const popupHtml = `
            <div style="background:${color};padding:12px;border-radius:8px;color:#222;min-width:200px;">
                <strong style="font-size:14px;">${marker.name}</strong><br>
                🌡️ Temp: ${marker.temperature} °C<br>
                💨 Wind: ${marker.wind_speed} km/h<br>
                🌫️ PM2.5: ${marker.pm25} µg/m³<br>
                📍 State: ${marker.state}
            </div>
        `;
        
        const m = new mapboxgl.Marker({
            color: color,
            scale: 0.8
        })
        .setLngLat([lng, lat])
        .setPopup(new mapboxgl.Popup().setHTML(popupHtml))
        .addTo(map);
        
        testMarkerObjects.push(m);
    });
}

// Function to remove test markers
function removeTestMarkers() {
    testMarkerObjects.forEach(m => m.remove());
    testMarkerObjects = [];
}

// Wind field functions
let windArrowLayerId = 'wind-arrows';
function addWindField() {
    const features = testMarkers.map(marker => {
        const [lat, lng] = marker.location.split(',').map(Number);
        const direction = Math.random() * 360;
        const length = 0.5 + marker.wind_speed / 20;
        const rad = direction * Math.PI / 180;
        const dx = Math.cos(rad) * length / 100;
        const dy = Math.sin(rad) * length / 100;
        return {
            type: 'Feature',
            geometry: {
                type: 'LineString',
                coordinates: [
                    [lng, lat],
                    [lng + dx, lat + dy]
                ]
            },
            properties: {
                wind_speed: marker.wind_speed,
                direction: direction
            }
        };
    });
    
    if (map.getSource('wind-arrows')) {
        map.removeLayer(windArrowLayerId);
        map.removeSource('wind-arrows');
    }
    
    map.addSource('wind-arrows', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features }
    });
    
    map.addLayer({
        id: windArrowLayerId,
        type: 'line',
        source: 'wind-arrows',
        layout: {
            'line-cap': 'round',
            'line-join': 'round'
        },
        paint: {
            'line-color': '#00bfff',
            'line-width': 3
        }
    });
}

function removeWindField() {
    if (map.getLayer(windArrowLayerId)) map.removeLayer(windArrowLayerId);
    if (map.getSource('wind-arrows')) map.removeSource('wind-arrows');
}

// Temperature isolines functions
let isolinesLayerId = 'temp-isolines';
function addTemperatureIsolines() {
    const groups = {};
    testMarkers.forEach(marker => {
        const group = Math.round(marker.temperature / 5) * 5;
        if (!groups[group]) groups[group] = [];
        groups[group].push(marker);
    });
    
    const features = Object.values(groups).map(markers => {
        if (markers.length < 2) return null;
        return {
            type: 'Feature',
            geometry: {
                type: 'LineString',
                coordinates: markers.map(m => {
                    const [lat, lng] = m.location.split(',').map(Number);
                    return [lng, lat];
                })
            },
            properties: {}
        };
    }).filter(Boolean);
    
    if (map.getSource('temp-isolines')) {
        map.removeLayer(isolinesLayerId);
        map.removeSource('temp-isolines');
    }
    
    map.addSource('temp-isolines', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features }
    });
    
    map.addLayer({
        id: isolinesLayerId,
        type: 'line',
        source: 'temp-isolines',
        layout: {
            'line-cap': 'round',
            'line-join': 'round'
        },
        paint: {
            'line-color': '#ff8800',
            'line-width': 2,
            'line-dasharray': [2,2]
        }
    });
}

function removeTemperatureIsolines() {
    if (map.getLayer(isolinesLayerId)) map.removeLayer(isolinesLayerId);
    if (map.getSource('temp-isolines')) map.removeSource('temp-isolines');
}

// Time control functions
function updateTimeSlider() {
    const timeSlider = document.getElementById('time-slider');
    if (!timeSlider) return;
    
    const times = Array.from(new Set(allData.map(d => d.date))).sort();
    timeSlider.max = times.length - 1;
    timeSlider.value = currentTimeIndex;
    timeSlider.dataset.times = JSON.stringify(times);
    document.getElementById('time-label').textContent = times[currentTimeIndex] || '';
}

function updateDataForCurrentTime() {
    const timeSlider = document.getElementById('time-slider');
    if (!timeSlider) return;
    
    const times = JSON.parse(timeSlider.dataset.times || '[]');
    const currentTime = times[currentTimeIndex];
    climateData = allData.filter(d => d.date === currentTime);
    updateAllHeatmaps();
    document.getElementById('time-label').textContent = currentTime || '';
}

// Initialize everything when map loads
map.on('load', () => {
    // Load data from CSV
    loadData();
    
    // Setup overlay listeners
    setupOverlayListeners();
    
    // Add test markers
    addTestMarkers();
    
    // Initialize with temperature heatmap
    updateAllHeatmaps();
    updateOverlayVisualState();
    
    // Setup additional event listeners
    setupAdditionalListeners();
});

// Setup additional event listeners
function setupAdditionalListeners() {
    // Marker toggle
    const markerCheckbox = document.getElementById('toggle-markers-checkbox');
    if (markerCheckbox) {
        markerCheckbox.addEventListener('change', function() {
            if (this.checked) {
                addTestMarkers();
            } else {
                removeTestMarkers();
            }
        });
    }
    
    // Wind field toggle
    const windCheckbox = document.getElementById('toggle-wind-checkbox');
    if (windCheckbox) {
        windCheckbox.addEventListener('change', function() {
            if (this.checked) {
                addWindField();
            } else {
                removeWindField();
            }
        });
    }
    
    // Isolines toggle
    const isolinesCheckbox = document.getElementById('toggle-isolines-checkbox');
    if (isolinesCheckbox) {
        isolinesCheckbox.addEventListener('change', function() {
            if (this.checked) {
                addTemperatureIsolines();
            } else {
                removeTemperatureIsolines();
            }
        });
    }
    
    // Time slider
    const timeSlider = document.getElementById('time-slider');
    if (timeSlider) {
        timeSlider.addEventListener('input', function(e) {
            currentTimeIndex = parseInt(e.target.value);
            updateDataForCurrentTime();
        });
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    setupOverlayListeners();
    updateOverlayVisualState();
});