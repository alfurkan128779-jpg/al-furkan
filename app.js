// ১. ফায়ারবেস মডিউল ইমপোর্ট
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { 
    getAuth, 
    GoogleAuthProvider,
    signInWithRedirect, 
    getRedirectResult,
    onAuthStateChanged, 
    signOut 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    getDocs, 
    doc, 
    setDoc, 
    deleteDoc, 
    query, 
    orderBy, 
    limit, 
    where 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ==========================================
// ডাটাবেজ অ্যাডমিন কন্ট্রোল 
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

// ৩. ফায়ারবেস ইনিশিয়ালাইজেশন
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// ৪. গ্লোবাল ফাংশনসমূহ (index.html যাতে এগুলো ব্যবহার করতে পারে)
window.currentUser = null;

// লিডারবোর্ড সেভ এবং ফেচ
window.saveGlobalLeaderboard = async (data) => {
    try {
        await addDoc(collection(db, "leaderboard"), data);
    } catch(e) { console.error("Leaderboard Save Error:", e); }
};

window.getGlobalLeaderboard = async () => {
    try {
        const q = query(collection(db, "leaderboard"), orderBy("wpm", "desc"), limit(100)); // টপ ১০০ এনে ফ্রন্টএন্ডে ২০ দেখানো হবে
        const snapshot = await getDocs(q);
        let results = [];
        snapshot.forEach(doc => results.push(doc.data()));
        return results;
    } catch(e) { console.error("Leaderboard Fetch Error:", e); return []; }
};

// ডাটাবেজ (অনুচ্ছেদ) সেভ, ফেচ এবং ডিলিট
window.syncGlobalParagraphs = async () => {
    try {
        const snapshot = await getDocs(collection(db, "paragraphs"));
        let p = { "bn": {}, "en": {} };
        snapshot.forEach(doc => {
            const data = doc.data();
            if(p[data.lang]) p[data.lang][data.title] = data.body;
        });
        return p;
    } catch(e) { console.error("Paragraph Fetch Error:", e); return null; }
};

window.saveGlobalParagraph = async (lang, title, body) => {
    try {
        const colRef = collection(db, "paragraphs");
        const q = query(colRef, where("lang", "==", lang), where("title", "==", title));
        const snap = await getDocs(q);
        if (snap.empty) {
            await addDoc(colRef, { lang, title, body });
        } else {
            snap.forEach(async (d) => { await setDoc(d.ref, { lang, title, body }, { merge: true }); });
        }
    } catch(e) { console.error("Paragraph Save Error:", e); }
};

window.deleteGlobalParagraph = async (lang, title) => {
    try {
        const q = query(collection(db, "paragraphs"), where("lang", "==", lang), where("title", "==", title));
        const snap = await getDocs(q);
        snap.forEach(async (d) => { await deleteDoc(d.ref); });
    } catch(e) { console.error("Paragraph Delete Error:", e); }
};

// ৫. এইচটিএমএল (DOM) এলিমেন্ট কানেকশন
const authSection = document.getElementById('auth-section');
const mainApp = document.getElementById('main-app');
const authError = document.getElementById('auth-error');
const logoutBtn = document.getElementById('logout-btn');
const googleLoginBtn = document.getElementById('google-login-btn'); 

// ৬. গুগল দিয়ে লগইন করার ফাংশন 
if(googleLoginBtn) {
    googleLoginBtn.addEventListener('click', () => {
        googleLoginBtn.disabled = true;
        googleLoginBtn.innerHTML = 'অপেক্ষা করুন...';
        signInWithRedirect(auth, googleProvider).catch((error) => {
            showError("লগইন পেজে যেতে সমস্যা হচ্ছে।");
            googleLoginBtn.disabled = false;
            googleLoginBtn.innerHTML = '<img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" style="width: 24px;"> গুগল দিয়ে লগইন করুন';
        });
    });
}

// ৭. রিডাইরেক্ট হয়ে ফিরে আসার পর এরর হ্যান্ডেলিং
getRedirectResult(auth).catch((error) => {
    if (error.code !== 'auth/redirect-cancelled-by-user') {
        showError("লগইন সম্পন্ন করা যায়নি। আবার চেষ্টা করুন।");
    }
});

// ৮. লগআউট প্রসেস
if(logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        signOut(auth).catch((error) => { console.error("লগআউট এরর: ", error); });
    });
}

// ৯. অথেনটিকেশন ও অ্যাডমিন ট্র্যাকার (মেনু নিয়ন্ত্রণ)
onAuthStateChanged(auth, (user) => {
    if (user) {
        window.currentUser = user; // লিডারবোর্ডে নাম দেখানোর জন্য
        
        authSection.style.display = "none";
        mainApp.style.display = "block";

        const dbMenu = document.getElementById('menu-database');
        if (dbMenu) {
            if (user.email === ADMIN_EMAIL) {
                dbMenu.style.display = "flex"; 
            } else {
                dbMenu.style.display = "none"; 
            }
        }
        
        // লগইন সফল হলে index.html কে ডাটাবেজ ফেচ করার সিগন্যাল দেওয়া
        window.dispatchEvent(new Event('app-ready'));

    } else {
        window.currentUser = null;
        authSection.style.display = "flex";
        mainApp.style.display = "none";
        
        if(googleLoginBtn) {
            googleLoginBtn.disabled = false;
            googleLoginBtn.innerHTML = '<img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" style="width: 24px;"> গুগল দিয়ে লগইন করুন';
        }
    }
});

// ১০. হেল্পার ফাংশন
function showError(msg) {
    if(authError) {
        authError.innerText = msg;
        authError.style.display = "block";
    }
}