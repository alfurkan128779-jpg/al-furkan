// ১. ফায়ারবেস মডিউল ইমপোর্ট
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { 
    getAuth, 
    GoogleAuthProvider,
    signInWithPopup,
    signInWithRedirect, 
    getRedirectResult,
    onAuthStateChanged, 
    signOut,
    setPersistence,
    browserLocalPersistence
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

// ম্যানুয়ালি ডাটা সেভ থাকার পলিসি সেট করা (ক্রস-সাইট কুকি ব্লকিং এড়াতে)
setPersistence(auth, browserLocalPersistence).catch(console.error);

// ৪. গ্লোবাল ফাংশনসমূহ (index.html যাতে এগুলো ব্যবহার করতে পারে)
window.currentUser = null;

window.saveGlobalLeaderboard = async (data) => {
    try { await addDoc(collection(db, "leaderboard"), data); } 
    catch(e) { console.error("Leaderboard Save Error:", e); }
};

window.getGlobalLeaderboard = async () => {
    try {
        const q = query(collection(db, "leaderboard"), orderBy("wpm", "desc"), limit(100)); 
        const snapshot = await getDocs(q);
        let results = [];
        snapshot.forEach(doc => results.push(doc.data()));
        return results;
    } catch(e) { console.error("Leaderboard Fetch Error:", e); return []; }
};

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
// নতুন: ফলাফল পেজের প্রমোশনাল লগইন বাটন
const promoLoginBtn = document.getElementById('promo-login-btn');

// ৬. রিডাইরেক্ট হয়ে ফিরে আসার পর ডাটা রিকভারি হ্যান্ডেলিং
if(googleLoginBtn) {
    googleLoginBtn.disabled = true;
    googleLoginBtn.innerHTML = 'অ্যাকাউন্ট চেক করা হচ্ছে...';
}

getRedirectResult(auth).then((result) => {
    if(result) authError.style.display = "none";
}).catch((error) => {
    if (error.code !== 'auth/redirect-cancelled-by-user') {
        showError("লগইন সম্পন্ন করা যায়নি। (" + error.message + ")");
    }
}).finally(() => {
    if(googleLoginBtn && !window.currentUser) {
        googleLoginBtn.disabled = false;
        googleLoginBtn.innerHTML = '<img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" style="width: 24px;"> গুগল দিয়ে লগইন করুন';
    }
});

// ৭. হাইব্রিড (স্মার্ট) লগইন ফাংশন
if(googleLoginBtn) {
    googleLoginBtn.addEventListener('click', () => {
        // বাটন ডিসেবল বা HTML চেঞ্জ করা যাবে না, করলে ব্রাউজার পপ-আপ ব্লক করে দেয়!
        signInWithPopup(auth, googleProvider).catch((error) => {
            if (error.code === 'auth/popup-blocked') {
                // পপ-আপ ব্লক হলে অটোমেটিক রিডাইরেক্ট মেথডে ট্রাই করবে
                googleLoginBtn.innerHTML = 'রিডাইরেক্ট করা হচ্ছে...';
                signInWithRedirect(auth, googleProvider);
            } else {
                showError("লগইন বাতিল করা হয়েছে।");
                console.error(error);
            }
        });
    });
}

// নতুন: প্রমোশনাল লগইন বাটনের ইভেন্ট লিসেনার
if(promoLoginBtn) {
    promoLoginBtn.addEventListener('click', () => {
        signInWithPopup(auth, googleProvider).catch((error) => {
            if (error.code === 'auth/popup-blocked') {
                promoLoginBtn.innerHTML = 'রিডাইরেক্ট করা হচ্ছে...';
                signInWithRedirect(auth, googleProvider);
            } else {
                showError("লগইন বাতিল করা হয়েছে।");
                console.error(error);
            }
        });
    });
}

// ৮. লগআউট প্রসেস
if(logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        signOut(auth).catch((error) => { console.error("লগআউট এরর: ", error); });
    });
}

// ৯. অথেনটিকেশন ও অ্যাডমিন ট্র্যাকার (মেনু নিয়ন্ত্রণ)
onAuthStateChanged(auth, async (user) => {
    if (user) {
        window.currentUser = user; 
        window.isGuest = false; // লগইন সফল হলে গেস্ট মোড বাতিল
        
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

        // নতুন: যদি গেস্ট মোডে পরীক্ষা দিয়ে ডাটা জমা থাকে, তা লিডারবোর্ডে পাঠিয়ে দেওয়া
        if (window.lastGuestResult) {
            if (window.saveGlobalLeaderboard) {
                await window.saveGlobalLeaderboard({
                    ...window.lastGuestResult,
                    userName: user.displayName || "অজ্ঞাত ইউজার",
                    userEmail: user.email
                });
            }
            window.lastGuestResult = null; // পাঠানো শেষ, ডাটা মুছে দেওয়া হলো
            
            // প্রমোশনাল সেকশনটি হাইড করা
            const guestPromoSection = document.getElementById('guest-promo-section');
            if(guestPromoSection) {
                guestPromoSection.style.display = "none";
            }
        }
        
        window.dispatchEvent(new Event('app-ready'));
    } else {
        window.currentUser = null;
        
        // গেস্ট মোডে না থাকলে তবেই লগইন পেজে পাঠাবে
        if (!window.isGuest) {
            authSection.style.display = "flex";
            mainApp.style.display = "none";
        }
        
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