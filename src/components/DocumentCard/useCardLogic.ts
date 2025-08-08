// components/DocumentCard/useCardLogic.ts
import { useMemo } from 'react';

export interface Document {
  id: string;
  name: string;
  description?: string;
  size: number;
  uploadedAt: string;
  type: string;
  url: string;
  status: 'processing' | 'ready' | 'error';
  hasEmbeddings: boolean;
  content?: string;
  embeddings?: any;
}

export function useCardLogic(document: Document, theme: any) {
  const displayName = useMemo(() => {
    const base = document.name.split('/').pop() || document.name;
    const clean = base.replace(/^\d+_[a-z0-9]+_?/, '');
    return clean || base;
  }, [document.name]);

  const formattedSize = useMemo(() => {
    const bytes = document.size;
    if (bytes === 0) return '0 Bytes';
    const units = ['Bytes', 'KB', 'MB', 'GB'];
    const idx = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, idx)).toFixed(2)} ${units[idx]}`;
  }, [document.size]);

  const formattedDate = useMemo(() => {
    const diffMs = Date.now() - new Date(document.uploadedAt).getTime();
    const hours = diffMs / 36e5;
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${Math.floor(hours)}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(document.uploadedAt).toLocaleDateString();
  }, [document.uploadedAt]);

  const IconName = useMemo(() => {
    const map: Record<string, string> = {
      'application/pdf': 'document',
      'application/msword': 'document-text',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'document-text',
      'application/json': 'code-slash',
      'text/csv': 'grid',
      'text/markdown': 'document-outline',
      'text/plain': 'document-text',
    };
    return (
      map[document.type] ||
      Object.entries(map)
        .find(([key]) => document.type.includes(key.split('/')[1]))
        ?.[1] ||
      'document-text'
    );
  }, [document.type]);

  const statusIcon = useMemo(() => {
    const cfg = {
      processing: 'hourglass-outline',
      ready: 'checkmark-circle',
      error: 'alert-circle-outline',
    } as const;
    return cfg[document.status];
  }, [document.status]);

  const statusColor = useMemo(() => {
    const cfg = {
      processing: theme.colors.warning,
      ready: theme.colors.success,
      error: theme.colors.error,
    };
    return cfg[document.status];
  }, [document.status, theme.colors]);

  const statusText = useMemo(() => {
    const cfg = {
      processing: 'Processing embeddings...',
      ready: 'RAG',
      error: 'Processing failed',
    };
    return cfg[document.status];
  }, [document.status]);

  return {
    displayName,
    formattedSize,
    formattedDate,
    IconName,
    statusIcon,
    statusColor,
    statusText,
  };
}
