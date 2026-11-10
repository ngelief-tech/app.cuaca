# SkyWeather — Professional Weather Forecast Web Application

SkyWeather is a clean, modern, and responsive weather forecast application built with vanilla web technologies. It provides real-time weather data, hourly forecasts, and 7-day forecasts for cities worldwide using the free Open-Meteo public API.

## Features

### Dashboard
- Application branding with logo
- City search with autocomplete suggestions (up to 5 results)
- Current location, date, and local time display (live clock)
- Current temperature in Celsius or Fahrenheit
- Weather condition description and icon
- Feels-like temperature
- Last updated timestamp

### Current Weather Details
- Temperature
- Humidity
- Wind speed
- Precipitation
- Weather condition
- Day / night status

### Hourly Forecast
- Horizontally scrollable cards showing the next 24 hours
- Hour label, weather icon, temperature, and rain probability

### 7-Day Forecast
- Day name and date
- Weather icon and description
- Maximum and minimum temperatures
- Daily precipitation probability

### Additional Information
- Sunrise time
- Sunset time
- UV index with severity level
- Daily precipitation probability

### Search
- Search cities by name worldwide
- Up to five matching suggestions with country and administrative region
- Handles cities with identical names by showing disambiguation info
- Enter key support for quick selection

### User Experience
- Celsius / Fahrenheit toggle (re-renders all temperatures instantly)
- Refresh button to re-fetch weather data
- Automatic location detection via browser Geolocation API
- Default location set to Jakarta, Indonesia when geolocation is unavailable
- Loading and error states with retry option
- Fully responsive for desktop, tablet, and mobile

## Technology Stack

| Technology | Purpose |
|---|---|
| HTML5 | Semantic page structure |
| CSS3 | Styling, responsive layouts, animations |
| Vanilla JavaScript (ES6+) | Application logic and state management |
| Fetch API | HTTP requests to weather APIs |
| Open-Meteo API | Weather data provider (no API key required) |

No frameworks, no build tools, no backend required.

## Project Structure

```
SkyWeather/
│
├── index.html          # Main application structure
├── css/
│   └── style.css       # All styling and responsive layouts
├── js/
│   ├── app.js          # Application initialization and event listeners
│   ├── weather.js      # API requests, geocoding, weather data processing
│   └── ui.js           # DOM rendering and UI updates
└── README.md           # This file
```

### File Responsibilities

- **index.html** — Semantic HTML structure with header (logo, search, controls), main dashboard sections, and footer.
- **css/style.css** — CSS variables for theming, card-based layout, responsive grid, hourly scroll, and breakpoints for tablet/mobile.
- **js/weather.js** — `WeatherAPI` module: API endpoints, weather code mapping (WMO standard), SVG weather icons, geocoding search, forecast fetching, and helper functions (temperature conversion, time formatting, UV levels).
- **js/ui.js** — `UI` module: DOM element caching, loading/error states, rendering functions for current weather, details grid, hourly forecast, daily forecast, additional info, search suggestions, and live clock.
- **js/app.js** — `App` module: state management, event listeners (search, unit toggle, refresh, geolocation), debounced search, city selection, weather loading, and initialization.

## Installation & Running

### Option 1: VS Code Live Server (Recommended)

1. Open the `SkyWeather` folder in VS Code.
2. Install the **Live Server** extension by Ritwick Dey (if not already installed).
3. Right-click `index.html` and select **Open with Live Server**, or click the "Go Live" button in the status bar.
4. The application will open in your default browser at `http://127.0.0.1:5500`.

### Option 2: Direct File Access

1. Navigate to the `SkyWeather` folder.
2. Double-click `index.html` to open it in your web browser.

### Option 3: Any Static File Server

Serve the `SkyWeather` directory with any static file server:

```bash
# Python
python -m http.server 8000

# Node.js (with http-server)
npx http-server -p 8000
```

Then open `http://localhost:8000` in your browser.

## How the API Works

SkyWeather uses the [Open-Meteo](https://open-meteo.com/) public API, which is free for non-commercial use and requires no API key.

### 1. Geocoding API (City Search)

```
GET https://geocoding-api.open-meteo.com/v1/search?name={CITY}&count=5&language=en&format=json
```

Searches for cities by name. Returns up to 5 results including city name, country, latitude, longitude, timezone, and administrative region. Used to power the search autocomplete and to get coordinates for the forecast API.

### 2. Weather Forecast API

```
GET https://api.open-meteo.com/v1/forecast?latitude={LAT}&longitude={LON}&current=...&hourly=...&daily=...&timezone=auto&forecast_days=7
```

Fetches comprehensive weather data:

- **current**: temperature, humidity, apparent temperature, day/night flag, precipitation, weather code, wind speed
- **hourly**: temperature, humidity, precipitation probability, weather code, wind speed (for 7 days × 24 hours)
- **daily**: weather code, max/min temperature, sunrise, sunset, precipitation probability, UV index (for 7 days)

The API automatically detects the timezone based on coordinates when `timezone=auto` is specified.

### Weather Codes

SkyWeather maps WMO (World Meteorological Organization) weather codes from the API to human-readable descriptions and appropriate SVG icons. Supported conditions include: clear sky, mainly clear, partly cloudy, overcast, fog, drizzle, rain, snow, rain showers, snow showers, and thunderstorms. Day/night variants are used for clear and partly cloudy conditions.

## Summary of Implemented Features

- [x] Professional weather dashboard with branding
- [x] City search with autocomplete (up to 5 suggestions)
- [x] Current weather with temperature, condition, icon, feels-like, last updated
- [x] Weather details grid (temperature, humidity, wind, precipitation, condition, day/night)
- [x] Hourly forecast (24 hours, horizontally scrollable)
- [x] 7-day forecast with day, date, icon, description, max/min temp, rain probability
- [x] Additional info: sunrise, sunset, UV index, precipitation probability
- [x] Celsius / Fahrenheit toggle
- [x] Refresh weather button
- [x] Browser geolocation with Jakarta fallback
- [x] Loading and error states with retry
- [x] Responsive design (desktop, tablet, mobile)
- [x] Modular JavaScript (separate API, UI, and controller modules)
- [x] Async/await with try/catch error handling
- [x] WMO weather code mapping with descriptions and icons
- [x] No inline CSS or JavaScript
- [x] All interactive features fully functional

## Data Attribution

All weather information displayed in SkyWeather comes from the real Open-Meteo API response. No weather data is hardcoded or simulated. The application fetches live data on every load and refresh.
