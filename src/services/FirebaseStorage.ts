// services/FirebaseStorage.ts
import { storage } from '../../config/firebase';
import { 
  ref, 
  uploadBytes, 
  listAll, 
  deleteObject, 
  getDownloadURL, 
  getMetadata,
  uploadString 
} from 'firebase/storage';
import * as FileSystem from 'expo-file-system';


interface DocumentInfo {
  id: string;
  name: string;
  size: number;
  uploadedAt: string;
  type: string;
  url: string;
}

export class FirebaseStorage {

    async listFolders(path: string): Promise<Array<{ name: string; path: string }>> {
        try {
          const storageRef = ref(storage, path);
          const result = await listAll(storageRef);
          
          return result.prefixes.map(prefix => ({
            name: prefix.name,
            path: prefix.fullPath,
          }));
        } catch (error) {
          console.error('List folders error:', error);
          return [];
        }
      }
  
  /**
   * Upload a file from URI to Firebase Storage
   */
  async uploadFile(uri: string, path: string, mimeType: string): Promise<string> {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, blob, {
        contentType: mimeType,
      });
      
      const downloadURL = await getDownloadURL(storageRef);
      console.log(`✅ File uploaded to: ${path}`);
      
      return downloadURL;
    } catch (error) {
      console.error('❌ File upload error:', error);
      throw new Error(`Failed to upload file to ${path}`);
    }
  }

  /**
   * Upload text content directly to Firebase Storage
   */
  async uploadTextContent(content: string, path: string): Promise<string> {
    console.log('📍 Uploading to path:', path); // Add this line
    try {
      const tempUri = FileSystem.documentDirectory + `temp_${Date.now()}.json`;
      await FileSystem.writeAsStringAsync(tempUri, content);
      return await this.uploadFile(tempUri, path, 'application/json');
    } catch (error) {
      console.error('Text upload error:', error);
      throw error;
    }
  }

  /**
   * Get text content from Firebase Storage
   */
  async getTextContent(path: string): Promise<string | null> {
    try {
      const storageRef = ref(storage, path);
      const url = await getDownloadURL(storageRef);
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const content = await response.text();
      return content;
    } catch (error) {
      console.log(`📄 Could not fetch text content from ${path}:`, error);
      return null;
    }
  }


  /**
   * List all documents in a folder
   */
  async listDocuments(folderPath: string): Promise<DocumentInfo[]> {
    try {
      const storageRef = ref(storage, folderPath);
      const result = await listAll(storageRef);
      
      const documents = await Promise.all(
        result.items.map(async (item) => {
          try {
            const metadata = await getMetadata(item);
            const url = await getDownloadURL(item);
            
            return {
              id: item.name,
              name: item.name.replace(/^\d+_/, ''), // Remove timestamp prefix
              size: metadata.size,
              uploadedAt: metadata.timeCreated,
              type: metadata.contentType || 'text/plain',
              url,
            };
          } catch (error) {
            console.warn(`Could not get metadata for ${item.name}:`, error);
            return null;
          }
        })
      );
      
      // Filter out null results
      return documents.filter((doc): doc is DocumentInfo => doc !== null);
    } catch (error) {
      console.error('❌ List documents error:', error);
      throw new Error(`Failed to list documents from ${folderPath}`);
    }
  }

    /**
     * List files in a directory (returns file info)
     */
    async listFiles(path: string): Promise<Array<{ name: string; path: string }>> {
        try {
        const storageRef = ref(storage, path);
        const result = await listAll(storageRef);
        
        return result.items.map(item => ({
            name: item.name,
            path: item.fullPath,
        }));
        } catch (error) {
        console.error('List files error:', error);
        return [];
        }
    }

  /**
   * Delete a file from Firebase Storage
   */
  async deleteFile(path: string): Promise<void> {
    try {
      const storageRef = ref(storage, path);
      await deleteObject(storageRef);
      console.log(`✅ File deleted: ${path}`);
    } catch (error) {
      console.error(`❌ Delete file error for ${path}:`, error);
      throw new Error(`Failed to delete file at ${path}`);
    }
  }

  /**
   * Delete all files in a folder (used for cleanup)
   */
  async deleteFolder(folderPath: string): Promise<void> {
    try {
      const storageRef = ref(storage, folderPath);
      const result = await listAll(storageRef);
      
      // Delete all files in the folder
      await Promise.all(
        result.items.map(item => deleteObject(item))
      );
      
      // Recursively delete subfolders
      await Promise.all(
        result.prefixes.map(prefix => this.deleteFolder(prefix.fullPath))
      );
      
      console.log(`✅ Folder deleted: ${folderPath}`);
    } catch (error) {
      console.error(`❌ Delete folder error for ${folderPath}:`, error);
      throw new Error(`Failed to delete folder at ${folderPath}`);
    }
  }

  /**
   * Check if a file exists in Firebase Storage
   */
  async fileExists(path: string): Promise<boolean> {
    try {
      const storageRef = ref(storage, path);
      await getMetadata(storageRef);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(path: string): Promise<any> {
    try {
      const storageRef = ref(storage, path);
      const metadata = await getMetadata(storageRef);
      return metadata;
    } catch (error) {
      console.error(`❌ Get metadata error for ${path}:`, error);
      throw new Error(`Failed to get metadata for ${path}`);
    }
  }

  /**
   * Get storage usage for a user's folder
   */
  async getStorageUsage(userFolderPath: string): Promise<{ fileCount: number; totalSize: number }> {
    try {
      const documents = await this.listDocuments(userFolderPath);
      
      const totalSize = documents.reduce((sum, doc) => sum + doc.size, 0);
      const fileCount = documents.length;
      
      return { fileCount, totalSize };
    } catch (error) {
      console.error('❌ Get storage usage error:', error);
      return { fileCount: 0, totalSize: 0 };
    }
  }

  /**
   * Copy a file within Firebase Storage
   */
  async copyFile(sourcePath: string, destinationPath: string): Promise<string> {
    try {
      // Download the source file
      const sourceRef = ref(storage, sourcePath);
      const url = await getDownloadURL(sourceRef);
      const response = await fetch(url);
      const blob = await response.blob();
      
      // Upload to new location
      const destRef = ref(storage, destinationPath);
      await uploadBytes(destRef, blob);
      
      const newUrl = await getDownloadURL(destRef);
      console.log(`✅ File copied from ${sourcePath} to ${destinationPath}`);
      
      return newUrl;
    } catch (error) {
      console.error('❌ Copy file error:', error);
      throw new Error(`Failed to copy file from ${sourcePath} to ${destinationPath}`);
    }
  }

  /**
   * Get download URL for a file
   */
  async getDownloadUrl(path: string): Promise<string> {
    try {
      const storageRef = ref(storage, path);
      const url = await getDownloadURL(storageRef);
      return url;
    } catch (error) {
      console.error(`❌ Get download URL error for ${path}:`, error);
      throw new Error(`Failed to get download URL for ${path}`);
    }
  }
}