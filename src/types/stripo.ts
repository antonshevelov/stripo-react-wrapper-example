export interface StripoTemplate {
  html: string;
  css: string;
}

export interface StripoCompileEmailResult {
  html: string;
  ampHtml?: string;
  ampErrors?: unknown;
}

export interface StripoActionsApi {
  save(callback: (error?: unknown) => void): void;
  getTemplateData(callback: (template: StripoTemplate) => void): void;
  undo(): void;
  redo(): void;
  compileEmail(options: {
    callback: (
      error: unknown,
      html: string,
      ampHtml?: string,
      ampErrors?: unknown,
    ) => void;
    [key: string]: unknown;
  }): void;
}

export interface StripoEditorApiGlobal {
  actionsApi: StripoActionsApi;
  versionHistoryApi?: {
    openVersionHistory?: (...args: unknown[]) => void;
    closeVersionHistory?: () => void;
  };
}

export interface StripoEditorConfig {
  html: string;
  css: string;
  metadata: Record<string, unknown>;
  locale?: string;
  onTokenRefreshRequest: (callback: (token: string) => void) => void;
  onTemplateLoaded?: () => void;
  onSaveCompleted?: (error?: unknown) => void;
  onEvent?: (type: string, params: unknown) => void;
  onUserListChange?: (users: unknown[]) => void;
  codeEditorButtonSelector?: string;
  undoButtonSelector?: string;
  redoButtonSelector?: string;
  mobileViewButtonSelector?: string;
  desktopViewButtonSelector?: string;
  versionHistoryButtonSelector?: string;
  [key: string]: unknown;
}

export interface UIEditorGlobal {
  initEditor(container: HTMLElement, config: StripoEditorConfig): void;
}

declare global {
  interface Window {
    UIEditor?: UIEditorGlobal;
    StripoEditorApi?: StripoEditorApiGlobal;
  }
}
