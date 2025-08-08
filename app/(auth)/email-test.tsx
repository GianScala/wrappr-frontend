// app/(auth)/email-test.tsx
import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../../src/contexts/ThemeContext';
import { auth } from '../../config/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut,
  deleteUser,
} from 'firebase/auth';
import { Ionicons } from '@expo/vector-icons';

interface TestResult {
  id: string;
  time: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

const EmailTestScreen: React.FC = () => {
  const theme = useTheme();
  const [testEmail, setTestEmail] = useState('');
  const [testPassword, setTestPassword] = useState('');
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(auth.currentUser);

  useEffect(() => {
    // Use a flag to prevent duplicate state updates
    let isMounted = true;
    
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (isMounted) {
        setCurrentUser(user);
        if (user) {
          addResult('info', `Auth state changed: User ${user.email} (${user.emailVerified ? 'verified' : 'unverified'})`);
        } else {
          addResult('info', 'Auth state changed: No user');
        }
      }
    });
    
    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const addResult = (type: TestResult['type'], message: string) => {
    const result: TestResult = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // Unique ID
      time: new Date().toLocaleTimeString(),
      type,
      message,
    };
    setResults(prev => [result, ...prev].slice(0, 50)); // Keep last 50 results
  };

  const clearResults = () => {
    setResults([]);
    addResult('info', 'Test results cleared');
  };

