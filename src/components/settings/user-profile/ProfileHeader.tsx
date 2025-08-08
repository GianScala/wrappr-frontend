// components/ProfileHeader.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../../src/contexts/ThemeContext';
import ProfileImage from './ProfileImage';
import SubscriptionModal from '../SubscriptionModal';
import { UserProfile } from '../../../../src/services/userService';

interface ProfileHeaderProps {
  profile: UserProfile;
  onImageUpdate: (newUrl: string | null) => void;
  onTierUpdate: (newTier: 'free' | 'pro') => void;
}

export default function ProfileHeader({ profile, onImageUpdate, onTierUpdate }: ProfileHeaderProps) {
  const theme = useTheme();
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  // Add null check
  if (!profile) {
    return null;
  }

  const handleTierPress = () => {
    if (profile.tier === 'free') {
      setShowSubscriptionModal(true);
    } else {
      Alert.alert(
        "Manage Subscription",
        "Would you like to cancel your Pro subscription? You'll retain Pro features until the end of your billing period.",
        [
          { text: "Keep Pro", style: "cancel" },
          { 
            text: "Cancel Subscription", 
            style: "destructive",
            onPress: () => handleCancelSubscription()
          }
        ]
      );
    }
  };

  const handleCancelSubscription = async () => {
    try {
      console.log('Canceling subscription...');
      // Call your cancel subscription API
    } catch (error) {
      Alert.alert('Error', 'Failed to cancel subscription');
    }
  };

  const handleSubscriptionSuccess = (newTier: 'pro') => {
    onTierUpdate(newTier);
    setShowSubscriptionModal(false);
  };

  // Get display name from username or fallback to email
  const displayName = profile.username || profile.email.split('@')[0];

  const styles = StyleSheet.create({
    // Clean container without gradient background
    container: {
      marginBottom: 16,
      paddingVertical: 4,
    },
    profileContainer: {
      backgroundColor: theme.colors.background,
      borderRadius: 18,
      borderWidth: 0.5,
      borderColor: theme.colors.border,
      padding: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    profileSection: {
      flexDirection: 'row',
      alignItems: 'center',
      width: '100%',
      marginBottom: 16,
    },
    userInfo: {
      marginLeft: 16,
      flex: 1,
    },
    name: {
      fontSize: 18,
      fontWeight: '500',
      fontFamily: 'SpaceGrotesk-Regular',
      color: theme.colors.text,
      marginBottom: 2,
    },
    email: {
      fontSize: 13,
      fontWeight: '400',
      fontFamily: 'SpaceGrotesk-Regular',
      color: theme.colors.secondary,
    },
    // Clean tier badge
    tierBadge: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 40,
      borderWidth: 0.5,
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'center',
      backgroundColor: profile.tier === 'pro'
        ? theme.colors.primary + '10'
        : theme.colors.primary + '10',
      borderColor: theme.colors.primary,
    },
    tierText: {
      fontSize: 12,
      fontWeight: '500',
      letterSpacing: 0.5,
      fontFamily: 'SpaceGrotesk-Regular',
      color: theme.colors.primary,
    },
    upgradeHint: {
      fontSize: 12,
      marginTop: 8,
      textAlign: 'center',
      fontFamily: 'SpaceGrotesk-Regular',
      color: theme.colors.secondary,
      opacity: 0.7,
    },
  });

  return (
    <>
      <View style={styles.container}>
        <View style={styles.profileContainer}>
          <View style={styles.profileSection}>
            <ProfileImage
              userId={profile.uid}
              currentImageUrl={profile.profileImage}
              onImageUpdate={onImageUpdate}
              size={68}
            />
            
            <View style={styles.userInfo}>
              <Text style={styles.name}>
                {displayName}
              </Text>
              
              <Text style={styles.email}>
                {profile.email}
              </Text>
            </View>
          </View>
          
          <TouchableOpacity
            onPress={handleTierPress}
            style={styles.tierBadge}
            activeOpacity={0.8}
          >
            <Text style={styles.tierText}>
              {profile.tier.toUpperCase()} PLAN
            </Text>
            
            {profile.tier === 'free' && (
              <Ionicons 
                name="arrow-up-circle" 
                size={16} 
                color={theme.colors.primary} 
                style={{ marginLeft: 6 }}
              />
            )}
          </TouchableOpacity>

          {profile.tier === 'free' && (
            <Text style={styles.upgradeHint}>
              Tap to upgrade to Pro
            </Text>
          )}
        </View>
      </View>

      <Modal
        visible={showSubscriptionModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSubscriptionModal(false)}
      >
        <SubscriptionModal
          onClose={() => setShowSubscriptionModal(false)}
          onSubscriptionSuccess={handleSubscriptionSuccess}
          currentTier={profile.tier}
        />
      </Modal>
    </>
  );
}