// js/auth.js

// Ensure config.js is loaded before this file in HTML
// const { createClient } = supabase; // Already available globally via CDN
const supabaseClient = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);

let isLoginMode = true;

function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    const title = document.getElementById('auth-title');
    const subtitle = document.getElementById('auth-subtitle');
    const nameField = document.getElementById('name-field');
    const submitBtn = document.getElementById('submit-btn');
    const toggleText = document.getElementById('toggle-text');
    const toggleBtn = document.getElementById('toggle-btn');

    if (isLoginMode) {
        title.innerText = "Welcome back";
        subtitle.innerText = "Continue your spiritual journey";
        nameField.classList.add('hidden');
        submitBtn.innerText = "Sign In";
        toggleText.innerText = "Don't have an account?";
        toggleBtn.innerText = "Create a new garden";
    } else {
        title.innerText = "Start Blooming";
        subtitle.innerText = "Join our community of young women";
        nameField.classList.remove('hidden');
        submitBtn.innerText = "Create Account";
        toggleText.innerText = "Already a member?";
        toggleBtn.innerText = "Sign in to your garden";
    }
}

document.getElementById('auth-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const fullName = document.getElementById('full-name').value;

    try {
        if (isLoginMode) {
            const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
            if (error) throw error;
            window.location.href = 'index.html';
        } else {
            const { data, error } = await supabaseClient.auth.signUp({
                email,
                password,
                options: {
                    data: { full_name: fullName },
                    emailRedirectTo: CONFIG.REDIRECT_URL
                }
            });
            if (error) throw error;
            alert("Check your email for confirmation!");
        }
    } catch (error) {
        alert(error.message);
    }
});
