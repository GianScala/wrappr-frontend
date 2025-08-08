// extractors/ContentExtractor.ts
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';

const API_BASE_URL = "http://192.168.0.19:8000";

export class ContentExtractor {
  private backendUrl: string;

  constructor(backendUrl: string = API_BASE_URL) {
    this.backendUrl = backendUrl;
  }

  async extractContent(file: DocumentPicker.DocumentPickerAsset): Promise<string> {
    const mimeType = file.mimeType || '';
    const fileName = file.name.toLowerCase();
    
    try {
      if (mimeType.includes('text/') || mimeType.includes('json') || mimeType.includes('csv')) {
        return await this.extractTextContent(file.uri);
      } else if (mimeType.includes('pdf') || fileName.endsWith('.pdf')) {
        return await this.extractPdfContent(file.uri, file.name);
      } else if (mimeType.includes('word') || mimeType.includes('doc') || 
                 fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
        return await this.extractWordContent(file.uri, file.name);
      } else {
        return await this.extractTextContent(file.uri);
      }
    } catch (error) {
      console.error('Content extraction error:', error);
      throw new Error(`Failed to extract content from ${file.name}: ${error.message}`);
    }
  }

  private async extractTextContent(uri: string): Promise<string> {
    try {
      const content = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.UTF8
      });
      
      if (!content || content.trim().length === 0) {
        throw new Error('File appears to be empty');
      }
      
      return content;
    } catch (error) {
      throw new Error(`Failed to read text file: ${error.message}`);
    }
  }

  private async extractPdfContent(uri: string, fileName: string): Promise<string> {
    try {
      console.log(`🔍 PDF extraction: ${fileName}`);
      console.log(`🌐 Backend URL: ${this.backendUrl}`);
      
      // Test connectivity first
      await this.testConnectivity();
      
      const base64Data = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64
      });
      
      console.log(`📦 Base64 size: ${base64Data.length} chars`);

      const requestBody = {
        fileName,
        fileData: base64Data
      };

      console.log(`📤 Making request to: ${this.backendUrl}/api/extract/pdf`);

      const response = await fetch(`${this.backendUrl}/api/extract/pdf`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody),
        timeout: 30000
      });

      console.log(`📡 Response: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log(`❌ Error response: ${errorText}`);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log(`✅ PDF extracted: ${result.content.length} characters`);
      
      if (!result.content) {
        throw new Error('No content in response');
      }
      
      return result.content;
      
    } catch (error) {
      console.error(`❌ PDF extraction failed: ${error.message}`);
      console.error(`❌ Error type: ${error.constructor.name}`);
      
      // Return fallback content
      return `[PDF Document: ${fileName}]

This PDF document could not be processed automatically.
Please consider:
1. Converting to text format (.txt)
2. Copying and pasting content manually  
3. Saving as a different format

Error: ${error.message}`;
    }
  }

  private async extractWordContent(uri: string, fileName: string): Promise<string> {
    try {
      console.log(`📝 DOCX extraction: ${fileName}`);
      
      const base64Data = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64
      });

      const response = await fetch(`${this.backendUrl}/api/extract/docx`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          fileName,
          fileData: base64Data,
        }),
        timeout: 30000
      });

      console.log(`📡 DOCX Response: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      
      if (!result.content || result.content.trim().length === 0) {
        throw new Error('No text content found in Word document');
      }

      console.log(`✅ DOCX extracted: ${result.content.length} characters`);
      return result.content;
      
    } catch (error) {
      console.error(`❌ DOCX extraction failed: ${error.message}`);
      
      return `[Word Document: ${fileName}]

This Word document could not be processed automatically.
Please consider:
1. Converting to text format (.txt)
2. Copying and pasting content manually
3. Saving as a different format

Error: ${error.message}`;
    }
  }

  private async testConnectivity(): Promise<void> {
    try {
      console.log(`🔗 Testing connectivity to: ${this.backendUrl}`);
      
      const response = await fetch(`${this.backendUrl}/health`, {
        method: 'GET',
        timeout: 5000
      });
      
      console.log(`🔗 Health check: ${response.status}`);
      
      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`);
      }
    } catch (error) {
      console.error(`❌ Connectivity test failed: ${error.message}`);
      throw new Error(`Cannot reach backend at ${this.backendUrl}: ${error.message}`);
    }
  }

  getFileTypeFromName(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const typeMap: Record<string, string> = {
      'pdf': 'PDF Document',
      'docx': 'Word Document',
      'doc': 'Word Document',
      'txt': 'Text Document',
      'md': 'Markdown Document',
      'json': 'JSON File',
      'csv': 'CSV File',
    };
    return typeMap[ext || ''] || 'Unknown Document';
  }
}