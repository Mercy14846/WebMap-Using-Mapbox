// Replace with your Mapbox access token
mapboxgl.accessToken = 'pk.eyJ1IjoibWVyY3ljaWEiLCJhIjoiY202cW03eTA0MW13NDJtczRnOXdlbXEwYSJ9.K8g2wopw3X6Jw5hdomJ4lQ';

// Initialize the map
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/dark-v10',
    center: [13, 5.0472], // Default center
    zoom: 3
});

// Add navigation controls
map.addControl(new mapboxgl.NavigationControl());

// Store our API endpoint
const API_URL = 'YOUR_REALTIME_API_ENDPOINT_HERE'; // <-- Replace with your real API endpoint

// Variables to store our data and layers
let climateData = [];
let allData = [];
let heatmapLayer = null;
let currentTimeIndex = 0;
let timer = null;
let stationMarkers = [];

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
    updateHeatmap();
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

// Event listeners for controls
if (document.getElementById('data-type'))
    document.getElementById('data-type').addEventListener('change', updateHeatmap);
if (document.getElementById('radius'))
    document.getElementById('radius').addEventListener('input', updateHeatmap);
if (document.getElementById('intensity'))
    document.getElementById('intensity').addEventListener('input', updateHeatmap);
if (document.getElementById('time-slider'))
    document.getElementById('time-slider').addEventListener('input', function(e) {
        currentTimeIndex = parseInt(e.target.value);
        updateDataForCurrentTime();
    });

// On map load, fetch data and start timer
map.on('load', () => {
    fetchDataFromAPI();
    startRealtimeUpdates();
    addTestMarkers();
    updateTestHeatmap("temperature");
});

const testMarkers = [
  {
    name: "LASEPA-008",
    location: "6.462088,3.550920",
    temperature: 28,
    wind_speed: 10,
    pm25: 35,
    state: "inactive"
  },
  {
    name: "LASEPA-001",
    location: "6.462155,3.550898",
    temperature: 32,
    wind_speed: 8,
    pm25: 50,
    state: "inactive"
  },
  {
    name: "LASEPA-010",
    location: "6.474743,3.611033",
    temperature: 36,
    wind_speed: 12,
    pm25: 80,
    state: "inactive"
  },
  {
    name: "LASEPA-007",
    location: "6.612907,3.360933",
    temperature: 41,
    wind_speed: 15,
    pm25: 120,
    state: "active"
  },
  // ...add more as needed
];

function getTempColor(temp) {
  if (temp < 30) return "green";
  if (temp < 35) return "yellow";
  if (temp < 40) return "orange";
  return "red";
}

function addTestMarkers() {
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
    new mapboxgl.Marker()
      .setLngLat([lng, lat])
      .setPopup(new mapboxgl.Popup().setHTML(popupHtml))
      .addTo(map);
  });
}

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
        0, 'blue',
        0.25, 'cyan',
        0.5, 'lime',
        0.75, 'yellow',
        1, 'red'
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
}