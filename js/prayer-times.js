// js/prayer-times.js

// Mock Adhan library availability for now in case it's not loaded
// In production, user should ensure <script src="https://cdn.jsdelivr.net/npm/adhan@4.4.1/Adhan.min.js"></script> is included or bundled.
// I will verify if I should include the CDN link in HTML files.

class PrayerTimesManager {
    constructor() {
        this.coordinates = null;
        this.date = new Date();
        this.calculationMethod = 'Singapore'; // Default or 'MuslimWorldLeague'
        this.prayerTimes = null;
    }

    init() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    this.coordinates = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    };
                    this.fetchTimes();
                },
                (error) => {
                    console.error("Geolocation error:", error);
                    // Fallback to Jakarta
                    this.coordinates = { latitude: -6.2088, longitude: 106.8456 };
                    this.fetchTimes();
                }
            );
        } else {
            // Fallback to Jakarta
            this.coordinates = { latitude: -6.2088, longitude: 106.8456 };
            this.fetchTimes();
        }
    }

    fetchTimes() {
        if (navigator.onLine) {
            this.fetchFromAPI();
        } else {
            this.calculateLocally();
        }
    }

    async fetchFromAPI() {
        // Aladhan API
        const { latitude, longitude } = this.coordinates;
        const url = `https://api.aladhan.com/v1/timings/${Math.floor(Date.now() / 1000)}?latitude=${latitude}&longitude=${longitude}&method=11`; // 11 is Majlis Ugama Islam Singapura, good for SE Asia
        try {
            const response = await fetch(url);
            const data = await response.json();
            if (data.code === 200) {
                this.prayerTimes = data.data.timings;
                this.updateUI();
                localStorage.setItem('cachedPrayerTimes', JSON.stringify(data.data.timings));
                localStorage.setItem('cachedDate', new Date().toDateString());
            }
        } catch (e) {
            console.error("API Error, falling back to local/cache", e);
            this.loadFromCache();
        }
    }

    calculateLocally() {
        // Using adhan-js if available globally
        if (window.adhan) {
            const coords = new adhan.Coordinates(this.coordinates.latitude, this.coordinates.longitude);
            const params = adhan.CalculationMethod.Singapore();
            const prayerTimes = new adhan.PrayerTimes(coords, new Date(), params);

            this.prayerTimes = {
                Fajr: this.formatTime(prayerTimes.fajr),
                Dhuhr: this.formatTime(prayerTimes.dhuhr),
                Asr: this.formatTime(prayerTimes.asr),
                Maghrib: this.formatTime(prayerTimes.maghrib),
                Isha: this.formatTime(prayerTimes.isha)
            };
            this.updateUI();
        } else {
            this.loadFromCache();
        }
    }

    loadFromCache() {
        const cached = localStorage.getItem('cachedPrayerTimes');
        if (cached) {
            this.prayerTimes = JSON.parse(cached);
            this.updateUI();
        }
    }

    formatTime(date) {
        // adhan-js returns Date objects
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    }

    updateUI() {
        if (!this.prayerTimes) return;

        // Update DOM elements if they exist
        // Mappings: Subuh -> Fajr, etc.
        const mapping = {
            'Subuh': this.prayerTimes.Fajr,
            'Dhuhr': this.prayerTimes.Dhuhr,
            'Asr': this.prayerTimes.Asr,
            'Maghrib': this.prayerTimes.Maghrib,
            'Isha': this.prayerTimes.Isha
        };

        const strip = document.getElementById('prayer-times-strip');
        if (strip) {
            // Re-render strip or update text content
            // Currently strip is hardcoded in HTML, let's update values
            // Finding elements by simpler logic or ID would be better, but relying on text content for now
            // Or easier: clear and rebuild
            strip.innerHTML = '';
            Object.entries(mapping).forEach(([name, time]) => {
                const isMaghrib = name === 'Maghrib';
                const el = document.createElement('div');
                el.className = isMaghrib
                    ? "flex flex-col items-center gap-1 text-text-charcoal font-bold scale-110 origin-bottom transition-transform"
                    : "flex flex-col items-center gap-1 text-text-taupe";

                el.innerHTML = `
                    <span class="${isMaghrib ? 'font-bold' : 'font-medium'}">${name}</span>
                    <span class="${isMaghrib ? 'text-primary' : ''}">${time.substring(0, 5)}</span>
                `;
                strip.appendChild(el);
            });
        }
    }
}

// Initialize
// Add CDN script to head if not present
if (!document.querySelector('script[src*="adhan"]')) {
    const script = document.createElement('script');
    script.src = "https://cdn.jsdelivr.net/npm/adhan@4.4.1/Adhan.min.js";
    script.onload = () => {
        new PrayerTimesManager().init();
    };
    document.head.appendChild(script);
} else {
    new PrayerTimesManager().init();
}
