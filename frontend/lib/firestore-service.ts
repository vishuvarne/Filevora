import { db } from "./firebase";
import { collection, doc, setDoc, addDoc, serverTimestamp, getDoc, query, where, orderBy, limit, getDocs } from "firebase/firestore";

export interface UserProfile {
    uid: string;
    email: string;
    displayName?: string;
    photoURL?: string;
    createdAt?: any;
    lastLogin?: any;
}

export interface ConversionLog {
    userId?: string; // Optional: only if logged in
    toolId: string;
    inputFormat?: string;
    outputFormat?: string;
    fileSize?: number;
    fileName?: string; // Input filename
    outputFileName?: string; // Output filename
    downloadUrl?: string; // For re-downloading (if valid)
    status: "success" | "failed";
    timestamp?: any;
}

export const FirestoreService = {
    /**
     * Creates or updates a user profile in the 'users' collection.
     * Uses the Auth UID as the document ID.
     */
    async saveUserProfile(user: UserProfile) {
        try {
            const userRef = doc(db, "users", user.uid);
            await setDoc(userRef, {
                ...user,
                lastLogin: serverTimestamp()
            }, { merge: true });
        } catch (error) {
            console.error("Error saving user profile:", error);
        }
    },

    /**
     * Logs a file conversion event to the 'conversions' collection.
     */
    async logConversion(log: ConversionLog) {
        try {
            await addDoc(collection(db, "conversions"), {
                ...log,
                timestamp: serverTimestamp()
            });
        } catch (error) {
            console.error("Error logging conversion:", error);
        }
    },

    /**
     * Fetches conversion history for a specific user.
     */
    async getUserHistory(userId: string) {
        try {
            const q = query(
                collection(db, "conversions"),
                where("userId", "==", userId),
                orderBy("timestamp", "desc"),
                limit(20)
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => {
                const data = doc.data();
                return { id: doc.id, ...data } as unknown as ConversionLog;
            });
        } catch (error) {
            console.error("Error fetching history:", error);
            // Fallback for missing index or other errors
            return [];
        }
    },

    /**
     * Adds an email to the 'subscribers' collection.
     */
    async subscribeToNewsletter(email: string) {
        try {
            // Check if already subscribed to avoid duplicates (optional but good practice)
            // For simplicity in this demo, we just add.
            await addDoc(collection(db, "subscribers"), {
                email,
                subscribedAt: serverTimestamp(),
                source: "website_footer"
            });
            return true;
        } catch (error) {
            console.error("Error subscribing:", error);
            throw error;
        }
    }
};
