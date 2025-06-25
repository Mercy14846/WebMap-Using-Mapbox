# WebMap-Using-Mapbox

## Overview

WebMap-Using-Mapbox is an interactive web application for visualizing climate data (temperature, humidity, wind speed, precipitation) on a world map using Mapbox GL JS. Users can upload their own CSV files or connect to a real-time API to display heatmaps and station markers for climate monitoring and analysis.

## Features
- **Mapbox-based Visualization:** Interactive world map with pan, zoom, and dark/light basemaps.
- **Heatmap Rendering:** Visualize temperature, humidity, wind speed, or precipitation as a heatmap.
- **Custom Data Upload:** Upload your own climate data in CSV format.
- **Time Slider:** Explore data over time using a slider.
- **Station Markers:** Clickable markers show station details and climate values.
- **Legend & Controls:** Dynamic legend and controls for data type, heatmap radius, and intensity.

## Demo
Open `index.html` in your browser. You will see a map and controls to upload data and adjust visualization parameters.

## Installation & Setup
1. **Clone or Download** this repository.
2. **Mapbox Access Token:**
   - Get a free access token from [Mapbox](https://account.mapbox.com/access-tokens/).
   - Open `app.js` and replace the value of `mapboxgl.accessToken` with your token.
3. **Run Locally:**
   - No build step is required. Simply open `index.html` in your browser.
   - For full functionality (e.g., file uploads), you may need to serve the files via a local web server (e.g., `python -m http.server`).

## Usage
1. **Upload CSV:** Click the "Upload CSV" button and select a file matching the format below.
2. **Select Data Type:** Choose which climate variable to visualize.
3. **Adjust Heatmap:** Use the radius and intensity sliders to tune the heatmap.
4. **Time Slider:** Move the slider to view data at different time points (if available).
5. **Station Markers:** Click markers for detailed station info.

## CSV Format
- The CSV should include latitude and longitude in the header comments, e.g.:
  ```csv
  # latitude: 6.462167
  # longitude: 3.551078
  date,temperature (°C),pressure (hPa),rain (mm/hr),humidity (%)
  2025-06-22 00:00:00,26.97,1014.00,0.00,87.75
  ...
  ```
- Required columns: `date`, `temperature (°C)`, `humidity (%)`, `rain (mm/hr)`
- Optional: `wind_speed` (if present, will be visualized)

## Dependencies
- [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/)
- [PapaParse](https://www.papaparse.com/) (for CSV parsing)
- [deck.gl](https://deck.gl/) (optional, included in HTML)

All dependencies are loaded via CDN in `index.html`.

## Real-Time Data (Optional)
- To use real-time data, set your API endpoint in `app.js` (`API_URL`).
- The API should return an array of objects with: `lat`, `lng`, `date`, `temperature`, `humidity`, `wind_speed`, `precipitation`.

## License
This project does not currently include a license file. Please add one if you intend to share or distribute this code.