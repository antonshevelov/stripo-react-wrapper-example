import {
  forwardRef,
  type CSSProperties,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react';
import {
  DEFAULT_STRIPO_SCRIPT_URL,
  loadStripoEditorScript,
} from '../lib/stripoScriptLoader';
import type {
  StripoActionsApi,
  StripoCompileEmailResult,
  StripoEditorConfig,
  StripoTemplate,
} from '../types/stripo';

const DEFAULT_AUTH_URL = 'https://plugins.stripo.email/api/v1/auth';

export interface StripoButtonSelectors {
  codeEditorButtonSelector?: string;
  undoButtonSelector?: string;
  redoButtonSelector?: string;
  mobileViewButtonSelector?: string;
  desktopViewButtonSelector?: string;
  versionHistoryButtonSelector?: string;
}

export interface StripoClientAuth {
  pluginId: string;
  secretKey: string;
  userId: string;
  role?: 'admin' | 'user';
  authUrl?: string;
}

export interface StripoEditorProps {
  template: StripoTemplate;
  metadata: Record<string, unknown>;
  auth?: StripoClientAuth;
  getAuthToken?: () => Promise<string>;
  scriptUrl?: string;
  locale?: string;
  className?: string;
  style?: CSSProperties;
  buttonSelectors?: StripoButtonSelectors;
  editorConfig?: Record<string, unknown>;
  onReady?: () => void;
  onTemplateLoaded?: () => void;
  onSaveCompleted?: (error?: unknown) => void;
  onEvent?: (type: string, params: unknown) => void;
  onUserListChange?: (users: unknown[]) => void;
  onError?: (error: Error) => void;
}

export interface StripoEditorHandle {
  save: () => Promise<void>;
  getTemplateData: () => Promise<StripoTemplate>;
  compileEmail: () => Promise<StripoCompileEmailResult>;
  undo: () => void;
  redo: () => void;
  isReady: () => boolean;
}

function normalizeError(error: unknown, fallbackMessage: string): Error {
  if (error instanceof Error) {
    return error;
  }

  if (typeof error === 'string' && error.length > 0) {
    return new Error(error);
  }

  return new Error(fallbackMessage);
}

async function fetchTokenFromClientAuth(auth: StripoClientAuth): Promise<string> {
  const { pluginId, secretKey, userId, role = 'admin', authUrl = DEFAULT_AUTH_URL } =
    auth;

  if (!pluginId || !secretKey || !userId) {
    throw new Error(
      'pluginId, secretKey and userId are required for client-side Stripo authentication.',
    );
  }

  const response = await fetch(authUrl, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      pluginId,
      secretKey,
      userId,
      role,
    }),
  });

  if (!response.ok) {
    throw new Error(`Unable to refresh Stripo token. Status: ${response.status}`);
  }

  const result = (await response.json()) as { token?: string };
  if (!result.token) {
    throw new Error('Stripo auth response does not contain a token.');
  }

  return result.token;
}

function resolveAuthToken(
  getAuthToken?: () => Promise<string>,
  auth?: StripoClientAuth,
): Promise<string> {
  if (getAuthToken) {
    return getAuthToken();
  }

  if (auth) {
    return fetchTokenFromClientAuth(auth);
  }

  return Promise.reject(
    new Error('Missing auth strategy. Provide getAuthToken or auth credentials.'),
  );
}

function getActionsApi(): StripoActionsApi {
  const actionsApi = window.StripoEditorApi?.actionsApi;
  if (!actionsApi) {
    throw new Error(
      'Stripo actions API is unavailable. Ensure the editor is initialized first.',
    );
  }

  return actionsApi;
}

function saveTemplate(): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      getActionsApi().save((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    } catch (error) {
      reject(error);
    }
  });
}

function readTemplateData(): Promise<StripoTemplate> {
  return new Promise((resolve, reject) => {
    try {
      getActionsApi().getTemplateData((template) => {
        resolve(template);
      });
    } catch (error) {
      reject(error);
    }
  });
}

function compileTemplate(): Promise<StripoCompileEmailResult> {
  return new Promise((resolve, reject) => {
    try {
      getActionsApi().compileEmail({
        callback: (error, html, ampHtml, ampErrors) => {
          if (error) {
            reject(error);
            return;
          }

          resolve({
            html,
            ampHtml,
            ampErrors,
          });
        },
      });
    } catch (error) {
      reject(error);
    }
  });
}

function undoChange(): void {
  getActionsApi().undo();
}

function redoChange(): void {
  getActionsApi().redo();
}

export const StripoEditor = forwardRef<StripoEditorHandle, StripoEditorProps>(
  function StripoEditor(
    {
      template,
      metadata,
      auth,
      getAuthToken,
      scriptUrl = DEFAULT_STRIPO_SCRIPT_URL,
      locale = 'en',
      className,
      style,
      buttonSelectors,
      editorConfig,
      onReady,
      onTemplateLoaded,
      onSaveCompleted,
      onEvent,
      onUserListChange,
      onError,
    },
    ref,
  ) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const isReadyRef = useRef(false);
    const initRunIdRef = useRef(0);

    useImperativeHandle(
      ref,
      () => ({
        save: saveTemplate,
        getTemplateData: readTemplateData,
        compileEmail: compileTemplate,
        undo: undoChange,
        redo: redoChange,
        isReady: () => isReadyRef.current,
      }),
      [],
    );

    useEffect(() => {
      if (isReadyRef.current) {
        return;
      }

      const runId = ++initRunIdRef.current;
      let isCancelled = false;

      const initEditor = async () => {
        if (!containerRef.current) {
          return;
        }

        try {
          await loadStripoEditorScript(scriptUrl);
          await Promise.resolve();

          if (
            isCancelled ||
            runId !== initRunIdRef.current ||
            !containerRef.current ||
            !window.UIEditor
          ) {
            return;
          }

          const initConfig: StripoEditorConfig = {
            html: template.html,
            css: template.css,
            metadata,
            locale,
            onTokenRefreshRequest: (callback) => {
              void resolveAuthToken(getAuthToken, auth)
                .then(callback)
                .catch((error) => {
                  onError?.(
                    normalizeError(error, 'Failed to refresh Stripo access token.'),
                  );
                });
            },
            onTemplateLoaded,
            onSaveCompleted,
            onEvent,
            onUserListChange,
            ...buttonSelectors,
            ...editorConfig,
          };

          window.UIEditor.initEditor(containerRef.current, initConfig);
          isReadyRef.current = true;
          onReady?.();
        } catch (error) {
          onError?.(normalizeError(error, 'Failed to initialize Stripo editor.'));
        }
      };

      void initEditor();

      return () => {
        isCancelled = true;
      };
    }, [
      auth,
      buttonSelectors,
      editorConfig,
      getAuthToken,
      locale,
      metadata,
      onError,
      onEvent,
      onReady,
      onSaveCompleted,
      onTemplateLoaded,
      onUserListChange,
      scriptUrl,
      template.css,
      template.html,
    ]);

    return <div ref={containerRef} className={className} style={style} />;
  },
);
