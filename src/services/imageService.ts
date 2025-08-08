// services/imageService.ts
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { storage, auth } from "../../config/firebase";
import { updateUserProfile } from "./userService";
import * as ImagePicker from 'expo-image-picker';

export const pickImage = async (): Promise<string | null> => {
  try {
    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Permission to access media library denied');
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, // Use MediaTypeOptions for compatibility
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      return result.assets[0].uri;
    }
    return null;
  } catch (error) {
    console.error('Error picking image:', error);
    throw error;
  }
};

export const uploadProfileImage = async (userId: string, imageUri: string): Promise<string> => {
  try {
    // Ensure user is authenticated
    if (!auth.currentUser) {
      throw new Error('User not authenticated');
    }

    console.log('📸 Uploading profile image for:', userId);
    
    // Delete existing image first
    await deleteProfileImage(userId);

    // Create blob from image URI
    const response = await fetch(imageUri);
    const blob = await response.blob();

    // Create reference with timestamp for uniqueness
    const timestamp = Date.now();
    const imageRef = ref(storage, `profile_images/${userId}/profile_${timestamp}`);

    // Upload the blob
    const snapshot = await uploadBytes(imageRef, blob);
    
    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    // Update user profile with image URL
    await updateUserProfile(userId, { profileImage: downloadURL });
    
    console.log('✅ Profile image uploaded:', downloadURL);
    return downloadURL;
  } catch (error) {
    console.error('❌ Failed to upload profile image:', error);
    throw error;
  }
};

export const deleteProfileImage = async (userId: string): Promise<void> => {
  try {
    // Ensure user is authenticated
    if (!auth.currentUser) {
      throw new Error('User not authenticated');
    }

    // Create reference to user's profile images folder
    const folderRef = ref(storage, `profile_images/${userId}`);
    
    try {
      // Try to delete the folder reference (this won't work for folders)
      // Instead, we need to delete specific files
      
      // For now, try to delete a generic profile image
      const imageRef = ref(storage, `profile_images/${userId}/profile`);
      await deleteObject(imageRef);
      console.log('✅ Profile image deleted');
    } catch (error: any) {
      if (error.code === 'storage/object-not-found') {
        console.log('⚠️ Image not found or already deleted');
      } else {
        throw error;
      }
    }
    
    // Update user profile to remove image URL
    await updateUserProfile(userId, { profileImage: null });
    console.log('✅ Profile image updated: null');
  } catch (error) {
    console.error('❌ Failed to delete profile image:', error);
    throw error;
  }
};