// services/userService.ts
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../config/firebase";

export interface UserProfile {
  uid: string;
  email: string;
  tier: "free" | "pro";
  tokensUsed: number;
  tokenLimit: number;
  preferredTextModel: string;
  emailVerified: boolean;
  profileImage?: string;
  createdAt: any;
  lastActive: any;

  username?: string;
  aiStyle: "concise" | "exhaustive" | "friendly";
  appLanguage: string;
  onboardingCompleted: boolean;

  subscriptionId?: string;
  subscriptionStatus?: 'active' | 'inactive' | 'canceled' | 'past_due';
  subscriptionCurrentPeriodEnd?: Date;
  customerId?: string; 
}

export const createUserProfile = async (
  uid: string,
  email: string,
  emailVerified = false
): Promise<void> => {
  const userRef = doc(db, 'users', uid);

  const newProfile: Omit<UserProfile, 'uid'> = {
    email,
    emailVerified,
    tier: 'free',
    tokensUsed: 0,
    tokenLimit: 1_000,
    preferredTextModel: 'gpt-4o-mini',
    aiStyle: 'friendly',
    appLanguage: 'en',
    onboardingCompleted: false,
    createdAt: serverTimestamp(),
    lastActive: serverTimestamp(),
    subscriptionStatus: 'inactive',
  };

  await setDoc(userRef, newProfile);
};


export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;

  const d = snap.data();
  return {
    uid,
    emailVerified: !!d.emailVerified,
    subscriptionCurrentPeriodEnd: d.subscriptionCurrentPeriodEnd?.toDate(),
    aiStyle: d.aiStyle ?? 'friendly',
    appLanguage: d.appLanguage ?? 'en',
    onboardingCompleted: d.onboardingCompleted ?? false,
    ...d,
  } as UserProfile;
};


export const updateUserProfile = async (uid: string, updates: Partial<UserProfile>): Promise<void> => {
  console.log("📝 Updating user profile:", uid, updates);
  try {
    const userRef = doc(db, "users", uid);
    const processedUpdates = { ...updates };
    if (processedUpdates.subscriptionCurrentPeriodEnd instanceof Date) {
      processedUpdates.subscriptionCurrentPeriodEnd = processedUpdates.subscriptionCurrentPeriodEnd;
    }
    
    await updateDoc(userRef, {
      ...processedUpdates,
      lastActive: serverTimestamp(),
    });
    console.log("✅ User profile updated");
  } catch (error) {
    console.error("❌ Failed to update user profile:", error);
    throw error;
  }
};

export const updateAIPreferences = async (
  uid: string,
  preferences: {
    username?: string;
    aiStyle: "concise" | "exhaustive" | "friendly";
    preferredTextModel?: string;
  }
): Promise<void> => {
  console.log("🎭 Updating AI preferences:", uid, preferences);
  try {
    await updateUserProfile(uid, {
      ...preferences,
      onboardingCompleted: true
    });
    console.log("✅ AI preferences updated successfully");
  } catch (error) {
    console.error("❌ Failed to update AI preferences:", error);
    throw error;
  }
};

export const updateUserSubscription = async (
  uid: string, 
  subscriptionData: {
    tier: 'free' | 'pro';
    subscriptionId?: string;
    subscriptionStatus: 'active' | 'inactive' | 'canceled' | 'past_due';
    subscriptionCurrentPeriodEnd?: Date;
    customerId?: string;
    tokenLimit?: number;
  }
): Promise<void> => {
  console.log("💳 Updating user subscription:", uid, subscriptionData);
  
  const tokenLimit = subscriptionData.tier === 'pro' 
    ? 50000 // Pro users get 50k tokens
    : 1000;  // Free users get 1k tokens
  
  try {
    await updateUserProfile(uid, {
      ...subscriptionData,
      tokenLimit
    });
    console.log("✅ User subscription updated successfully");
  } catch (error) {
    console.error("❌ Failed to update user subscription:", error);
    throw error;
  }
};

export const checkSubscriptionStatus = async (uid: string): Promise<boolean> => {
  try {
    const profile = await getUserProfile(uid);
    if (!profile) return false;
    
    // Check if subscription is active and not expired
    if (profile.tier === 'pro' && profile.subscriptionStatus === 'active') {
      if (profile.subscriptionCurrentPeriodEnd) {
        return new Date() < new Date(profile.subscriptionCurrentPeriodEnd);
      }
      return true;
    }
    
    return false;
  } catch (error) {
    console.error("❌ Failed to check subscription status:", error);
    return false;
  }
};