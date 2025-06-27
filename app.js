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
const API_URL = 'CIA_CIruVm9aOP_2025-06-22-2025-06-24.csv'; // Updated to use local CSV

// Variables to store our data and layers
let climateData = [];
let allData = [];
let heatmapLayers = {};
let currentTimeIndex = 0;
let timer = null;
let stationMarkers = [];
let activeOverlays = new Set(['temperature']); // Track active overlays

// Add more test markers in Africa
const testMarkers = [
  { name: "LASEPA-008", location: "6.462088,3.550920", temperature: 28, wind_speed: 10, pm25: 35, state: "inactive" },
  { name: "LASEPA-001", location: "6.462155,3.550898", temperature: 32, wind_speed: 8, pm25: 50, state: "inactive" },
  { name: "LASEPA-010", location: "6.474743,3.611033", temperature: 36, wind_speed: 12, pm25: 80, state: "inactive" },
  { name: "LASEPA-007", location: "6.612907,3.360933", temperature: 41, wind_speed: 15, pm25: 120, state: "active" },
  { name: "Nairobi-001", location: "-1.2921,36.8219", temperature: 25, wind_speed: 18, pm25: 60, state: "active" },
  { name: "Cairo-001", location: "30.0444,31.2357", temperature: 39, wind_speed: 22, pm25: 90, state: "active" },
  { name: "Johannesburg-001", location: "-26.2041,28.0473", temperature: 22, wind_speed: 20, pm25: 40, state: "inactive" },
  { name: "Dakar-001", location: "14.7167,-17.4677", temperature: 31, wind_speed: 14, pm25: 55, state: "active" },
  { name: "Accra-001", location: "5.6037,-0.1870", temperature: 29, wind_speed: 11, pm25: 45, state: "inactive" },
  { name: "Addis-001", location: "9.03,38.74", temperature: 20, wind_speed: 10, pm25: 30, state: "active" },
  { name: "Algiers-001", location: "36.7538,3.0588", temperature: 34, wind_speed: 16, pm25: 70, state: "inactive" },
  { name: "Casablanca-001", location: "33.5731,-7.5898", temperature: 27, wind_speed: 13, pm25: 38, state: "active" },
  { name: "Kampala-001", location: "0.3476,32.5825", temperature: 26, wind_speed: 9, pm25: 42, state: "inactive" },
  { name: "Tripoli-001", location: "32.8872,13.1913", temperature: 37, wind_speed: 19, pm25: 85, state: "active" },
  { name: "Khartoum-001", location: "15.5007,32.5599", temperature: 40, wind_speed: 21, pm25: 110, state: "active" },
  { name: "Tunis-001", location: "36.8065,10.1815", temperature: 33, wind_speed: 12, pm25: 60, state: "inactive" },
  { name: "Luanda-001", location: "-8.8390,13.2894", temperature: 29, wind_speed: 8, pm25: 50, state: "active" },
  { name: "Kinshasa-001", location: "-4.4419,15.2663", temperature: 30, wind_speed: 10, pm25: 55, state: "inactive" },
  { name: "Abuja-001", location: "9.0579,7.4951", temperature: 35, wind_speed: 17, pm25: 75, state: "active" },
  { name: "Marrakesh-001", location: "31.6295,-7.9811", temperature: 38, wind_speed: 15, pm25: 95, state: "inactive" },
  { name: "Bamako-001", location: "12.6392,-8.0029", temperature: 37, wind_speed: 13, pm25: 80, state: "active" },
  { name: "Libreville-001", location: "0.4162,9.4673", temperature: 28, wind_speed: 9, pm25: 40, state: "inactive" },
  { name: "Maputo-001", location: "-25.9692,32.5732", temperature: 24, wind_speed: 12, pm25: 35, state: "active" },
  { name: "Harare-001", location: "-17.8252,31.0335", temperature: 23, wind_speed: 10, pm25: 30, state: "inactive" },
  { name: "Gaborone-001", location: "-24.6282,25.9231", temperature: 27, wind_speed: 11, pm25: 38, state: "active" },
  { name: "Port Harcourt-001", location: "4.8156,7.0498", temperature: 33, wind_speed: 14, pm25: 70, state: "inactive" },
  { name: "Ouagadougou-001", location: "12.3714,-1.5197", temperature: 36, wind_speed: 15, pm25: 85, state: "active" },
  { name: "Lusaka-001", location: "-15.3875,28.3228", temperature: 25, wind_speed: 10, pm25: 32, state: "inactive" },
  { name: "Kigali-001", location: "-1.9706,30.1044", temperature: 22, wind_speed: 8, pm25: 28, state: "active" },
  { name: "Yaounde-001", location: "3.8480,11.5021", temperature: 29, wind_speed: 12, pm25: 45, state: "inactive" }
];

