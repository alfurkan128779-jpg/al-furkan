// ১. ফায়ারবেস মডিউল ইমপোর্ট
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup, 
    onAuthStateChanged, 
    signOut 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

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
const authTitle = document.getElementById('auth-title');
const authEmail = document.getElementById('auth-email');
const authPassword = document.getElementById('auth-password');
const authBtn = document.getElementById('auth-btn');
const authToggleBtn = document.getElementById('auth-toggle-btn');
const authError = document.getElementById('auth-error');
const logoutBtn = document.getElementById('logout-btn');
const googleLoginBtn = document.getElementById('google-login-btn'); // নতুন গুগল বাটন

let isLoginMode = true; 

// ৫. ইমেইল-পাসওয়ার্ড লগইন এবং রেজিস্ট্রেশন পেজ পরিবর্তন
authToggleBtn.addEventListener('click', () => {
    isLoginMode = !isLoginMode;
    if (isLoginMode) {
        authTitle.innerText = "আল ফুরকান - লগইন";
        authBtn.innerHTML = 'লগইন করুন <i class="fas fa-sign-in-alt"></i>';
        authToggleBtn.innerText = "অ্যাকাউন্ট নেই? নতুন অ্যাকাউন্ট খুলুন";
    } else {
        authTitle.innerText = "আল ফুরকান - রেজিস্ট্রেশন";
        authBtn.innerHTML = 'অ্যাকাউন্ট তৈরি করুন <i class="fas fa-user-plus"></i>';
        authToggleBtn.innerText = "আগে থেকে অ্যাকাউন্ট আছে? লগইন করুন";
    }
    authError.style.display = "none";
    authEmail.value = "";
    authPassword.value = "";
});

// ৬. ইমেইল-পাসওয়ার্ড দিয়ে সাবমিট বাটন লজিক
authBtn.addEventListener('click', () => {
    const email = authEmail.value.trim();
    const password = authPassword.value.trim();

    if (!email || !password) {
        showError("ইমেইল এবং পাসওয়ার্ড প্রদান করুন!");
        return;
    }

    authBtn.disabled = true;
    authBtn.innerText = "অপেক্ষা করুন...";

    if (isLoginMode) {
        signInWithEmailAndPassword(auth, email, password)
            .then(() => { authError.style.display = "none"; })
            .catch((error) => { showError(getCustomErrorMessage(error.code)); })
            .finally(() => { resetAuthBtn(); });
    } else {
        createUserWithEmailAndPassword(auth, email, password)
            .then(() => { authError.style.display = "none"; })
            .catch((error) => { showError(getCustomErrorMessage(error.code)); })
            .finally(() => { resetAuthBtn(); });
    }
});

// ৭. গুগল লগইন লজিক
googleLoginBtn.addEventListener('click', () => {
    googleLoginBtn.disabled = true;
    googleLoginBtn.innerHTML = 'অপেক্ষা করুন...';

    signInWithPopup(auth, googleProvider)
        .then((result) => {
            authError.style.display = "none";
        })
        .catch((error) => {
            showError(getCustomErrorMessage(error.code));
        })
        .finally(() => {
            googleLoginBtn.disabled = false;
            googleLoginBtn.innerHTML = '<img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" style="width: 20px;"> গুগল দিয়ে লগইন করুন';
        });
});

// ৮. লগআউট প্রসেস
if(logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        signOut(auth).catch((error) => { console.error("লগআউট এরর: ", error); });
    });
}

// ৯. অথেনটিকেশন স্টেট ট্র্যাকার (ম্যাজিক লজিক)
onAuthStateChanged(auth, (user) => {
    if (user) {
        authSection.style.display = "none";
        mainApp.style.display = "block";
    } else {
        authSection.style.display = "flex";
        mainApp.style.display = "none";
    }
});

// ১০. হেল্পার ফাংশন
function showError(msg) {
    authError.innerText = msg;
    authError.style.display = "block";
}

function resetAuthBtn() {
    authBtn.disabled = false;
    authBtn.innerHTML = isLoginMode ? 'লগইন করুন <i class="fas fa-sign-in-alt"></i>' : 'অ্যাকাউন্ট তৈরি করুন <i class="fas fa-user-plus"></i>';
}

function getCustomErrorMessage(code) {
    switch (code) {
        case 'auth/invalid-email': return "ইমেইল এড্রেসটি সঠিক নয়।";
        case 'auth/user-not-found': return "এই ইমেইলের কোনো অ্যাকাউন্ট নেই।";
        case 'auth/wrong-password': return "পাসওয়ার্ড ভুল হয়েছে।";
        case 'auth/invalid-credential': return "ইমেইল বা পাসওয়ার্ড ভুল হয়েছে।";
        case 'auth/email-already-in-use': return "এই ইমেইল দিয়ে আগে থেকেই অ্যাকাউন্ট আছে।";
        case 'auth/weak-password': return "পাসওয়ার্ড অন্তত ৬ অক্ষরের হতে হবে।";
        case 'auth/network-request-failed': return "ইন্টারনেট কানেকশন চেক করুন।";
        case 'auth/popup-closed-by-user': return "গুগল লগইন পপ-আপটি বন্ধ করে দেওয়া হয়েছে।";
        default: return "একটি ত্রুটি হয়েছে, আবার চেষ্টা করুন। (" + code + ")";
    }
}