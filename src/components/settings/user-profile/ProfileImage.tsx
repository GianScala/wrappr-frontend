// components/ProfileImage.tsx
import React, { useState } from 'react';
import { View, TouchableOpacity, Image, Alert, ActivityIndicator, ActionSheetIOS, Platform, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { pickImage, uploadProfileImage, deleteProfileImage } from '../../../../src/services/imageService';

interface ProfileImageProps {
  userId: string;
  currentImageUrl?: string;
  onImageUpdate: (newUrl: string | null) => void;
  size?: number;
}

export default function ProfileImage({
  userId,
  currentImageUrl,
  onImageUpdate,
  size = 80
}: ProfileImageProps) {
  const [uploading, setUploading] = useState(false);

  const handleImageOptions = () => {
    if (uploading) return;

    const options = currentImageUrl 
      ? ['Change Photo', 'Remove Photo', 'Cancel']
      : ['Add Photo', 'Cancel'];
    
    const destructiveIndex = currentImageUrl ? 1 : -1;
    const cancelIndex = options.length - 1;

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          destructiveButtonIndex: destructiveIndex,
          cancelButtonIndex: cancelIndex,
        },
        (buttonIndex) => {
          if (buttonIndex === 0) {
            handleImagePick();
          } else if (buttonIndex === 1 && currentImageUrl) {
            handleRemoveImage();
          }
        }
      );
    } else {
      const alertOptions: Array<{
        text: string;
        onPress?: () => void;
        style?: "cancel" | "destructive";
      }> = [
        { text: currentImageUrl ? "Change Photo" : "Add Photo", onPress: handleImagePick },
        { text: "Cancel", style: "cancel" }
      ];

      if (currentImageUrl) {
        alertOptions.splice(1, 0, { 
          text: "Remove Photo", 
          onPress: handleRemoveImage, 
          style: "destructive"
        });
      }

      Alert.alert("Profile Photo", "Choose an action", alertOptions);
    }
  };

  const handleImagePick = async () => {
    try {
      setUploading(true);
      const imageUri = await pickImage();
      if (!imageUri) return;

      const downloadURL = await uploadProfileImage(userId, imageUri);
      onImageUpdate(downloadURL);
      
      Alert.alert('Success', 'Profile image updated successfully');
    } catch (error: any) {
      console.error('Failed to update profile image:', error);
      
      let errorMessage = 'Failed to update profile image';
      if (error.message?.includes('Permission denied') || error.code === 'storage/unauthorized') {
        errorMessage = 'Permission denied. Please check your authentication.';
      } else if (error.message?.includes('not authenticated')) {
        errorMessage = 'Please sign in to update your profile image.';
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = async () => {
    try {
      setUploading(true);
      await deleteProfileImage(userId);
      onImageUpdate(null);
      
      Alert.alert('Success', 'Profile image removed successfully');
    } catch (error: any) {
      console.error('Failed to remove profile image:', error);
      
      let errorMessage = 'Failed to remove profile image';
      if (error.message?.includes('Permission denied') || error.code === 'storage/unauthorized') {
        errorMessage = 'Permission denied. Please check your authentication.';
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setUploading(false);
    }
  };

  return (
    <TouchableOpacity onPress={handleImageOptions} disabled={uploading}>
      <View style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        position: 'relative',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8, // Android shadow
      }}>
        {currentImageUrl ? (
          <Image
            source={{ uri: currentImageUrl }}
            style={{
              width: size,
              height: size,
              borderRadius: size / 2,
            }}
            resizeMode="cover"
            onError={() => {
              console.log('Failed to load image, showing placeholder');
              // You could call onImageUpdate(null) here to clear the broken image
            }}
          />
        ) : (
          <LinearGradient
            colors={['#6366f1', '#8b5cf6']}
            style={{
              width: size,
              height: size,
              borderRadius: size / 2,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <View style={{
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <Ionicons name="person" size={size * 0.4} color="#ffffff" />
              <Text style={{
                color: '#ffffff',
                fontSize: size * 0.08,
                fontWeight: '600',
                marginTop: 2,
                opacity: 0.8,
              }}>
                Tap to add
              </Text>
            </View>
          </LinearGradient>
        )}
        
        {uploading ? (
          <View style={{
            position: 'absolute',
            backgroundColor: 'rgba(0,0,0,0.6)',
            width: size,
            height: size,
            borderRadius: size / 2,
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <ActivityIndicator color="#fff" size="large" />
          </View>
        ) : (
          <View style={{
            position: 'absolute',
            bottom: 2,
            right: 2,
            backgroundColor: '#3b82f6',
            width: size * 0.25,
            height: size * 0.25,
            borderRadius: (size * 0.25) / 2,
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 3,
            borderColor: '#ffffff',
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
            elevation: 4,
          }}>
            <Ionicons name="camera" size={size * 0.12} color="#fff" />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}