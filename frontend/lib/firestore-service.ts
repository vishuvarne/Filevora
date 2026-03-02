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
    async saveUserProfile(user: UserProfile) {
        try {
            const { db } = await import("./firebase");
            const { doc, setDoc, serverTimestamp } = await import("firebase/firestore/lite");
            const userRef = doc(db, "users", user.uid);
            await setDoc(userRef, {
                ...user,
                lastLogin: serverTimestamp()
            }, { merge: true });
        } catch (error) {
            console.error("Error saving user profile:", error);
        }
    },

    async logConversion(log: ConversionLog) {
        try {
            const { db } = await import("./firebase");
            const { collection, addDoc, serverTimestamp } = await import("firebase/firestore/lite");
            await addDoc(collection(db, "conversions"), {
                ...log,
                timestamp: serverTimestamp()
            });
        } catch (error) {
            console.error("Error logging conversion:", error);
        }
    },

    async getUserHistory(userId: string) {
        try {
            const { db } = await import("./firebase");
            const { collection, query, where, orderBy, limit, getDocs } = await import("firebase/firestore/lite");
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
            return [];
        }
    },

    async subscribeToNewsletter(email: string) {
        try {
            const { db } = await import("./firebase");
            const { collection, addDoc, serverTimestamp } = await import("firebase/firestore/lite");
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
