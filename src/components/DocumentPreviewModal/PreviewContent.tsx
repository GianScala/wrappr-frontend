// components/DocumentPreviewModal/PreviewContent.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Platform, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import { useTheme } from '../../../src/contexts/ThemeContext';
import type { PreviewContentProps } from '../../../types/preview';

export const PreviewContent: React.FC<PreviewContentProps> = ({
  isLoading,
  content,
  formatted,
  documentType,
  title,
}) => {
  const [viewerUri, setViewerUri] = useState<string | null>(null);
  const [webViewError, setWebViewError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const theme = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        centerContainer: {
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: 60,
          backgroundColor: theme.colors.background,
        },
        loadingText: {
          marginTop: 12,
          fontSize: 14,
          color: theme.colors.text || theme.colors.text,
        },
        emptyText: {
          fontSize: 14,
          color: theme.colors.text || theme.colors.text,
          textAlign: 'center',
          paddingHorizontal: 20,
        },
        errorText: {
          fontSize: 14,
          color: theme.colors.error || '#ff4444',
          textAlign: 'center',
          paddingHorizontal: 20,
          marginTop: 8,
        },
        pdfContainer: {
          flex: 1,
          minHeight: 400,
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: 8,
          overflow: 'hidden',
          backgroundColor: theme.colors.card,
        },
        webView: {
          flex: 1,
          backgroundColor: theme.colors.background,
        },
        textContent: {
          fontSize: 13,
          lineHeight: 20,
          fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
          padding: 12,
          color: theme.colors.text,
        },
        debugInfo: {
          fontSize: 11,
          color: theme.colors.text + '80',
          fontStyle: 'italic',
          marginTop: 8,
        },
      }),
    [theme]
  );

  // Define loaders using styles in scope
  const LoadingView: React.FC<{ message?: string }> = ({ message = 'Loading document…' }) => (
    <View style={styles.centerContainer}>
      <ActivityIndicator size="large" />
      <Text style={styles.loadingText}>{message}</Text>
    </View>
  );

  const EmptyView: React.FC<{ error?: string }> = ({ error }) => (
    <View style={styles.centerContainer}>
      <Text style={styles.emptyText}>
        {error ? 'Failed to load document' : 'No preview available'}
      </Text>
      {error && <Text style={styles.errorText}>{error}</Text>}
      <Text style={styles.debugInfo}>
        Document Type: {documentType || 'unknown'}
        {'\n'}Content Length: {content?.length || 0} chars
        {'\n'}Title: {title || 'untitled'}
      </Text>
    </View>
  );

  const isPDF = useMemo(() => 
    documentType === 'application/pdf' || 
    title?.toLowerCase().endsWith('.pdf') ||
    false
  , [documentType, title]);

  // Simple PDF URI handling
  useEffect(() => {
    if (isPDF && content) {
      if (content.startsWith('http://') || content.startsWith('https://')) {
        setViewerUri(content);
        setWebViewError(null);
      } else {
        setWebViewError('Invalid PDF URL');
      }
    }
  }, [isPDF, content]);

  // Enhanced error logging
  const handleWebViewError = (errorEvent: any) => {
    const errorMsg = errorEvent?.nativeEvent?.description || 'Unknown WebView error';
    console.error('WebView PDF error:', errorMsg, {
      uri: viewerUri,
      documentType,
      contentLength: content?.length,
      title
    });
    setWebViewError(errorMsg);
  };

  const handleWebViewHttpError = (errorEvent: any) => {
    const statusCode = errorEvent?.nativeEvent?.statusCode;
    const url = errorEvent?.nativeEvent?.url;
    const errorMsg = `HTTP ${statusCode} error loading: ${url}`;
    console.error('WebView HTTP error:', errorMsg);
    setWebViewError(errorMsg);
  };

  // Loading state
  if (isLoading) {
    return <LoadingView />;
  }

  // No content
  if (!content || content.trim() === '') {
    return <EmptyView error="Document content is empty" />;
  }

  // PDF handling with enhanced error states
  if (isPDF) {
    if (webViewError) {
      return (
        <EmptyView 
          error={`PDF loading failed: ${webViewError}`}
        />
      );
    }

    if (!viewerUri) {
      return <LoadingView message="Preparing PDF preview…" />;
    }

    return (
      <View style={styles.pdfContainer}>
        <WebView
          source={{ uri: viewerUri }}
          onError={handleWebViewError}
          onHttpError={handleWebViewHttpError}
          style={styles.webView}
          startInLoadingState
          renderLoading={() => <LoadingView message="Loading PDF…" />}
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          javaScriptEnabled
          domStorageEnabled
          onLoadEnd={() => console.log('PDF WebView loaded successfully')}
          onLoadStart={() => console.log('PDF WebView loading started')}
        />
      </View>
    );
  }

  // Text content fallback
  const displayContent = formatted || content || 'No content available';
  
  return (
    <View>
      <Text style={styles.textContent} selectable>
        {displayContent}
      </Text>
      {/* Debug info for troubleshooting */}
      <Text style={styles.debugInfo}>
        Document Type: {documentType}
        {'\n'}Content Length: {content.length} characters
      </Text>
    </View>
  );
};