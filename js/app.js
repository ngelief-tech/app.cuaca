/* ============================================================
   SkyWeather — Application Controller
   File: app.js
   Responsibility: App initialization, event listeners,
                  state management, and user interactions.
   ============================================================ */

const App = (function () {
    'use strict';

    /* ---------- Default Location (Jakarta, Indonesia) ---------- */
    const DEFAULT_LOCATION = {
        name: 'Jakarta',
        latitude: -6.2088,
        longitude: 106.8456,
        country: 'Indonesia',
        admin1: 'Jakarta',
        timezone: 'Asia/Jakarta',
    };

    /* ---------- Application State ---------- */
    const state = {
        location: null,        // Current location object { name, country, timezone, latitude, longitude }
        weather: null,          // Current weather data from API
        unit: 'C',              // Temperature unit: 'C' or 'F'
        theme: 'light',         // Theme: 'light' or 'dark'
        clockInterval: null,    // setInterval ID for live clock
        isRefreshing: false,   // Flag to prevent concurrent refreshes
    };

    /* ---------- Cached DOM Elements (local to App) ---------- */
    const el = {};

    /* ---------- Utility: Debounce ---------- */
    /**
     * Create a debounced version of a function.
     * @param {Function} fn — Function to debounce.
     * @param {number} delay — Delay in milliseconds.
     * @returns {Function} Debounced function.
     */
    function debounce(fn, delay) {
        let timeoutId;
        return function (...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => fn.apply(this, args), delay);
        };
    }

    /* ---------- Core: Load Weather Data ---------- */
    /**
     * Fetch weather data for a location and render the full dashboard.
     * @param {number} lat — Latitude.
     * @param {number} lon — Longitude.
     * @param {string} name — City name for display.
     * @param {string} country — Country name for display.
     * @param {string} timezone — IANA timezone string.
     * @param {boolean} isRefresh — True if this is a refresh (not initial load).
     */
    async function loadWeather(lat, lon, name, country, timezone, isRefresh) {
        try {
            if (!isRefresh) {
                UI.showLoading();
            }

            const weather = await WeatherAPI.fetchWeather(lat, lon);

            /* Store state including coordinates for future refreshes */
            state.weather = weather;
            state.location = {
                name: name || 'Unknown',
                country: country || '',
                timezone: timezone || weather.timezone || null,
                latitude: lat,
                longitude: lon,
            };

            /* Render all dashboard sections */
            UI.renderCurrentWeather(weather, state.location, state.unit);
            UI.renderWeatherDetails(weather, state.unit);
            UI.renderHourlyForecast(weather, state.unit);
            UI.renderDailyForecast(weather, state.unit);
            UI.renderAdditionalInfo(weather, state.unit);

            /* Start / restart the live clock with the new timezone */
            startClock(state.location.timezone);

            UI.hideLoading();

        } catch (error) {
            console.error('Failed to load weather:', error);

            if (isRefresh) {
                /* On refresh failure, keep showing the old data if available */
                UI.hideRefreshLoading();
                if (state.weather) {
                    UI.hideLoading();
                } else {
                    UI.showError('Unable to refresh weather data. Please check your internet connection and try again.');
                }
            } else {
                UI.showError('Unable to load weather data. Please check your internet connection and try again.');
            }
        } finally {
            UI.hideRefreshLoading();
        }
    }

    /* ---------- Live Clock ---------- */
    /**
     * Start a live clock that updates every second for the given timezone.
     * @param {string} timezone — IANA timezone string.
     */
    function startClock(timezone) {
        if (state.clockInterval) {
            clearInterval(state.clockInterval);
        }

        const tick = () => UI.updateClock(timezone);
        tick();
        state.clockInterval = setInterval(tick, 1000);
    }

    /* ---------- Search Handling ---------- */
    /**
     * Handle debounced search input — fetches city suggestions.
     * @param {string} query — Search query from the input.
     */
    async function handleSearchInput(query) {
        const trimmed = query.trim();

        if (trimmed.length < 2) {
            UI.clearSuggestions();
            return;
        }

        try {
            const results = await WeatherAPI.searchCity(trimmed);
            UI.renderSuggestions(results, handleCitySelection);
        } catch (error) {
            console.error('Search error:', error);
            /* Show empty state on error rather than failing silently */
            UI.renderSuggestions([], handleCitySelection);
        }
    }

    /**
     * Handle city selection from suggestions dropdown.
     * @param {Object} city — Selected city object from geocoding API.
     */
    function handleCitySelection(city) {
        UI.clearSuggestions();
        el.searchInput.value = '';

        loadWeather(
            city.latitude,
            city.longitude,
            city.name,
            city.country,
            city.timezone,
            false
        );
    }

    /**
     * Handle Enter key in the search input — selects first suggestion if available.
     */
    function handleSearchEnter() {
        const firstSuggestion = el.suggestions.querySelector('.suggestion-item');

        if (firstSuggestion) {
            firstSuggestion.click();
        } else {
            /* No suggestions yet — perform a direct search */
            const query = el.searchInput.value.trim();
            if (query.length >= 2) {
                performDirectSearch(query);
            }
        }
    }

    /**
     * Perform a direct search and automatically select the first result.
     * @param {string} query — City name to search for.
     */
    async function performDirectSearch(query) {
        try {
            UI.showLoading();
            const results = await WeatherAPI.searchCity(query);

            if (results.length === 0) {
                UI.showError(`No cities found matching "${query}". Please try another search.`);
                return;
            }

            handleCitySelection(results[0]);
        } catch (error) {
            UI.showError(`Unable to search for "${query}". Please try again.`);
        }
    }

    /* ---------- Unit Toggle ---------- */
    /**
     * Toggle temperature unit between Celsius and Fahrenheit,
     * then re-render all temperature displays with the new unit.
     */
    function toggleUnit() {
        state.unit = state.unit === 'C' ? 'F' : 'C';
        UI.updateUnitToggle(state.unit);

        if (state.weather && state.location) {
            UI.renderCurrentWeather(state.weather, state.location, state.unit);
            UI.renderWeatherDetails(state.weather, state.unit);
            UI.renderHourlyForecast(state.weather, state.unit);
            UI.renderDailyForecast(state.weather, state.unit);
            UI.renderAdditionalInfo(state.weather, state.unit);
        }
    }

    /* ---------- Theme Toggle ---------- */
    /**
     * Apply a theme ('light' or 'dark') to the document and persist it.
     * @param {string} theme — 'light' or 'dark'.
     */
    function applyTheme(theme) {
        state.theme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        try {
            localStorage.setItem('skyweather-theme', theme);
        } catch (e) {
            /* localStorage may be unavailable (private mode); ignore */
        }
    }

    /**
     * Toggle between light and dark themes.
     */
    function toggleTheme() {
        applyTheme(state.theme === 'light' ? 'dark' : 'light');
    }

    /**
     * Load the saved theme from localStorage, or default to light.
     */
    function loadSavedTheme() {
        let saved = 'light';
        try {
            saved = localStorage.getItem('skyweather-theme') || 'light';
        } catch (e) {
            /* localStorage unavailable; use default */
        }
        applyTheme(saved);
    }

    /* ---------- Refresh ---------- */
    /**
     * Refresh weather data for the current location using stored coordinates.
     */
    async function refreshWeather() {
        if (state.isRefreshing || !state.location) return;
        if (!state.location.latitude || !state.location.longitude) return;

        state.isRefreshing = true;
        UI.showRefreshLoading();

        await loadWeather(
            state.location.latitude,
            state.location.longitude,
            state.location.name,
            state.location.country,
            state.location.timezone,
            true
        );

        state.isRefreshing = false;
    }

    /* ---------- Geolocation ---------- */
    /**
     * Detect the user's location using the browser Geolocation API.
     * Falls back to Jakarta if geolocation is unavailable or denied.
     */
    function detectLocation() {
        if (!navigator.geolocation) {
            console.warn('Geolocation is not supported by this browser. Using default location.');
            loadDefaultLocation();
            return;
        }

        UI.showLoading();

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;

                loadWeather(lat, lon, 'Your Location', '', null, false);
            },
            (error) => {
                console.warn('Geolocation denied or unavailable:', error.message);
                loadDefaultLocation();
            },
            {
                enableHighAccuracy: false,
                timeout: 8000,
                maximumAge: 300000,
            }
        );
    }

    /**
     * Load the default location (Jakarta, Indonesia).
     * Used as a fallback when geolocation is unavailable.
     */
    function loadDefaultLocation() {
        loadWeather(
            DEFAULT_LOCATION.latitude,
            DEFAULT_LOCATION.longitude,
            DEFAULT_LOCATION.name,
            DEFAULT_LOCATION.country,
            DEFAULT_LOCATION.timezone,
            false
        );
    }

    /* ---------- Event Listeners Setup ---------- */
    /**
     * Set up all event listeners for the application.
     */
    function setupEventListeners() {
        /* Search input — debounced for performance */
        const debouncedSearch = debounce((e) => handleSearchInput(e.target.value), 300);
        el.searchInput.addEventListener('input', debouncedSearch);

        /* Search — keyboard navigation */
        el.searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleSearchEnter();
            }
            if (e.key === 'Escape') {
                UI.clearSuggestions();
                el.searchInput.blur();
            }
        });

        /* Close suggestions when clicking outside the search area */
        document.addEventListener('click', (e) => {
            if (!el.searchInput.contains(e.target) && !el.suggestions.contains(e.target)) {
                UI.clearSuggestions();
            }
        });

        /* Unit toggle button */
        el.unitToggle.addEventListener('click', toggleUnit);

        /* Theme toggle button */
        el.themeToggle.addEventListener('click', toggleTheme);

        /* Refresh button */
        el.refreshBtn.addEventListener('click', refreshWeather);

        /* Geolocation button */
        el.geoBtn.addEventListener('click', detectLocation);

        /* Error retry button */
        el.errorRetryBtn.addEventListener('click', () => {
            if (state.location && state.location.latitude) {
                loadWeather(
                    state.location.latitude,
                    state.location.longitude,
                    state.location.name,
                    state.location.country,
                    state.location.timezone,
                    false
                );
            } else {
                loadDefaultLocation();
            }
        });
    }

    /* ---------- Initialization ---------- */
    /**
     * Initialize the SkyWeather application.
     * Caches DOM elements, sets up event listeners, and loads initial weather.
     */
    function init() {
        /* Initialize UI module (caches its own elements) */
        UI.init();

        /* Cache local element references */
        el.searchInput = document.getElementById('searchInput');
        el.suggestions = document.getElementById('suggestions');
        el.unitToggle = document.getElementById('unitToggle');
        el.refreshBtn = document.getElementById('refreshBtn');
        el.geoBtn = document.getElementById('geoBtn');
        el.errorRetryBtn = document.getElementById('errorRetryBtn');

        /* Set initial unit toggle label */
        UI.updateUnitToggle(state.unit);

        /* Set up all event listeners */
        setupEventListeners();

        /* Attempt geolocation; fall back to Jakarta on failure */
        detectLocation();
    }

    /* ---------- Expose Public API ---------- */
    return {
        init,
    };
})();

/* ---------- Start Application on DOM Ready ---------- */
document.addEventListener('DOMContentLoaded', () => App.init());
