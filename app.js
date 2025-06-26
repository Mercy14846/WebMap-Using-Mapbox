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
const API_URL = 'YOUR_REALTIME_API_ENDPOINT_HERE'; // <-- Replace with your real API endpoint

// Variables to store our data and layers
let climateData = [];
let allData = [];
let heatmapLayer = null;
let currentTimeIndex = 0;
let timer = null;
let stationMarkers = [];

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
  // Additional markers
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

function getTempColor(temp) {
  if (temp < 30) return "green";
  if (temp < 35) return "yellow";
  if (temp < 40) return "orange";
  return "red";
}

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

function removeTestMarkers() {
  testMarkerObjects.forEach(m => m.remove());
  testMarkerObjects = [];
}

function toggleTestMarkers() {
  if (markersVisible) {
    removeTestMarkers();
    document.getElementById('toggle-markers-btn').textContent = 'Show Markers';
  } else {
    addTestMarkers();
    document.getElementById('toggle-markers-btn').textContent = 'Hide Markers';
  }
  markersVisible = !markersVisible;
}

// Attach toggle to button
if (document.getElementById('toggle-markers-btn')) {
  document.getElementById('toggle-markers-btn').addEventListener('click', toggleTestMarkers);
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