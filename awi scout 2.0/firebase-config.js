// =====================================================
// FIREBASE CONFIGURATION — Awissawella Scout Website
// Uses Firebase Compat SDK (loaded via CDN in HTML files)
// =====================================================

const firebaseConfig = {
  apiKey: "AIzaSyCob99_7m3wJNkOKQjT9b8tuxlk04X8obI",
  authDomain: "awissawella-scouts.firebaseapp.com",
  projectId: "awissawella-scouts",
  storageBucket: "awissawella-scouts.firebasestorage.app",
  messagingSenderId: "529635721654",
  appId: "1:529635721654:web:fcf4ae0a2c2436c9228117",
  measurementId: "G-C5BJPFLNGG"
};

// Initialize Firebase (Compat mode — no ES modules needed)
firebase.initializeApp(firebaseConfig);
const _db = firebase.firestore();

// =====================================================
// window.DB — Async Database API
// All methods return Promises — use with async/await
// =====================================================
window.DB = {

    /**
     * Get all documents in a Firestore collection
     * Returns: Array of objects (each with .id field)
     */
    getCollection: async function(collectionName) {
        try {
            const snapshot = await _db.collection(collectionName).orderBy('_createdAt', 'asc').get().catch(() =>
                _db.collection(collectionName).get()
            );
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch(e) {
            console.error('DB.getCollection error:', e);
            return [];
        }
    },

    /**
     * Save (create or update) a document in Firestore
     * If obj.id exists → updates that document
     * If no obj.id    → creates a new document
     */
    saveObject: async function(collectionName, obj) {
        try {
            const { id, ...data } = obj;
            if (id) {
                await _db.collection(collectionName).doc(id).set(data, { merge: true });
            } else {
                data._createdAt = firebase.firestore.FieldValue.serverTimestamp();
                await _db.collection(collectionName).add(data);
            }
         } catch(e) {
             console.error('DB.saveObject error:', e);
             alert("Error saving data: " + e.message + "\n\nTip: Check if images are too large (>1MB) or if Firebase Rules allow writes.");
         }
     },

    /**
     * Delete a document from Firestore by id
     */
    deleteObject: async function(collectionName, id) {
        try {
            await _db.collection(collectionName).doc(id).delete();
         } catch(e) {
             console.error('DB.deleteObject error:', e);
             alert("Error deleting data: " + e.message);
         }
     },

    // =====================================================
    // Simple Admin Auth (sessionStorage — no Firebase Auth needed)
    // =====================================================
    login: function(username, password) {
        if (username === 'admin' && password === 'admin123') {
            sessionStorage.setItem('admin_auth', 'true');
            return true;
        }
        return false;
    },

    logout: function() {
        sessionStorage.removeItem('admin_auth');
    },

    isAuthenticated: function() {
        return sessionStorage.getItem('admin_auth') === 'true';
    }
};

// Backward-compat alias — so any old MockDB.xxx calls still work
window.MockDB = window.DB;