// Track marker objects for toggling
let testMarkerObjects = [];
let markersVisible = true;

// Color scales for each variable
const colorScales = {
  temperature: [
    0, 'blue',
    0.25, 'cyan',
    0.5, 'lime',
    0.75, 'yellow',
    1, 'red'
  ],
  pressure: [
    0, 'darkblue',
    0.25, 'blue',
    0.5, 'lightblue',
    0.75, 'white',
    1, 'yellow'
  ],
  rain: [
    0, 'transparent',
    0.25, 'lightblue',
    0.5, 'blue',
    0.75, 'darkblue',
    1, 'purple'
  ],
  humidity: [
    0, 'brown',
    0.25, 'yellow',
    0.5, 'lightblue',
    0.75, 'blue',
    1, 'darkblue'
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
  pressure: { min: 900, max: 1100 },
  rain: { min: 0, max: 100 },
  humidity: { min: 0, max: 100 },
  wind_speed: { min: 0, max: 50 },
  pm25: { min: 0, max: 200 }
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
                            pressure: parseFloat(row['pressure (hPa)']),
                            rain: parseFloat(row['rain (mm/hr)']),
                            humidity: parseFloat(row['humidity (%)']),
                            wind_speed: row['wind_speed'] ? parseFloat(row['wind_speed']) : 0,
                            precipitation: row['rain (mm/hr)'] ? parseFloat(row['rain (mm/hr)']) : 0
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
                for (let i = 0; i < 20; i++) {
                    for (let j = 0; j < 20; j++) {
                        const latOffset = (i - 10) * radiusDegrees / 10;
                        const lngOffset = (j - 10) * radiusDegrees / 10;
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
            for (let i = 0; i < 20; i++) {
                for (let j = 0; j < 20; j++) {
                    const latOffset = (i - 10) * radiusDegrees / 10;
                    const lngOffset = (j - 10) * radiusDegrees / 10;
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
    const radius = parseFloat(document.getElementById('radius').value);
    const intensity = parseInt(document.getElementById('intensity').value);
    
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
        const data = createHeatmapData(variable, radius);
        
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
                    'heatmap-intensity': intensity,
                    'heatmap-color': colorScales[variable],
                    'heatmap-radius': 30,
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
        temperature: 'Temperature (°C)',
        pressure: 'Pressure (hPa)',
        rain: 'Rainfall (mm/hr)',
        humidity: 'Humidity (%)',
        wind_speed: 'Wind Speed (km/h)',
        pm25: 'PM2.5 (µg/m³)'
    };
    return labels[variable] || variable;
}

// Event listeners for overlay toggles
function setupOverlayListeners() {
    const overlayCheckboxes = [
        'toggle-temperature', 'toggle-pressure', 'toggle-rain', 
        'toggle-humidity', 'toggle-wind_speed', 'toggle-pm25'
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
            });
        }
    });
    
    // Radius slider
    const radiusSlider = document.getElementById('radius');
    const radiusValue = document.getElementById('radius-value');
    if (radiusSlider && radiusValue) {
        radiusSlider.addEventListener('input', function() {
            radiusValue.textContent = this.value + ' km';
            updateAllHeatmaps();
        });
    }
    
    // Intensity slider
    const intensitySlider = document.getElementById('intensity');
    if (intensitySlider) {
        intensitySlider.addEventListener('input', function() {
            updateAllHeatmaps();
        });
    }
}

