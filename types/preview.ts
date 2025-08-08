// types/preview.ts
export interface Theme {
    colors: {
      background: string;
      text: string;
      secondary: string;
      primary: string;
      border: string;
      error: string;
    };
  }
  
  export interface PreviewHeaderProps {
    title: string;
    originalName?: string;
    icon: string;
    theme: Theme;
    onClose: () => void;
  }
  
  export interface PreviewContentProps {
    isLoading: boolean;
    content: string | null;
    formatted: string | null;
    documentType: string;
    title: string;
  }
  
  export interface PreviewFooterProps {
    documentType: string;
    contentLength?: number;
    theme: Theme;
    onDone: () => void;
  }
  
  export interface DocumentPreviewModalProps {
    visible: boolean;
    onClose: () => void;
    title: string;
    originalName?: string;
    content?: string | null;
    documentType?: string;
    isLoading?: boolean;
  }
