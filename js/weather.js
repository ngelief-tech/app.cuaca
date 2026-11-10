/* ============================================================
   SkyWeather — Weather API Module
   File: weather.js
   Responsibility: API requests, geocoding, weather data
                  processing, weather code mapping, and icons.
   ============================================================ */

const WeatherAPI = (function () {
    'use strict';

    /* ---------- API Endpoints ---------- */
    const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';
    const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';

    /* ---------- Weather Code Mapping (WMO Standard) ---------- */
    const WEATHER_CODES = {
        0:  { description: 'Clear sky',                  icon: 'clear' },
        1:  { description: 'Mainly clear',                icon: 'clear' },
        2:  { description: 'Partly cloudy',               icon: 'partlyCloudy' },
        3:  { description: 'Overcast',                    icon: 'cloudy' },
        45: { description: 'Fog',                         icon: 'fog' },
        48: { description: 'Depositing rime fog',         icon: 'fog' },
        51: { description: 'Light drizzle',               icon: 'drizzle' },
        53: { description: 'Moderate drizzle',            icon: 'drizzle' },
        55: { description: 'Dense drizzle',                icon: 'drizzle' },
        56: { description: 'Light freezing drizzle',     icon: 'drizzle' },
        57: { description: 'Dense freezing drizzle',     icon: 'drizzle' },
        61: { description: 'Slight rain',                 icon: 'rain' },
        63: { description: 'Moderate rain',               icon: 'rain' },
        65: { description: 'Heavy rain',                  icon: 'rain' },
        66: { description: 'Light freezing rain',         icon: 'rain' },
        67: { description: 'Heavy freezing rain',         icon: 'rain' },
        71: { description: 'Slight snow',                 icon: 'snow' },
        73: { description: 'Moderate snow',               icon: 'snow' },
        75: { description: 'Heavy snow',                  icon: 'snow' },
        77: { description: 'Snow grains',                 icon: 'snow' },
        80: { description: 'Slight rain showers',        icon: 'showers' },
        81: { description: 'Moderate rain showers',      icon: 'showers' },
        82: { description: 'Violent rain showers',        icon: 'showers' },
        85: { description: 'Slight snow showers',        icon: 'snowShowers' },
        86: { description: 'Heavy snow showers',         icon: 'snowShowers' },
        95: { description: 'Thunderstorm',                icon: 'thunderstorm' },
        96: { description: 'Thunderstorm with slight hail', icon: 'thunderstorm' },
        99: { description: 'Thunderstorm with heavy hail', icon: 'thunderstorm' },
    };

    /* ---------- Weather Condition SVG Icons ---------- */

    /**
     * Helper to wrap SVG content with consistent attributes.
     */
    function svg(content, className) {
        return `<svg class="wi ${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${content}</svg>`;
    }

    const ICONS = {
        /* Clear sky — day */
        clear_day: svg(
            '<circle cx="12" cy="12" r="4"/>' +
            '<path d="M12 2v2"/><path d="M12 20v2"/>' +
            '<path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/>' +
            '<path d="M2 12h2"/><path d="M20 12h2"/>' +
            '<path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>',
            'wi-sunny'
        ),

        /* Clear sky — night */
        clear_night: svg(
            '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>',
            'wi-night'
        ),

        /* Partly cloudy — day */
        partly_cloudy_day: svg(
            '<path d="M11 1v2"/><path d="m4.6 4.6 1.4 1.4"/>' +
            '<path d="M1 9h2"/><path d="m15.4 4.6-1.4 1.4"/>' +
            '<circle cx="10" cy="8" r="2.5"/>' +
            '<path d="M18 14h-1.26A4 4 0 1 0 13 20h5a3 3 0 0 0 0-6z"/>',
            'wi-day-cloudy'
        ),

        /* Partly cloudy — night */
        partly_cloudy_night: svg(
            '<path d="M9 2.5A5 5 0 1 0 9 12.5 4 4 0 0 1 9 2.5z"/>' +
            '<path d="M18 14h-1.26A4 4 0 1 0 13 20h5a3 3 0 0 0 0-6z"/>',
            'wi-night-cloudy'
        ),

        /* Cloudy / Overcast */
        cloudy: svg(
            '<path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>',
            'wi-cloudy'
        ),

        /* Fog */
        fog: svg(
            '<path d="M16 6h-1A5 5 0 1 0 9 14h7a3.5 3.5 0 0 0 0-7z"/>' +
            '<path d="M4 17h16"/><path d="M6 20h12"/>',
            'wi-fog'
        ),

        /* Drizzle */
        drizzle: svg(
            '<path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>' +
            '<path d="M8 19v1"/><path d="M12 19v2"/><path d="M16 19v1"/>',
            'wi-drizzle'
        ),

        /* Rain */
        rain: svg(
            '<path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>' +
            '<path d="M8 18l-1 2"/><path d="M12 18l-1 3"/><path d="M16 18l-1 2"/>',
            'wi-rain'
        ),

        /* Snow */
        snow: svg(
            '<path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>' +
            '<path d="M8 20h.01"/><path d="M12 20h.01"/><path d="M16 20h.01"/>' +
            '<path d="M10 22h.01"/><path d="M14 22h.01"/>',
            'wi-snow'
        ),

        /* Rain showers */
        showers: svg(
            '<path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>' +
            '<path d="M7 22l-1-1"/><path d="M11 22l-1-1"/><path d="M15 22l-1-1"/>',
            'wi-rain'
        ),

        /* Snow showers */
        snowShowers: svg(
            '<path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>' +
            '<path d="M8 21h.01"/><path d="M12 21h.01"/><path d="M16 21h.01"/>',
            'wi-snow'
        ),

        /* Thunderstorm */
        thunderstorm: svg(
            '<path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>' +
            '<path d="M12 14l-2 4h3l-2 4"/>',
            'wi-thunderstorm'
        ),
    };

    /* ---------- Detail / Utility SVG Icons ---------- */
    const DETAIL_ICONS = {
        thermometer: svg('<path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/>', ''),
        droplet: svg('<path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>', ''),
        wind: svg('<path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"/>', ''),
        rainSmall: svg('<path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/><path d="M8 18l-1 2M12 18l-1 3M16 18l-1 2"/>', ''),
        sunrise: svg('<path d="M17 18a5 5 0 0 0-10 0"/><path d="M12 2v7"/><path d="m4.22 10.22 1.42 1.42"/><path d="M1 18h2"/><path d="M21 18h2"/><path d="m18.36 11.64 1.42-1.42"/><path d="M23 22H1"/><path d="m8 6 4-4 4 4"/>', ''),
        sunset: svg('<path d="M17 18a5 5 0 0 0-10 0"/><path d="M12 9V2"/><path d="m4.22 10.22 1.42 1.42"/><path d="M1 18h2"/><path d="M21 18h2"/><path d="m18.36 11.64 1.42-1.42"/><path d="M23 22H1"/><path d="m16 5-4 4-4-4"/>', ''),
        uv: svg('<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>', ''),
        cloud: svg('<path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>', ''),
        sunSmall: svg('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>', ''),
        moonSmall: svg('<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>', ''),
        percent: svg('<line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>', ''),
    };

    /* ---------- Public API Methods ---------- */

    /**
     * Search cities by name using the Open-Meteo Geocoding API.
     * @param {string} name — City name to search for.
     * @returns {Promise<Array>} Array of city result objects.
     */
    async function searchCity(name) {
        if (!name || name.trim().length < 2) {
            return [];
        }

        const url = `${GEOCODING_URL}?name=${encodeURIComponent(name.trim())}&count=5&language=en&format=json`;

        try {
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Geocoding API error: ${response.status}`);
            }

            const data = await response.json();

            if (!data.results || data.results.length === 0) {
                return [];
            }

            return data.results;
        } catch (error) {
            console.error('Geocoding error:', error);
            throw error;
        }
    }

    /**
     * Fetch weather forecast data from the Open-Meteo Forecast API.
     * @param {number} latitude — City latitude.
     * @param {number} longitude — City longitude.
     * @returns {Promise<Object>} Weather data object containing current, hourly, and daily data.
     */
    async function fetchWeather(latitude, longitude) {
        const params = new URLSearchParams({
            latitude: latitude.toString(),
            longitude: longitude.toString(),
            current: 'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m',
            hourly: 'temperature_2m,relative_humidity_2m,precipitation_probability,weather_code,wind_speed_10m',
            daily: 'weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max,uv_index_max',
            timezone: 'auto',
            forecast_days: '7',
        });

        const url = `${FORECAST_URL}?${params.toString()}`;

        try {
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Forecast API error: ${response.status}`);
            }

            const data = await response.json();

            if (!data.current || !data.hourly || !data.daily) {
                throw new Error('Incomplete weather data received from API.');
            }

            return data;
        } catch (error) {
            console.error('Forecast error:', error);
            throw error;
        }
    }

    /**
     * Get weather description and SVG icon for a weather code.
     * @param {number} code — WMO weather code from the API.
     * @param {number|null} isDay — 1 for day, 0 for night, null for unknown.
     * @returns {Object} { description: string, icon: string (SVG markup) }
     */
    function getWeatherInfo(code, isDay) {
        const info = WEATHER_CODES[code] || { description: 'Unknown', icon: 'cloudy' };
        const day = isDay !== 0; // Treat null/1 as day

        let iconKey;
        switch (info.icon) {
            case 'clear':
                iconKey = day ? 'clear_day' : 'clear_night';
                break;
            case 'partlyCloudy':
                iconKey = day ? 'partly_cloudy_day' : 'partly_cloudy_night';
                break;
            default:
                iconKey = info.icon;
                break;
        }

        return {
            description: info.description,
            icon: ICONS[iconKey] || ICONS.cloudy,
        };
    }

    /* ---------- Helper Functions ---------- */

    /**
     * Convert temperature between Celsius and Fahrenheit.
     * @param {number} celsius — Temperature in Celsius (from API).
     * @param {string} unit — Target unit: 'C' or 'F'.
     * @returns {number} Converted temperature (rounded).
     */
    function convertTemp(celsius, unit) {
        if (celsius === null || celsius === undefined) return null;
        if (unit === 'F') {
            return Math.round(celsius * 9 / 5 + 32);
        }
        return Math.round(celsius);
    }

    /**
     * Format a temperature value with the unit symbol.
     * @param {number} celsius — Temperature in Celsius.
     * @param {string} unit — 'C' or 'F'.
     * @returns {string} Formatted temperature string (e.g. "30°C").
     */
    function formatTemp(celsius, unit) {
        const temp = convertTemp(celsius, unit);
        if (temp === null) return '—';
        return `${temp}°${unit}`;
    }

    /**
     * Format an hour from an ISO time string (without timezone offset).
     * @param {string} timeStr — e.g. "2024-01-15T14:00"
     * @returns {string} Formatted hour (e.g. "2 PM").
     */
    function formatHour(timeStr) {
        if (!timeStr) return '—';
        const hour = parseInt(timeStr.split('T')[1].split(':')[0], 10);
        const period = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour === 0 ? 12 : (hour > 12 ? hour - 12 : hour);
        return `${displayHour} ${period}`;
    }

    /**
     * Format a time string (for sunrise/sunset).
     * @param {string} timeStr — e.g. "2024-01-15T05:30"
     * @returns {string} Formatted time (e.g. "5:30 AM").
     */
    function formatTime(timeStr) {
        if (!timeStr) return '—';
        const parts = timeStr.split('T')[1].split(':');
        const hour = parseInt(parts[0], 10);
        const minute = parts[1];
        const period = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour === 0 ? 12 : (hour > 12 ? hour - 12 : hour);
        return `${displayHour}:${minute} ${period}`;
    }

    /**
     * Get the short day name from a date string.
     * @param {string} dateStr — e.g. "2024-01-15"
     * @returns {string} Day name (e.g. "Mon").
     */
    function formatDayName(dateStr) {
        if (!dateStr) return '—';
        const date = new Date(dateStr + 'T00:00:00');
        return date.toLocaleDateString('en-US', { weekday: 'short' });
    }

    /**
     * Get the formatted date from a date string.
     * @param {string} dateStr — e.g. "2024-01-15"
     * @returns {string} Formatted date (e.g. "Jan 15").
     */
    function formatDate(dateStr) {
        if (!dateStr) return '—';
        const date = new Date(dateStr + 'T00:00:00');
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    /**
     * Determine the UV index level description.
     * @param {number|null} uvIndex — UV index value from the API.
     * @returns {Object} { level: string, color: string }
     */
    function getUVLevel(uvIndex) {
        if (uvIndex === null || uvIndex === undefined) {
            return { level: 'Unknown', color: '#94a3b8' };
        }
        if (uvIndex < 3) return { level: 'Low', color: '#22c55e' };
        if (uvIndex < 6) return { level: 'Moderate', color: '#eab308' };
        if (uvIndex < 8) return { level: 'High', color: '#f97316' };
        if (uvIndex < 11) return { level: 'Very High', color: '#ef4444' };
        return { level: 'Extreme', color: '#a855f7' };
    }

    /**
     * Get the current date and time formatted for a given timezone.
     * @param {string} timezone — IANA timezone string (e.g. "Asia/Jakarta").
     * @returns {Object} { date: string, time: string }
     */
    function getLocalDateTime(timezone) {
        const options = timezone
            ? { timeZone: timezone }
            : {};

        const now = new Date();

        const dateStr = now.toLocaleDateString('en-US', {
            ...options,
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
        });

        const timeStr = now.toLocaleTimeString('en-US', {
            ...options,
            hour: 'numeric',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
        });

        return { date: dateStr, time: timeStr };
    }

    /**
     * Format the "last updated" timestamp using the user's local time.
     * @returns {string} Formatted time (e.g. "2:30 PM").
     */
    function getLastUpdated() {
        return new Date().toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        });
    }

    /**
     * Determine if a given hour time string represents daytime
     * based on the daily sunrise/sunset data.
     * @param {string} hourTimeStr — e.g. "2024-01-15T14:00"
     * @param {Object} daily — Daily forecast data from the API.
     * @returns {boolean} True if daytime, false if night.
     */
    function isDaytimeHour(hourTimeStr, daily) {
        if (!hourTimeStr || !daily) return true;

        const date = hourTimeStr.split('T')[0];
        const hour = parseInt(hourTimeStr.split('T')[1].split(':')[0], 10);

        const dayIndex = daily.time.findIndex(d => d === date);

        if (dayIndex === -1 || !daily.sunrise || !daily.sunset) {
            // Fallback: use 6 AM – 6 PM rule
            return hour >= 6 && hour < 18;
        }

        const sunriseHour = parseInt(daily.sunrise[dayIndex].split('T')[1].split(':')[0], 10);
        const sunsetHour = parseInt(daily.sunset[dayIndex].split('T')[1].split(':')[0], 10);

        return hour >= sunriseHour && hour < sunsetHour;
    }

    /**
     * Find the index in the hourly time array that corresponds to
     * the current weather time.
     * @param {Array} hourlyTimes — Array of ISO time strings.
     * @param {string} currentTime — Current weather time string.
     * @returns {number} Index in the hourly array.
     */
    function findCurrentHourIndex(hourlyTimes, currentTime) {
        if (!currentTime || !hourlyTimes) return 0;

        // Compare down to the hour (e.g. "2024-01-15T14")
        const currentHour = currentTime.substring(0, 13);

        for (let i = 0; i < hourlyTimes.length; i++) {
            if (hourlyTimes[i].substring(0, 13) === currentHour) {
                return i;
            }
        }

        // Fallback: find the closest past hour
        const now = new Date();
        for (let i = hourlyTimes.length - 1; i >= 0; i--) {
            const h = parseInt(hourlyTimes[i].split('T')[1].split(':')[0], 10);
            const d = hourlyTimes[i].split('T')[0];
            const candidate = new Date(d + 'T00:00:00');
            candidate.setHours(h);
            if (candidate <= now) return i;
        }

        return 0;
    }

    /* ---------- Expose Public API ---------- */
    return {
        searchCity,
        fetchWeather,
        getWeatherInfo,
        convertTemp,
        formatTemp,
        formatHour,
        formatTime,
        formatDayName,
        formatDate,
        getUVLevel,
        getLocalDateTime,
        getLastUpdated,
        isDaytimeHour,
        findCurrentHourIndex,
        DETAIL_ICONS,
    };
})();