// Function to fetch real-time data from API
async function fetchDataFromAPI() {
    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        // Expecting data as array of objects with lat, lng, date, temperature, humidity, wind_speed, precipitation
        allData = data;
        updateTimeSlider();
        updateDataForCurrentTime();
    } catch (error) {
        console.error('Error fetching real-time data:', error);
    }
}

// Set up timer to reload data every 60 seconds
function startRealtimeUpdates() {
    if (timer) clearInterval(timer);
    timer = setInterval(fetchDataFromAPI, 60000); // 60 seconds
}

// Time slider setup
function updateTimeSlider() {
    const timeSlider = document.getElementById('time-slider');
    if (!timeSlider) return;
    // Get unique sorted times from allData
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
    updateStationMarkers();
    document.getElementById('time-label').textContent = currentTime || '';
}

// Add station markers with popups
function updateStationMarkers() {
    // Remove old markers
    stationMarkers.forEach(m => m.remove());
    stationMarkers = [];
    climateData.forEach(point => {
        const marker = new mapboxgl.Marker({ color: 'orange' })
            .setLngLat([point.lng, point.lat])
            .setPopup(new mapboxgl.Popup().setHTML(`
                <strong>Station</strong><br>
                Lat: ${point.lat}<br>
                Lng: ${point.lng}<br>
                Temp: ${point.temperature} °C<br>
                Humidity: ${point.humidity} %<br>
                Wind: ${point.wind_speed} km/h<br>
                Precip: ${point.precipitation} mm
                <br>Date: ${point.date}
            `))
            .addTo(map);
        stationMarkers.push(marker);
    });
}

// On map load, fetch data and start timer
map.on('load', () => {
    fetchDataFromAPI();
    startRealtimeUpdates();
    addTestMarkers();
    updateTestHeatmap("temperature");
});

// Add this function to convert testMarkers to GeoJSON
function getTestMarkersGeoJSON(selectedVar = "temperature") {
  return {
    type: "FeatureCollection",
    features: testMarkers.map(marker => {
      const [lat, lng] = marker.location.split(',').map(Number);
      return {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [lng, lat]
        },
        properties: {
          value: marker[selectedVar]
        }
      };
    })
  };
}

// Update this function to use testMarkers for the heatmap
function updateTestHeatmap(selectedVar = "temperature") {
  // Remove existing heatmap layer if it exists
  if (map.getLayer('heatmap-layer')) {
    map.removeLayer('heatmap-layer');
    map.removeSource('heatmap-source');
  }

  // Normalize values
  const values = testMarkers.map(m => m[selectedVar]);
  const min = Math.min(...values);
  const max = Math.max(...values);

  // Add the heatmap source and layer
  map.addSource('heatmap-source', {
    type: 'geojson',
    data: getTestMarkersGeoJSON(selectedVar)
  });

  map.addLayer({
    id: 'heatmap-layer',
    type: 'heatmap',
    source: 'heatmap-source',
    paint: {
      'heatmap-intensity': 1,
      'heatmap-color': [
        'interpolate',
        ['linear'],
        ['heatmap-density'],
        ...colorScales[selectedVar]
      ],
      'heatmap-radius': 30,
      'heatmap-opacity': 0.7,
      'heatmap-weight': [
        'interpolate',
        ['linear'],
        ['get', 'value'],
        min, 0,
        max, 1
      ]
    }
  });
  updateLegend(selectedVar, min, max);
}

// Update the legend dynamically
function updateLegend(selectedVar, min, max) {
  const legendContent = document.getElementById('legend-content');
  if (!legendContent) return;
  const units = {
    temperature: '°C',
    wind_speed: 'km/h',
    pm25: 'µg/m³'
  };
  const labels = {
    temperature: 'Temperature',
    wind_speed: 'Wind Speed',
    pm25: 'PM2.5'
  };
  const colors = colorScales[selectedVar].filter((_, i) => i % 2 === 1);
  const gradient = `linear-gradient(to right, ${colors.join(', ')})`;
  legendContent.innerHTML = `
    <div><strong>${labels[selectedVar]} (${units[selectedVar]})</strong></div>
    <div style="background: ${gradient}; height: 20px; width: 100%; margin-top: 5px; border-radius: 4px;"></div>
    <div style="display: flex; justify-content: space-between;">
      <span>${min}</span>
      <span>${max}</span>
    </div>
  `;
}

