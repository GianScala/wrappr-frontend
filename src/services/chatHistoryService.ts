// services/chatHistoryService.ts
import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  increment
} from "firebase/firestore";
import { db } from "../../config/firebase";

export interface TokenUsage {
  prompt: number;
  completion: number;
  total: number;
}

export interface CostBreakdown {
  input: number;
  output: number;
  total: number;
  currency: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Timestamp;
  tokens?: TokenUsage;
  cost?: CostBreakdown;
  model: string;
  api_key_used?: string;
  sessionId: string;
  metadata?: Record<string, any>;
}

export interface ChatSession {
  id: string;
  userId: string;
  title: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  messageCount: number;
  totalTokens: number;
  totalCost: number;
  model: string;
  isActive: boolean;
  tags: string[];
  metadata: Record<string, any>;
}

export class ChatHistoryService {
  private readonly CHAT_SESSIONS_COLLECTION = 'chat_sessions';
  private readonly CHAT_MESSAGES_COLLECTION = 'chat_messages';

  private validateMessageData(data: Partial<ChatMessage>): Omit<ChatMessage, 'id'> {
    if (!data.role || !['user', 'assistant', 'system'].includes(data.role)) {
      throw new Error('Invalid message role');
    }
    if (!data.content || typeof data.content !== 'string') {
      throw new Error('Message content is required and must be a string');
    }
    if (!data.model || typeof data.model !== 'string') {
      throw new Error('Model name is required');
    }
    return {
      role: data.role,
      content: data.content,
      timestamp: data.timestamp || (serverTimestamp() as Timestamp),
      tokens: data.tokens || { prompt: 0, completion: 0, total: 0 },
      cost: data.cost || { input: 0, output: 0, total: 0, currency: 'USD' },
      model: data.model,
      api_key_used: data.api_key_used || 'none',
      sessionId: data.sessionId || '',
      metadata: data.metadata || {}
    };
  }

  private validateSessionData(data: Partial<ChatSession>): Omit<ChatSession, 'id'> {
    if (!data.userId || typeof data.userId !== 'string') {
      throw new Error('User ID is required');
    }
    return {
      userId: data.userId,
      title: data.title || 'New Chat',
      createdAt: data.createdAt || (serverTimestamp() as Timestamp),
      updatedAt: data.updatedAt || (serverTimestamp() as Timestamp),
      messageCount: data.messageCount || 0,
      totalTokens: data.totalTokens || 0,
      totalCost: data.totalCost || 0,
      model: data.model || 'gpt-4',
      isActive: data.isActive !== undefined ? data.isActive : true,
      tags: data.tags || [],
      metadata: data.metadata || {}
    };
  }

  // 🔧 FIX: Generate unique message ID to prevent duplicates
  private generateMessageId(sessionId: string, content: string, role: string): string {
    const timestamp = Date.now();
    const contentHash = content.slice(0, 10).replace(/[^a-zA-Z0-9]/g, '');
    return `${sessionId}_${role}_${timestamp}_${contentHash}`;
  }

  async createChatSession(
    userId: string,
    title: string = 'New Chat',
    model: string,
    initialMessage?: Omit<ChatMessage, 'id' | 'timestamp' | 'sessionId'>
  ): Promise<string> {
    try {
      const sessionData = this.validateSessionData({
        userId,
        title,
        model,
        messageCount: initialMessage ? 1 : 0,
        totalTokens: initialMessage?.tokens?.total || 0,
        totalCost: initialMessage?.cost?.total || 0
      });

      // Use addDoc to let Firestore generate the session ID
      const sessionRef = await addDoc(
        collection(db, this.CHAT_SESSIONS_COLLECTION),
        {
          ...sessionData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        }
      );

      if (initialMessage) {
        await this.addMessage(sessionRef.id, {
          ...initialMessage,
          sessionId: sessionRef.id
        });
      }

      console.log("✅ Chat session created:", sessionRef.id);
      return sessionRef.id;
    } catch (error: any) {
      console.error("❌ Failed to create chat session:", error);
      throw new Error(`Failed to create chat session: ${error.message}`);
    }
  }

