/* ============================================================
   SkyWeather — UI Rendering Module
   File: ui.js
   Responsibility: DOM manipulation and UI updates.
   All rendering logic lives here — separated from API logic.
   ============================================================ */

const UI = (function () {
    'use strict';

    /* ---------- Cached DOM Elements ---------- */
    let el = {};

    /**
     * Cache all DOM element references on initialization.
     */
    function init() {
        el = {
            /* States */
            loadingState:    document.getElementById('loadingState'),
            errorState:      document.getElementById('errorState'),
            errorMessage:    document.getElementById('errorMessage'),
            errorRetryBtn:   document.getElementById('errorRetryBtn'),
            dashboard:       document.getElementById('dashboard'),

            /* Search */
            searchInput:    document.getElementById('searchInput'),
            suggestions:    document.getElementById('suggestions'),

            /* Controls */
            unitToggle:     document.getElementById('unitToggle'),
            unitLabel:      document.getElementById('unitLabel'),
            geoBtn:         document.getElementById('geoBtn'),
            refreshBtn:     document.getElementById('refreshBtn'),

            /* Current Weather */
            locationName:   document.getElementById('locationName'),
            currentDate:     document.getElementById('currentDate'),
            liveTime:        document.getElementById('liveTime'),
            currentTemp:     document.getElementById('currentTemp'),
            currentTempUnit: document.getElementById('currentTempUnit'),
            currentIcon:    document.getElementById('currentIcon'),
            currentDesc:    document.getElementById('currentDesc'),
            currentFeels:   document.getElementById('currentFeels'),
            lastUpdated:     document.getElementById('lastUpdated'),

            /* Weather Details */
            weatherDetails:  document.getElementById('weatherDetails'),

            /* Hourly */
            hourlyForecast: document.getElementById('hourlyForecast'),

            /* Daily */
            dailyForecast:  document.getElementById('dailyForecast'),

            /* Additional */
            additionalInfo: document.getElementById('additionalInfo'),
        };
    }

    /* ---------- State Management ---------- */

    /**
     * Show the loading spinner and hide dashboard/error.
     */
    function showLoading() {
        el.loadingState.style.display = 'flex';
        el.dashboard.style.display = 'none';
        el.errorState.style.display = 'none';
    }

    /**
     * Hide the loading spinner and show the dashboard.
     */
    function hideLoading() {
        el.loadingState.style.display = 'none';
        el.dashboard.style.display = 'grid';
        el.errorState.style.display = 'none';
    }

    /**
     * Show an error message with a retry button.
     * @param {string} message — Error message to display.
     */
    function showError(message) {
        el.loadingState.style.display = 'none';
        el.dashboard.style.display = 'none';
        el.errorState.style.display = 'flex';
        el.errorMessage.textContent = message;
    }

    /**
     * Start the spinning animation on the refresh button.
     */
    function showRefreshLoading() {
        el.refreshBtn.classList.add('spinning');
    }

    /**
     * Stop the spinning animation on the refresh button.
     */
    function hideRefreshLoading() {
        el.refreshBtn.classList.remove('spinning');
    }

    /**
     * Update the unit toggle button label.
     * @param {string} unit — 'C' or 'F'.
     */
    function updateUnitToggle(unit) {
        el.unitLabel.textContent = `°${unit}`;
    }

    /* ---------- Current Weather Rendering ---------- */

    /**
     * Render the main current weather card.
     * @param {Object} weather — Full weather data from API.
     * @param {Object} location — Location info { name, country, admin1, timezone }.
     * @param {string} unit — Temperature unit ('C' or 'F').
     */
    function renderCurrentWeather(weather, location, unit) {
        const current = weather.current;
        const info = WeatherAPI.getWeatherInfo(current.weather_code, current.is_day);

        /* Location name */
        const locationParts = [location.name];
        if (location.country) locationParts.push(location.country);
        el.locationName.textContent = locationParts.join(', ');

        /* Temperature */
        const temp = WeatherAPI.convertTemp(current.temperature_2m, unit);
        el.currentTemp.textContent = temp !== null ? temp : '—';
        el.currentTempUnit.textContent = `°${unit}`;

        /* Icon */
        el.currentIcon.innerHTML = info.icon;

        /* Description */
        el.currentDesc.textContent = info.description;

        /* Feels like */
        const feels = WeatherAPI.formatTemp(current.apparent_temperature, unit);
        el.currentFeels.textContent = `Feels like ${feels}`;

        /* Last updated */
        el.lastUpdated.textContent = `Last updated: ${WeatherAPI.getLastUpdated()}`;
    }

    /* ---------- Weather Details Grid ---------- */

    /**
     * Render the weather details grid (temperature, humidity, wind, etc).
     * @param {Object} weather — Full weather data from API.
     * @param {string} unit — Temperature unit ('C' or 'F').
     */
    function renderWeatherDetails(weather, unit) {
        const c = weather.current;
        const info = WeatherAPI.getWeatherInfo(c.weather_code, c.is_day);
        const icons = WeatherAPI.DETAIL_ICONS;

        const details = [
            {
                icon: icons.thermometer,
                label: 'Temperature',
                value: WeatherAPI.formatTemp(c.temperature_2m, unit),
            },
            {
                icon: icons.droplet,
                label: 'Humidity',
                value: c.relative_humidity_2m != null ? `${c.relative_humidity_2m}%` : '—',
            },
            {
                icon: icons.wind,
                label: 'Wind Speed',
                value: c.wind_speed_10m != null ? `${Math.round(c.wind_speed_10m)} km/h` : '—',
            },
            {
                icon: icons.rainSmall,
                label: 'Precipitation',
                value: c.precipitation != null ? `${c.precipitation} mm` : '—',
            },
            {
                icon: icons.cloud,
                label: 'Condition',
                value: info.description,
            },
            {
                icon: c.is_day === 1 ? icons.sunSmall : icons.moonSmall,
                label: 'Day / Night',
                value: c.is_day === 1 ? 'Daytime' : 'Nighttime',
            },
        ];

        el.weatherDetails.innerHTML = details.map(d => `
            <div class="detail-item">
                <div class="detail-item__icon">${d.icon}</div>
                <div class="detail-item__info">
                    <span class="detail-item__label">${d.label}</span>
                    <span class="detail-item__value">${d.value}</span>
                </div>
            </div>
        `).join('');
    }

    /* ---------- Hourly Forecast ---------- */

    /**
     * Render the horizontally scrollable hourly forecast.
     * Shows 24 hours starting from the current hour.
     * @param {Object} weather — Full weather data from API.
     * @param {string} unit — Temperature unit ('C' or 'F').
     */
    function renderHourlyForecast(weather, unit) {
        const hourly = weather.hourly;
        const startIndex = WeatherAPI.findCurrentHourIndex(hourly.time, weather.current.time);
        const hoursToShow = 24;
        const icons = WeatherAPI.DETAIL_ICONS;

        const cards = [];

        for (let i = startIndex; i < Math.min(startIndex + hoursToShow, hourly.time.length); i++) {
            const isNow = i === startIndex;
            const hourLabel = isNow ? 'Now' : WeatherAPI.formatHour(hourly.time[i]);
            const info = WeatherAPI.getWeatherInfo(
                hourly.weather_code[i],
                WeatherAPI.isDaytimeHour(hourly.time[i], weather.daily) ? 1 : 0
            );
            const temp = WeatherAPI.formatTemp(hourly.temperature_2m[i], unit);
            const rainProb = hourly.precipitation_probability[i];

            cards.push(`
                <div class="hourly-card${isNow ? ' now' : ''}">
                    <div class="hourly-card__hour">${hourLabel}</div>
                    <div class="hourly-card__icon">${info.icon}</div>
                    <div class="hourly-card__temp">${temp}</div>
                    <div class="hourly-card__rain">
                        ${icons.droplet}
                        ${rainProb != null ? rainProb : 0}%
                    </div>
                </div>
            `);
        }

        el.hourlyForecast.innerHTML = cards.join('');
    }

    /* ---------- 7-Day Forecast ---------- */

    /**
     * Render the 7-day forecast list.
     * @param {Object} weather — Full weather data from API.
     * @param {string} unit — Temperature unit ('C' or 'F').
     */
    function renderDailyForecast(weather, unit) {
        const daily = weather.daily;
        const icons = WeatherAPI.DETAIL_ICONS;

        const items = [];

        for (let i = 0; i < daily.time.length; i++) {
            const isToday = i === 0;
            const dayName = isToday ? 'Today' : WeatherAPI.formatDayName(daily.time[i]);
            const dateStr = WeatherAPI.formatDate(daily.time[i]);
            const info = WeatherAPI.getWeatherInfo(daily.weather_code[i], 1);
            const maxTemp = WeatherAPI.convertTemp(daily.temperature_2m_max[i], unit);
            const minTemp = WeatherAPI.convertTemp(daily.temperature_2m_min[i], unit);
            const rainProb = daily.precipitation_probability_max[i];

            items.push(`
                <div class="daily-item">
                    <div class="daily-item__day">
                        <span class="daily-item__name">${dayName}</span>
                        <span class="daily-item__date">${dateStr}</span>
                    </div>
                    <div class="daily-item__icon">${info.icon}</div>
                    <div class="daily-item__desc">${info.description}</div>
                    <div class="daily-item__rain">
                        ${icons.droplet}
                        ${rainProb != null ? rainProb : 0}%
                    </div>
                    <div class="daily-item__temps">
                        <span class="daily-item__max">${maxTemp !== null ? maxTemp + '°' : '—'}</span>
                        <span class="daily-item__min">${minTemp !== null ? minTemp + '°' : '—'}</span>
                    </div>
                </div>
            `);
        }

        el.dailyForecast.innerHTML = items.join('');
    }

    /* ---------- Additional Information ---------- */

    /**
     * Render additional weather information (sunrise, sunset, UV, precipitation).
     * @param {Object} weather — Full weather data from API.
     * @param {string} unit — Temperature unit ('C' or 'F').
     */
    function renderAdditionalInfo(weather, unit) {
        const daily = weather.daily;
        const icons = WeatherAPI.DETAIL_ICONS;

        /* Use today's data (index 0) */
        const sunrise = daily.sunrise ? daily.sunrise[0] : null;
        const sunset = daily.sunset ? daily.sunset[0] : null;
        const uvIndex = daily.uv_index_max ? daily.uv_index_max[0] : null;
        const rainProb = daily.precipitation_probability_max ? daily.precipitation_probability_max[0] : null;

        const uvInfo = WeatherAPI.getUVLevel(uvIndex);

        const items = [
            {
                icon: icons.sunrise,
                label: 'Sunrise',
                value: WeatherAPI.formatTime(sunrise),
                sub: '',
            },
            {
                icon: icons.sunset,
                label: 'Sunset',
                value: WeatherAPI.formatTime(sunset),
                sub: '',
            },
            {
                icon: icons.uv,
                label: 'UV Index',
                value: uvIndex != null ? uvIndex.toFixed(1) : '—',
                sub: uvInfo.level,
            },
            {
                icon: icons.percent,
                label: 'Precipitation Probability',
                value: rainProb != null ? `${rainProb}%` : '—',
                sub: 'Daily maximum',
            },
        ];

        el.additionalInfo.innerHTML = items.map(item => `
            <div class="additional-item">
                <div class="additional-item__icon">${item.icon}</div>
                <span class="additional-item__label">${item.label}</span>
                <span class="additional-item__value">${item.value}</span>
                ${item.sub ? `<span class="additional-item__sub">${item.sub}</span>` : ''}
            </div>
        `).join('');
    }

    /* ---------- Search Suggestions ---------- */

    /**
     * Render search suggestions in the dropdown.
     * @param {Array} results — Array of city objects from the geocoding API.
     * @param {Function} onSelect — Callback when a city is selected.
     */
    function renderSuggestions(results, onSelect) {
        if (!results || results.length === 0) {
            el.suggestions.innerHTML = '<div class="suggestion-empty">No cities found. Try a different search.</div>';
            el.suggestions.classList.add('visible');
            el.searchInput.setAttribute('aria-expanded', 'true');
            return;
        }

        el.suggestions.innerHTML = results.map((city, index) => {
            const regionParts = [];
            if (city.country) regionParts.push(city.country);
            if (city.admin1 && city.admin1 !== city.name) regionParts.push(city.admin1);

            return `
                <div class="suggestion-item" role="option" data-index="${index}">
                    <span class="suggestion-item__name">${city.name}</span>
                    <span class="suggestion-item__region">${regionParts.join(' · ')}</span>
                </div>
            `;
        }).join('');

        el.suggestions.classList.add('visible');
        el.searchInput.setAttribute('aria-expanded', 'true');

        /* Attach click listeners */
        el.suggestions.querySelectorAll('.suggestion-item').forEach((item, index) => {
            item.addEventListener('click', () => {
                onSelect(results[index]);
            });
        });
    }

    /**
     * Hide the suggestions dropdown and clear its content.
     */
    function clearSuggestions() {
        el.suggestions.innerHTML = '';
        el.suggestions.classList.remove('visible');
        el.searchInput.setAttribute('aria-expanded', 'false');
    }

    /* ---------- Live Clock ---------- */

    /**
     * Update the live time and date display for a given timezone.
     * @param {string} timezone — IANA timezone string.
     */
    function updateClock(timezone) {
        if (!timezone) return;
        const { date, time } = WeatherAPI.getLocalDateTime(timezone);
        el.currentDate.textContent = date;
        el.liveTime.textContent = time;
    }

    /* ---------- Expose Public API ---------- */
    return {
        init,
        showLoading,
        hideLoading,
        showError,
        showRefreshLoading,
        hideRefreshLoading,
        updateUnitToggle,
        renderCurrentWeather,
        renderWeatherDetails,
        renderHourlyForecast,
        renderDailyForecast,
        renderAdditionalInfo,
        renderSuggestions,
        clearSuggestions,
        updateClock,
    };
})();