document.getElementById('heatmap-var').addEventListener('change', function(e) {
  updateTestHeatmap(e.target.value);
});

// --- Wind Field Overlay ---
let windArrowLayerId = 'wind-arrows';
function addWindField() {
  // Create GeoJSON for wind arrows
  const features = testMarkers.map(marker => {
    const [lat, lng] = marker.location.split(',').map(Number);
    // Use a random direction for demo (in degrees)
    const direction = marker.wind_dir !== undefined ? marker.wind_dir : Math.random() * 360;
    const length = 0.5 + marker.wind_speed / 20; // scale arrow length
    // Calculate arrow endpoint
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
  if (map.getSource('wind-arrows')) map.removeLayer(windArrowLayerId), map.removeSource('wind-arrows');
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

// --- Temperature Isolines Overlay (demo: connect similar temp markers) ---
let isolinesLayerId = 'temp-isolines';
function addTemperatureIsolines() {
  // Group markers by rounded temperature (e.g., every 5°C)
  const groups = {};
  testMarkers.forEach(marker => {
    const group = Math.round(marker.temperature / 5) * 5;
    if (!groups[group]) groups[group] = [];
    groups[group].push(marker);
  });
  // For each group, create a LineString connecting the points
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
  if (map.getSource('temp-isolines')) map.removeLayer(isolinesLayerId), map.removeSource('temp-isolines');
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

// --- Overlay checkbox handlers ---
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

// Function to get temperature color
function getTempColor(temp) {
  if (temp < 30) return "green";
  if (temp < 35) return "yellow";
  if (temp < 40) return "orange";
  return "red";
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
      <div style="background:${color};padding:8px;border-radius:6px;color:#222;">
        <strong>${marker.name}</strong><br>
        Temp: ${marker.temperature} °C<br>
        Wind: ${marker.wind_speed} km/h<br>
        PM2.5: ${marker.pm25} µg/m³<br>
        State: ${marker.state}
      </div>
    `;
    const m = new mapboxgl.Marker()
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

// Attach toggle to checkbox
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

// Time slider event listener
const timeSlider = document.getElementById('time-slider');
if (timeSlider) {
  timeSlider.addEventListener('input', function(e) {
    currentTimeIndex = parseInt(e.target.value);
    updateDataForCurrentTime();
  });
}

// Variable selector event listener
const heatmapVarSelect = document.getElementById('heatmap-var');
if (heatmapVarSelect) {
  heatmapVarSelect.addEventListener('change', function(e) {
    const selectedVar = e.target.value;
    // Update active overlays to only include the selected variable
    activeOverlays.clear();
    activeOverlays.add(selectedVar);
    
    // Update checkboxes
    const checkboxes = ['toggle-temperature', 'toggle-pressure', 'toggle-rain', 
                       'toggle-humidity', 'toggle-wind_speed', 'toggle-pm25'];
    checkboxes.forEach(id => {
      const checkbox = document.getElementById(id);
      if (checkbox) {
        checkbox.checked = id === `toggle-${selectedVar}`;
      }
    });
    
    updateAllHeatmaps();
  });
}

// On map load, initialize everything
map.on('load', () => {
    // Load data from CSV
    loadData();
    
    // Setup overlay listeners
    setupOverlayListeners();
    
    // Add test markers
    addTestMarkers();
    
    // Initialize with temperature heatmap
    updateAllHeatmaps();
    
    // Start realtime updates if needed
    startRealtimeUpdates();
});

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Setup overlay listeners
    setupOverlayListeners();
    
    // Initialize radius value display
    const radiusSlider = document.getElementById('radius');
    const radiusValue = document.getElementById('radius-value');
    if (radiusSlider && radiusValue) {
        radiusValue.textContent = radiusSlider.value + ' km';
    }
});