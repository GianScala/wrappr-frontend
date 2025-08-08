// hooks/useChatHistory.ts
import { useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  doc,
  deleteDoc,
  getDocs,
  getDoc,
  updateDoc,
  setDoc,
  Timestamp,
  QueryDocumentSnapshot,
  DocumentData
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../contexts/AuthContext';

export interface ChatSession {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  messageCount: number;
  model: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  model?: string;
  tokens?: {
    prompt: number;
    completion: number;
    total: number;
  };
  cost?: {
    input: number;
    output: number;
    total: number;
    currency: string;
  };
}

export const useChatHistory = () => {
  const { user } = useAuth();
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Convert Firestore document to ChatSession - Updated for backend structure
  const docToSession = (doc: QueryDocumentSnapshot<DocumentData>): ChatSession => {
    const data = doc.data();
    return {
      id: doc.id,
      title: data.title || 'Untitled Chat',
      lastMessage: data.lastMessage || '',
      timestamp: data.updatedAt?.toDate() || new Date(),
      messageCount: data.messageCount || 0,
      model: data.model || 'gpt-4-mini',
      userId: data.userId,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    };
  };

  // Subscribe to real-time updates - Updated for backend collection name
  const subscribeToUserSessions = useCallback((userId: string) => {
    setLoading(true);
    setError(null);

    // Use backend collection name: chat_sessions
    const sessionsRef = collection(db, 'chat_sessions');
    const q = query(
      sessionsRef,
      where('userId', '==', userId),
      orderBy('updatedAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const sessions = snapshot.docs.map(docToSession);
        setChatSessions(sessions);
        setLoading(false);
      },
      (err) => {
        console.error('Error subscribing to chat sessions:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  // Get all chat sessions for a user
  const getUserSessions = useCallback(async (userId: string): Promise<ChatSession[]> => {
    try {
      const sessionsRef = collection(db, 'chat_sessions');
      const q = query(
        sessionsRef,
        where('userId', '==', userId),
        orderBy('updatedAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(docToSession);
    } catch (err: any) {
      console.error('Error fetching chat sessions:', err);
      throw new Error(err.message || 'Failed to fetch chat sessions');
    }
  }, []);

  // Get messages for a specific chat session - Updated for backend structure
  const getSessionMessages = useCallback(async (sessionId: string): Promise<ChatMessage[]> => {
    try {
      // Use backend subcollection name: chat_messages
      const messagesRef = collection(db, 'chat_sessions', sessionId, 'chat_messages');
      const q = query(messagesRef, orderBy('timestamp', 'asc'));
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          role: data.role,
          content: data.content,
          timestamp: data.timestamp?.toDate() || new Date(),
          model: data.model,
          tokens: data.tokens,
          cost: data.cost,
        } as ChatMessage;
      });
    } catch (err: any) {
      console.error('Error fetching messages:', err);
      throw new Error(err.message || 'Failed to fetch messages');
    }
  }, []);

  // Create a new chat session - Updated for backend compatibility
  const createSession = useCallback(async (userId: string, title?: string, model?: string): Promise<string> => {
    try {
      const sessionRef = doc(collection(db, 'chat_sessions'));
      const sessionData = {
        userId,
        title: title || 'New Chat',
        model: model || 'gpt-4-mini',
        messageCount: 0,
        lastMessage: '',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };
      
      await setDoc(sessionRef, sessionData);
      return sessionRef.id;
    } catch (err: any) {
      console.error('Error creating chat session:', err);
      throw new Error(err.message || 'Failed to create chat session');
    }
  }, []);

  // Delete a chat session and all its messages - Updated for backend structure
  const deleteSession = useCallback(async (sessionId: string) => {
    try {
      // First delete all messages in the session
      const messagesRef = collection(db, 'chat_sessions', sessionId, 'chat_messages');
      const messagesSnapshot = await getDocs(messagesRef);
      
      const deletePromises = messagesSnapshot.docs.map(doc => 
        deleteDoc(doc.ref)
      );
      
      await Promise.all(deletePromises);
      
      // Then delete the session itself
      await deleteDoc(doc(db, 'chat_sessions', sessionId));
      
      // Update local state
      setChatSessions(prev => prev.filter(session => session.id !== sessionId));
    } catch (err: any) {
      console.error('Error deleting chat session:', err);
      throw new Error(err.message || 'Failed to delete chat session');
    }
  }, []);

  // Update session metadata
  const updateSession = useCallback(async (
    sessionId: string, 
    updates: Partial<Pick<ChatSession, 'title' | 'lastMessage' | 'messageCount' | 'model'>>
  ) => {
    try {
      const sessionRef = doc(db, 'chat_sessions', sessionId);
      await updateDoc(sessionRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      });
    } catch (err: any) {
      console.error('Error updating chat session:', err);
      throw new Error(err.message || 'Failed to update chat session');
    }
  }, []);

  // Get a single chat session
  const getSession = useCallback(async (sessionId: string): Promise<ChatSession | null> => {
    try {
      const sessionDoc = await getDoc(doc(db, 'chat_sessions', sessionId));
      if (!sessionDoc.exists()) return null;
      
      return docToSession(sessionDoc as QueryDocumentSnapshot<DocumentData>);
    } catch (err: any) {
      console.error('Error fetching chat session:', err);
      throw new Error(err.message || 'Failed to fetch chat session');
    }
  }, []);

  // Refresh chat sessions manually
  const refreshChatSessions = useCallback(async () => {
    if (!user?.uid) return;
    
    setLoading(true);
    try {
      const sessions = await getUserSessions(user.uid);
      setChatSessions(sessions);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.uid, getUserSessions]);

  // Clear error state
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    chatSessions,
    loading,
    error,
    
    // Methods
    subscribeToUserSessions,
    getUserSessions,
    getSession,
    getSessionMessages,
    createSession,
    deleteSession,
    updateSession,
    refreshChatSessions,
    clearError,
  };
};