  // 🔧 FIX: Use setDoc with deterministic IDs instead of addDoc
  async addMessage(
    sessionId: string,
    message: Omit<ChatMessage, 'id' | 'timestamp'>
  ): Promise<string> {
    try {
      const validatedMessage = this.validateMessageData({
        ...message,
        sessionId
      });

      // 🔧 FIX: Generate unique message ID to prevent duplicates
      const messageId = this.generateMessageId(
        sessionId,
        message.content,
        message.role
      );

      // 🔧 FIX: Use setDoc with custom ID to prevent duplicates
      const messageRef = doc(
        db,
        this.CHAT_SESSIONS_COLLECTION,
        sessionId,
        this.CHAT_MESSAGES_COLLECTION,
        messageId
      );

      // Use setDoc with merge false to overwrite if exists
      await setDoc(messageRef, {
        ...validatedMessage,
        timestamp: serverTimestamp()
      }, { merge: false });

      // Update session stats
      await this.updateSessionStats(sessionId, {
        tokens: validatedMessage.tokens?.total || 0,
        cost: validatedMessage.cost?.total || 0
      });

      console.log("✅ Message added to session:", sessionId, "with ID:", messageId);
      return messageId;
    } catch (error: any) {
      console.error("❌ Failed to add message:", error);
      
      // 🔧 FIX: If document already exists, try with a different ID
      if (error.code === 'already-exists' || error.message.includes('already exists')) {
        console.warn("⚠️ Document already exists, retrying with new ID...");
        
        try {
          // Generate a new ID with additional randomness
          const retryMessageId = this.generateMessageId(
            sessionId,
            message.content + Math.random().toString(36).substring(7),
            message.role
          );
          
          const retryMessageRef = doc(
            db,
            this.CHAT_SESSIONS_COLLECTION,
            sessionId,
            this.CHAT_MESSAGES_COLLECTION,
            retryMessageId
          );

          const validatedMessage = this.validateMessageData({
            ...message,
            sessionId
          });

          await setDoc(retryMessageRef, {
            ...validatedMessage,
            timestamp: serverTimestamp()
          });

          await this.updateSessionStats(sessionId, {
            tokens: validatedMessage.tokens?.total || 0,
            cost: validatedMessage.cost?.total || 0
          });

          console.log("✅ Message added to session (retry):", sessionId, "with ID:", retryMessageId);
          return retryMessageId;
        } catch (retryError: any) {
          console.error("❌ Retry also failed:", retryError);
          throw new Error(`Failed to add message after retry: ${retryError.message}`);
        }
      }
      
      throw new Error(`Failed to add message: ${error.message}`);
    }
  }

  private async updateSessionStats(
    sessionId: string,
    stats: { tokens: number; cost: number }
  ): Promise<void> {
    try {
      const sessionRef = doc(db, this.CHAT_SESSIONS_COLLECTION, sessionId);
      await updateDoc(sessionRef, {
        messageCount: increment(1),
        totalTokens: increment(stats.tokens),
        totalCost: increment(stats.cost),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("❌ Failed to update session stats:", error);
      // Don't throw error here to prevent blocking message addition
      console.warn("⚠️ Session stats update failed, but message was saved");
    }
  }

  async getUserChatSessions(
    userId: string,
    limitCount: number = 50,
    activeOnly: boolean = false
  ): Promise<ChatSession[]> {
    try {
      const constraints = [
        where("userId", "==", userId),
        orderBy("updatedAt", "desc"),
        limit(limitCount)
      ];
      if (activeOnly) constraints.unshift(where("isActive", "==", true));

      const q = query(
        collection(db, this.CHAT_SESSIONS_COLLECTION),
        ...constraints
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => ({
        id: d.id,
        ...this.validateSessionData(d.data())
      }));
    } catch (error: any) {
      console.error("❌ Failed to get user chat sessions:", error);
      throw new Error(`Failed to get user sessions: ${error.message}`);
    }
  }

  async getChatMessages(sessionId: string): Promise<ChatMessage[]> {
    try {
      const q = query(
        collection(db, this.CHAT_SESSIONS_COLLECTION, sessionId, this.CHAT_MESSAGES_COLLECTION),
        orderBy("timestamp", "asc")
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => ({
        id: d.id,
        ...this.validateMessageData(d.data())
      }));
    } catch (error: any) {
      console.error("❌ Failed to get chat messages:", error);
      throw new Error(`Failed to get messages: ${error.message}`);
    }
  }

  async updateChatSession(
    sessionId: string,
    updates: Partial<Omit<ChatSession, 'id' | 'userId' | 'createdAt'>>
  ): Promise<void> {
    try {
      const sessionRef = doc(db, this.CHAT_SESSIONS_COLLECTION, sessionId);
      await updateDoc(sessionRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error: any) {
      console.error("❌ Failed to update chat session:", error);
      throw new Error(`Failed to update session: ${error.message}`);
    }
  }

  async deleteChatSession(sessionId: string): Promise<void> {
    try {
      // delete all messages
      const msgs = await getDocs(
        collection(db, this.CHAT_SESSIONS_COLLECTION, sessionId, this.CHAT_MESSAGES_COLLECTION)
      );
      await Promise.all(msgs.docs.map(d => deleteDoc(d.ref)));
      // then delete session
      await deleteDoc(doc(db, this.CHAT_SESSIONS_COLLECTION, sessionId));
    } catch (error: any) {
      console.error("❌ Failed to delete chat session:", error);
      throw new Error(`Failed to delete session: ${error.message}`);
    }
  }

  async deactivateSession(sessionId: string): Promise<void> {
    await this.updateChatSession(sessionId, { isActive: false });
  }

  async getActiveSession(userId: string): Promise<ChatSession | null> {
    try {
      const sessions = await this.getUserChatSessions(userId, 1, true);
      return sessions[0] || null;
    } catch (error) {
      console.error("❌ Failed to get active session:", error);
      return null;
    }
  }

  async searchChatSessions(
    userId: string,
    searchTerm: string,
    limitCount: number = 20
  ): Promise<ChatSession[]> {
    try {
      const all = await this.getUserChatSessions(userId, limitCount);
      return all.filter(s =>
        s.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    } catch (error: any) {
      console.error("❌ Failed to search chat sessions:", error);
      throw new Error(`Search failed: ${error.message}`);
    }
  }
}