  // Test 1: Create Test User
  const testCreateUser = async () => {
    if (!testEmail || !testPassword) {
      Alert.alert('Error', 'Please enter test email and password');
      return;
    }

    setLoading(true);
    try {
      addResult('info', `Creating test user: ${testEmail}`);
      
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        testEmail,
        testPassword
      );
      
      addResult('success', `✅ User created: ${userCredential.user.uid}`);
      addResult('info', `Email verified status: ${userCredential.user.emailVerified}`);
      
    } catch (error: any) {
      addResult('error', `❌ Create user failed: ${error.code} - ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Test 2: Send Verification Email
  const testSendVerification = async () => {
    if (!currentUser) {
      addResult('error', '❌ No user logged in');
      return;
    }

    if (currentUser.emailVerified) {
      addResult('info', '✅ User email is already verified!');
      Alert.alert('Already Verified', 'This email address is already verified.');
      return;
    }

    setLoading(true);
    try {
      addResult('info', `Sending verification email to: ${currentUser.email}`);
      
      await sendEmailVerification(currentUser, {
        // Optional: Add custom redirect URL
        url: 'https://yourapp.com/verify-success',
        handleCodeInApp: true,
      });
      
      addResult('success', '✅ Verification email sent successfully!');
      addResult('info', '📧 Check inbox and spam folder');
      addResult('info', '⏱️ Email should arrive within 1-5 minutes');
      
      Alert.alert(
        'Email Sent!',
        'Check your inbox and spam folder. The email should arrive within 1-5 minutes.\n\nIf no email arrives:\n1. Check spam/junk folder\n2. Check Firebase email quota\n3. Try a different email provider',
        [{ text: 'OK' }]
      );
      
    } catch (error: any) {
      addResult('error', `❌ Send verification failed: ${error.code} - ${error.message}`);
      
      // Check common errors
      if (error.code === 'auth/too-many-requests') {
        addResult('info', '⚠️ Rate limit hit - wait a few minutes before trying again');
        Alert.alert(
          'Rate Limit',
          'Too many requests. Please wait 10-15 minutes before trying again.',
          [{ text: 'OK' }]
        );
      } else if (error.code === 'auth/missing-email') {
        addResult('error', '❌ User account has no email address');
      } else if (error.code === 'auth/user-not-found') {
        addResult('error', '❌ User not found - may need to sign in again');
      }
    } finally {
      setLoading(false);
    }
  };

  // Test 3: Check Email Status
  const testCheckStatus = async () => {
    if (!currentUser) {
      addResult('error', '❌ No user logged in');
      return;
    }

    setLoading(true);
    try {
      addResult('info', 'Reloading user data...');
      await currentUser.reload();
      
      addResult('info', `📊 User Status:`);
      addResult('info', `- UID: ${currentUser.uid}`);
      addResult('info', `- Email: ${currentUser.email}`);
      addResult('info', `- Verified: ${currentUser.emailVerified ? '✅ YES' : '❌ NO'}`);
      addResult('info', `- Created: ${currentUser.metadata.creationTime}`);
      addResult('info', `- Last Sign In: ${currentUser.metadata.lastSignInTime}`);
      addResult('info', `- Provider: ${currentUser.providerData[0]?.providerId}`);
      
    } catch (error: any) {
      addResult('error', `❌ Status check failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Test 4: Password Reset Email
  const testPasswordReset = async () => {
    const email = testEmail || currentUser?.email;
    if (!email) {
      Alert.alert('Error', 'Please enter an email or be logged in');
      return;
    }

    setLoading(true);
    try {
      addResult('info', `Sending password reset to: ${email}`);
      
      await sendPasswordResetEmail(auth, email, {
        // Optional: Add custom redirect URL
        url: 'https://yourapp.com/reset-success',
        handleCodeInApp: true,
      });
      
      addResult('success', '✅ Password reset email sent!');
      
    } catch (error: any) {
      addResult('error', `❌ Password reset failed: ${error.code} - ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Test 5: Sign In Test
  const testSignIn = async () => {
    if (!testEmail || !testPassword) {
      Alert.alert('Error', 'Please enter test email and password');
      return;
    }

    setLoading(true);
    try {
      addResult('info', `Signing in as: ${testEmail}`);
      
      const userCredential = await signInWithEmailAndPassword(
        auth,
        testEmail,
        testPassword
      );
      
      addResult('success', `✅ Signed in successfully`);
      addResult('info', `Email verified: ${userCredential.user.emailVerified ? '✅' : '❌'}`);
      
    } catch (error: any) {
      addResult('error', `❌ Sign in failed: ${error.code} - ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Test 6: Sign Out
  const testSignOut = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      addResult('success', '✅ Signed out successfully');
    } catch (error: any) {
      addResult('error', `❌ Sign out failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Test 7: Delete Test User
  const testDeleteUser = async () => {
    if (!currentUser) {
      addResult('error', '❌ No user logged in to delete');
      return;
    }

    Alert.alert(
      'Delete User',
      `Are you sure you want to delete ${currentUser.email}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await deleteUser(currentUser);
              addResult('success', '✅ User deleted successfully');
            } catch (error: any) {
              addResult('error', `❌ Delete failed: ${error.code} - ${error.message}`);
              if (error.code === 'auth/requires-recent-login') {
                addResult('info', 'ℹ️ You need to sign in again before deleting');
              }
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  // Test 8: Check Firebase Configuration
  const testFirebaseConfig = () => {
    addResult('info', '🔍 Checking Firebase configuration...');
    
    try {
      // Check if auth is initialized
      if (!auth) {
        addResult('error', '❌ Firebase Auth not initialized');
        return;
      }
      
      // Check auth settings
      addResult('info', `✅ Auth initialized: ${auth.app.name}`);
      addResult('info', `- Current user: ${auth.currentUser ? auth.currentUser.email : 'None'}`);
      addResult('info', `- App name: ${auth.app.name}`);
      addResult('info', `- Auth domain: ${auth.app.options.authDomain || 'Not set'}`);
      
      // Check if we're in development
      if (__DEV__) {
        addResult('info', '⚠️ Running in development mode');
      }
      
      // Email sending tips
      addResult('info', '📧 Email Troubleshooting Tips:');
      addResult('info', '1. Check Firebase Console → Authentication → Templates');
      addResult('info', '2. Verify email quota (Spark plan: 100/day)');
      addResult('info', '3. Check spam/junk folders');
      addResult('info', '4. Try different email providers (Gmail works best)');
      addResult('info', '5. Disable email enumeration protection temporarily');
      
    } catch (error: any) {
      addResult('error', `❌ Config check error: ${error.message}`);
    }
  };

  const getResultIcon = (type: TestResult['type']) => {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'info': return 'ℹ️';
    }
  };

  const getResultColor = (type: TestResult['type']) => {
    switch (type) {
      case 'success': return '#4CAF50';
      case 'error': return '#F44336';
      case 'info': return theme.colors.primary;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Email Verification Tester
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Test Firebase email functionality
          </Text>
        </View>

        {/* Current User Status */}
        <View style={[styles.statusCard, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.statusTitle, { color: theme.colors.text }]}>
            Current Status
          </Text>
          <Text style={[styles.statusText, { color: theme.colors.textSecondary }]}>
            {currentUser 
              ? `Logged in as: ${currentUser.email} ${currentUser.emailVerified ? '✅' : '❌'}`
              : 'Not logged in'
            }
          </Text>
        </View>

        {/* Test Credentials */}
        <View style={[styles.inputSection, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Test Credentials
          </Text>
          
          <TextInput
            style={[styles.input, { 
              backgroundColor: theme.colors.background,
              color: theme.colors.text,
              borderColor: theme.colors.border,
            }]}
            placeholder="test@example.com"
            placeholderTextColor={theme.colors.textSecondary}
            value={testEmail}
            onChangeText={setTestEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          
          <TextInput
            style={[styles.input, { 
              backgroundColor: theme.colors.background,
              color: theme.colors.text,
              borderColor: theme.colors.border,
            }]}
            placeholder="password123"
            placeholderTextColor={theme.colors.textSecondary}
            value={testPassword}
            onChangeText={setTestPassword}
            secureTextEntry
          />
        </View>

        {/* Test Actions */}
        <View style={styles.actionsSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Test Actions
          </Text>
          
          <View style={styles.buttonGrid}>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.colors.primary }]}
              onPress={testCreateUser}
              disabled={loading}
            >
              <Ionicons name="person-add" size={20} color="white" />
              <Text style={styles.buttonText}>Create User</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.colors.primary }]}
              onPress={testSendVerification}
              disabled={loading}
            >
              <Ionicons name="mail" size={20} color="white" />
              <Text style={styles.buttonText}>Send Verification</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.colors.primary }]}
              onPress={testCheckStatus}
              disabled={loading}
            >
              <Ionicons name="refresh" size={20} color="white" />
              <Text style={styles.buttonText}>Check Status</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.colors.primary }]}
              onPress={testPasswordReset}
              disabled={loading}
            >
              <Ionicons name="key" size={20} color="white" />
              <Text style={styles.buttonText}>Reset Password</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.colors.primary }]}
              onPress={testSignIn}
              disabled={loading}
            >
              <Ionicons name="log-in" size={20} color="white" />
              <Text style={styles.buttonText}>Sign In</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.colors.primary }]}
              onPress={testSignOut}
              disabled={loading}
            >
              <Ionicons name="log-out" size={20} color="white" />
              <Text style={styles.buttonText}>Sign Out</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: '#F44336' }]}
              onPress={testDeleteUser}
              disabled={loading}
            >
              <Ionicons name="trash" size={20} color="white" />
              <Text style={styles.buttonText}>Delete User</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: '#FF9800' }]}
              onPress={testFirebaseConfig}
              disabled={loading}
            >
              <Ionicons name="settings" size={20} color="white" />
              <Text style={styles.buttonText}>Check Config</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.colors.textSecondary }]}
              onPress={clearResults}
              disabled={loading}
            >
              <Ionicons name="trash-bin" size={20} color="white" />
              <Text style={styles.buttonText}>Clear Logs</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Test Results */}
        <View style={[styles.resultsSection, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Test Results
          </Text>
          
          {loading && (
            <ActivityIndicator size="small" color={theme.colors.primary} style={styles.loader} />
          )}
          
          <ScrollView style={styles.resultsScroll} nestedScrollEnabled>
            {results.map((result) => (
              <View key={result.id} style={styles.resultItem}>
                <Text style={[styles.resultTime, { color: theme.colors.textSecondary }]}>
                  {result.time}
                </Text>
                <Text style={[styles.resultMessage, { color: getResultColor(result.type) }]}>
                  {getResultIcon(result.type)} {result.message}
                </Text>
              </View>
            ))}
            {results.length === 0 && (
              <Text style={[styles.noResults, { color: theme.colors.textSecondary }]}>
                No test results yet. Run a test to see results here.
              </Text>
            )}
          </ScrollView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  statusCard: {
    margin: 20,
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  statusText: {
    fontSize: 14,
  },
  inputSection: {
    margin: 20,
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  actionsSection: {
    marginHorizontal: 20,
    marginBottom: 10,
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
    minWidth: '47%',
    flex: 1,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  resultsSection: {
    margin: 20,
    padding: 16,
    borderRadius: 12,
    maxHeight: 400,
  },
  resultsScroll: {
    maxHeight: 300,
  },
  loader: {
    marginVertical: 10,
  },
  resultItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  resultTime: {
    fontSize: 12,
    marginBottom: 2,
  },
  resultMessage: {
    fontSize: 14,
    lineHeight: 20,
  },
  noResults: {
    textAlign: 'center',
    marginTop: 20,
    fontStyle: 'italic',
  },
});

export default EmailTestScreen;