// js/config.js

const isLocalhost = window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname.includes(".idx.google.com"); // Deteksi Project IDX

const CONFIG = {
    // Alamat Supabase kamu
    SUPABASE_URL: 'https://vqwlgpppqdigcsncaymp.supabase.co',
    SUPABASE_ANON_KEY: 'sb_publishable_xsE_AB90_qo6K-G2GydJiQ__H8HJfL8',

    // Alamat Redirect Otomatis
    // Jika di editor cloud, dia akan ambil URL yang sedang aktif saat itu
    REDIRECT_URL: window.location.origin + "/index.html"
};

console.log("Sunny Bloom Environment:", isLocalhost ? "Development" : "Production");
console.log("Redirect URL set to:", CONFIG.REDIRECT_URL);
