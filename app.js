// ১. ফায়ারবেস মডিউল ইমপোর্ট
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { 
    getAuth, 
    GoogleAuthProvider,
    signInWithPopup, 
    onAuthStateChanged, 
    signOut 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// ==========================================
// ডাটাবেজ অ্যাডমিন কন্ট্রোল (শুধুমাত্র এই ইমেইলটি ডাটাবেজ এক্সেস পাবে)
const ADMIN_EMAIL = "alfurkan128779@gmail.com"; 
// ==========================================

// ২. আপনার ফায়ারবেস কনফিগারেশন
const firebaseConfig = {
    apiKey: "AIzaSyCLiacTrB3U2-JJ6-zJHgNPTsA8pBGbD_I",
    authDomain: "my-typing-web-2adf3.firebaseapp.com",
    projectId: "my-typing-web-2adf3",
    storageBucket: "my-typing-web-2adf3.firebasestorage.app",
    messagingSenderId: "391422591669",
    appId: "1:391422591669:web:283db40a51b800a885f4fc",
    measurementId: "G-7HN7LF7B5E"
};

// ৩. ফায়ারবেস এবং অথেনটিকেশন ইনিশিয়ালাইজেশন
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// ৪. এইচটিএমএল (DOM) এলিমেন্ট কানেকশন
const authSection = document.getElementById('auth-section');
const mainApp = document.getElementById('main-app');
const authError = document.getElementById('auth-error');
const logoutBtn = document.getElementById('logout-btn');
const googleLoginBtn = document.getElementById('google-login-btn'); 

// ৫. গুগল দিয়ে লগইন করার ফাংশন
googleLoginBtn.addEventListener('click', () => {
    googleLoginBtn.disabled = true;
    googleLoginBtn.innerHTML = 'অপেক্ষা করুন...';

    signInWithPopup(auth, googleProvider)
        .then((result) => {
            authError.style.display = "none";
        })
        .catch((error) => {
            showError("একটি ত্রুটি হয়েছে, আবার চেষ্টা করুন।");
            console.error(error);
        })
        .finally(() => {
            googleLoginBtn.disabled = false;
            googleLoginBtn.innerHTML = '<img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" style="width: 24px;"> গুগল দিয়ে লগইন করুন';
        });
});

// ৬. লগআউট প্রসেস
if(logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        signOut(auth).catch((error) => { console.error("লগআউট এরর: ", error); });
    });
}

// ৭. অথেনটিকেশন ও অ্যাডমিন ট্র্যাকার (প্রধান লজিক)
onAuthStateChanged(auth, (user) => {
    if (user) {
        // ইউজার লগইন অবস্থায় আছে, তাই মেইন অ্যাপ দেখাবে
        authSection.style.display = "none";
        mainApp.style.display = "block";

        // অ্যাডমিন চেক লজিক
        const dbMenu = document.getElementById('menu-database');
        if (dbMenu) {
            if (user.email === ADMIN_EMAIL) {
                dbMenu.style.display = "flex"; // শুধুমাত্র অ্যাডমিন হলে ডাটাবেজ মেনু দেখাবে
            } else {
                dbMenu.style.display = "none"; // সাধারণ ইউজার হলে ডাটাবেজ মেনু লুকানো থাকবে
            }
        }
    } else {
        // ইউজার লগআউট অবস্থায় আছে, তাই শুধু গুগল লগইন পেজ দেখাবে
        authSection.style.display = "flex";
        mainApp.style.display = "none";
    }
});

// ৮. হেল্পার ফাংশন
function showError(msg) {
    authError.innerText = msg;
    authError.style.display = "block";
}