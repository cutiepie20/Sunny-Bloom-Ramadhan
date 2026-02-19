// js/app.js
// Ensure config.js and Supabase CDN are loaded before this file

const supabase = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);

class AppManager {
    constructor() {
        this.user = null;
        this.profile = null;
        // Auto-init on load
        document.addEventListener('DOMContentLoaded', () => this.init());
    }

    async init() {
        // 1. Check User Session
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            // Redirect to Auth unless on auth/onboarding pages
            if (!window.location.pathname.includes('auth.html') && !window.location.pathname.includes('onboarding.html')) {
                window.location.href = 'auth.html';
                return;
            }
        } else {
            this.user = user;
            // 2. Load Profile & Data
            await this.loadProfile();

            // 3. Page specific initialization
            if (window.location.pathname.includes('index.html') || window.location.pathname === '/' || window.location.pathname === '') {
                this.initHome();
            }
            if (window.location.pathname.includes('tracker.html')) {
                this.initTracker();
            }
        }
    }

    async loadProfile() {
        if (!this.user) return;
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', this.user.id)
            .single();

        if (data) this.profile = data;
        else if (error) console.error("Error loading profile:", error);
    }

    async setMode(mode) {
        if (!this.user) return;
        const isFasting = (mode === 'fasting');
        const today = new Date().toISOString().split('T')[0];

        // Upsert daily log status
        const { error } = await supabase
            .from('daily_logs')
            .upsert({
                user_id: this.user.id,
                log_date: today,
                is_fasting: isFasting,
                fasting_status: mode
            }, { onConflict: 'user_id, log_date' });

        if (!error) {
            // Update UI if function exists (defined in index.html)
            if (typeof updateUIToggle === 'function') {
                updateUIToggle(mode);
            }
            // Refresh data if needed
            this.initHome();
        } else {
            console.error("Error updating mode:", error);
            alert("Failed to update status. Please try again.");
        }
    }

    async calculateFastingDebt() {
        if (!this.user) return 0;
        // Call RPC function from Supabase
        const { data, error } = await supabase.rpc('get_fasting_debt', { u_id: this.user.id });
        if (error) {
            console.error("Error calculating debt:", error);
            return 0;
        }
        return data || 0;
    }

    async initHome() {
        if (!this.user) return;
        // Fetch today's status to sync UI
        const today = new Date().toISOString().split('T')[0];
        const { data } = await supabase
            .from('daily_logs')
            .select('fasting_status')
            .eq('user_id', this.user.id)
            .eq('log_date', today)
            .single();

        if (data && data.fasting_status && typeof updateUIToggle === 'function') {
            updateUIToggle(data.fasting_status);
        }
    }

    async initTracker() {
        if (!this.user) return;

        // Update Fasting Debt Count
        const debt = await this.calculateFastingDebt();
        const debtEl = document.getElementById('qadha-count');
        if (debtEl) {
            debtEl.innerText = debt;
        }

        // Cycle Prediction Logic
        this.updateCyclePrediction();
    }

    updateCyclePrediction() {
        const nextPeriodEl = document.getElementById('next-period-date'); // Ensure element exists in tracker.html
        if (!nextPeriodEl || !this.profile?.last_period_date) return;

        const last = new Date(this.profile.last_period_date);
        const cycleLength = this.profile.cycle_length || 28;
        last.setDate(last.getDate() + cycleLength);

        // Format date: "15 Mar 2026"
        const options = { day: 'numeric', month: 'short', year: 'numeric' };
        nextPeriodEl.innerText = last.toLocaleDateString('en-GB', options);
    }
}

// Instantiate Global App Manager
const app = new AppManager();

// Expose setMode to window for onclick handlers
window.appSetMode = (mode) => app.setMode(mode);
