// components/DocumentPreviewModal/usePreviewLogic.ts
import { useMemo } from 'react';

/**
 * Encapsulates icon‐selection, content formatting and style derivation.
 * Logs documentType → icon, and content → formatted preview.
 */
export function usePreviewLogic(
  content: string | null,
  documentType: string
) {
  const icon = useMemo(() => {
    const map: Record<string, string> = {
      'application/pdf': 'document',
      'application/msword': 'document-text',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'document-text',
      'application/json': 'code-slash',
      'text/csv': 'grid',
      'text/markdown': 'document-outline',
      'text/plain': 'document-text',
    };
    const sel = map[documentType] ||
      Object.entries(map).find(([k]) => documentType.includes(k.split('/')[1]))?.[1] ||
      'document-text';
    console.log(`[usePreviewLogic] documentType="${documentType}", icon="${sel}"`);
    return sel;
  }, [documentType]);

  const formatted = useMemo(() => {
    if (content == null) {
      console.log('[usePreviewLogic] no content to format');
      return null;
    }

    console.log(`[usePreviewLogic] raw content length=${content.length}`);

    if (documentType.includes('json')) {
      try {
        const p = JSON.parse(content);
        const s = JSON.stringify(p, null, 2);
        console.log('[usePreviewLogic] JSON formatted successfully');
        return s;
      } catch (e) {
        console.warn('[usePreviewLogic] JSON parse error, using raw text', e);
        return content;
      }
    }

    if (documentType.includes('csv')) {
      const lines = content.split('\n');
      if (lines.length > 1000) {
        console.log('[usePreviewLogic] CSV truncated to first 1000 lines');
        return lines.slice(0, 1000).join('\n') + '\n\n...';
      }
      return content;
    }

    if (content.length > 50000) {
      console.log('[usePreviewLogic] Text truncated to first 50KB');
      return content.substring(0, 50000) + '\n\n...';
    }

    return content;
  }, [content, documentType]);

  return { icon, formatted };
}
