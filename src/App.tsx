import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './App.css';
import {
  StripoEditor,
  type StripoEditorHandle,
} from './components/StripoEditor';
import { fallbackTemplate, loadDemoTemplate } from './lib/loadDemoTemplate';
import type { StripoTemplate } from './types/stripo';

const CONTROL_IDS = {
  undo: 'stripo-undo-button',
  redo: 'stripo-redo-button',
  history: 'stripo-history-button',
  code: 'stripo-code-editor-button',
  desktop: 'stripo-desktop-view-button',
  mobile: 'stripo-mobile-view-button',
} as const;

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string' && error.length > 0) {
    return error;
  }

  return 'Unknown error';
}

function App() {
  const editorRef = useRef<StripoEditorHandle>(null);
  const [template, setTemplate] = useState<StripoTemplate | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [isCodeEditorActive, setIsCodeEditorActive] = useState(false);
  const [isHistoryActive, setIsHistoryActive] = useState(false);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>(
    'desktop',
  );

  const pluginId = import.meta.env.VITE_STRIPO_PLUGIN_ID?.trim() ?? '';
  const secretKey = import.meta.env.VITE_STRIPO_SECRET_KEY?.trim() ?? '';
  const userId = import.meta.env.VITE_STRIPO_USER_ID?.trim() || '1';
  const tokenEndpoint = import.meta.env.VITE_STRIPO_TOKEN_ENDPOINT?.trim() ?? '';
  const hasClientCredentials = pluginId.length > 0 && secretKey.length > 0;
  const isDirectStripoAuthEndpoint =
    tokenEndpoint === 'https://plugins.stripo.email/api/v1/auth';
  const canUseTokenEndpoint =
    tokenEndpoint.length > 0 &&
    (!isDirectStripoAuthEndpoint || hasClientCredentials);
  const canInitializeEditor =
    hasClientCredentials;

  useEffect(() => {
    let isCancelled = false;

    const loadTemplate = async () => {
      try {
        const demoTemplate = await loadDemoTemplate();
        if (isCancelled) {
          return;
        }

        setTemplate(demoTemplate);
      } catch {
        if (isCancelled) {
          return;
        }

        setTemplate(fallbackTemplate);
      }
    };

    void loadTemplate();

    return () => {
      isCancelled = true;
    };
  }, []);

  const buttonSelectors = useMemo(
    () => ({
      versionHistoryButtonSelector: `#${CONTROL_IDS.history}`,
      codeEditorButtonSelector: `#${CONTROL_IDS.code}`,
      desktopViewButtonSelector: `#${CONTROL_IDS.desktop}`,
      mobileViewButtonSelector: `#${CONTROL_IDS.mobile}`,
    }),
    [],
  );

  const metadata = useMemo(
    () => ({
      emailId: `${pluginId || 'demo'}_${userId}_react`,
      userId,
      username: 'React Wrapper Demo',
      avatarUrl:
        'https://plugin.stripocdn.email/content/guids/CABINET_eab4e7d5a4603ac03f4120652a3a5a540f0c79c688514939f095f67433ed4a67/images/photo256.png',
    }),
    [pluginId, userId],
  );

  const editorConfig = useMemo(
    () => ({
      conditionsEnabled: true,
    }),
    [],
  );

  const auth = useMemo(() => {
    if (!hasClientCredentials) {
      return undefined;
    }

    return {
      pluginId,
      secretKey,
      userId,
      role: 'admin' as const,
    };
  }, [hasClientCredentials, pluginId, secretKey, userId]);

  const getAuthToken = useCallback(async (): Promise<string> => {
    if (!canUseTokenEndpoint) {
      throw new Error('Token endpoint is not configured.');
    }

    const requestBody = isDirectStripoAuthEndpoint
      ? {
          pluginId,
          secretKey,
          userId,
          role: 'admin',
        }
      : {
          userId,
          pluginId: pluginId || undefined,
          role: 'admin',
        };

    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`Token endpoint returned ${response.status}.`);
    }

    const result = (await response.json()) as { token?: string };
    if (!result.token) {
      throw new Error('Token endpoint response does not contain token.');
    }

    return result.token;
  }, [
    canUseTokenEndpoint,
    isDirectStripoAuthEndpoint,
    pluginId,
    secretKey,
    tokenEndpoint,
    userId,
  ]);

  const runAction = useCallback(async (action: () => Promise<void>) => {
    setIsBusy(true);
    try {
      await action();
    } catch (error) {
      console.error('Stripo action failed:', getErrorMessage(error));
    } finally {
      setIsBusy(false);
    }
  }, []);

  const handleSave = useCallback(() => {
    void runAction(async () => {
      if (!editorRef.current?.isReady()) {
        throw new Error('Editor is not ready yet.');
      }

      await editorRef.current.save();
    });
  }, [runAction]);

  const handleGetTemplate = useCallback(() => {
    void runAction(async () => {
      if (!editorRef.current?.isReady()) {
        throw new Error('Editor is not ready yet.');
      }

      const data = await editorRef.current.getTemplateData();
      console.log('getTemplateData result:', data);
    });
  }, [runAction]);

  const handleCompileEmail = useCallback(() => {
    void runAction(async () => {
      if (!editorRef.current?.isReady()) {
        throw new Error('Editor is not ready yet.');
      }

      const result = await editorRef.current.compileEmail();
      console.log('compileEmail result:', result);
    });
  }, [runAction]);

  const handleUndo = useCallback(() => {
    if (!editorRef.current?.isReady()) {
      return;
    }

    editorRef.current.undo();
  }, []);

  const handleRedo = useCallback(() => {
    if (!editorRef.current?.isReady()) {
      return;
    }

    editorRef.current.redo();
  }, []);

  const handleEditorError = useCallback((error: Error) => {
    console.error('Stripo editor error:', error.message);
  }, []);

  const disableActions = !template || !canInitializeEditor || isBusy;

  return (
    <div className="app-shell">
      <header className="toolbar">
        <div className="title">Stripo React Wrapper</div>

        <div className="group">
          <button
            id={CONTROL_IDS.undo}
            className="toolbar-button"
            type="button"
            disabled={disableActions}
            onClick={handleUndo}
          >
            Undo
          </button>
          <button
            id={CONTROL_IDS.history}
            className={`toolbar-button ${isHistoryActive ? 'active' : ''}`}
            type="button"
            onClick={() => setIsHistoryActive((current) => !current)}
          >
            History
          </button>
          <button
            id={CONTROL_IDS.redo}
            className="toolbar-button"
            type="button"
            disabled={disableActions}
            onClick={handleRedo}
          >
            Redo
          </button>
        </div>

        <button
          id={CONTROL_IDS.code}
          className={`toolbar-button ${isCodeEditorActive ? 'active' : ''}`}
          type="button"
          onClick={() => setIsCodeEditorActive((current) => !current)}
        >
          Code editor
        </button>

        <div className="group">
          <button
            id={CONTROL_IDS.desktop}
            className={`toolbar-button ${previewMode === 'desktop' ? 'active' : ''}`}
            type="button"
            onClick={() => setPreviewMode('desktop')}
          >
            Desktop
          </button>
          <button
            id={CONTROL_IDS.mobile}
            className={`toolbar-button ${previewMode === 'mobile' ? 'active' : ''}`}
            type="button"
            onClick={() => setPreviewMode('mobile')}
          >
            Mobile
          </button>
        </div>

        <div className="group">
          <button
            className="toolbar-button"
            type="button"
            disabled={disableActions}
            onClick={handleSave}
          >
            Manual save
          </button>
          <button
            className="toolbar-button"
            type="button"
            disabled={disableActions}
            onClick={handleGetTemplate}
          >
            getTemplateData
          </button>
          <button
            className="toolbar-button"
            type="button"
            disabled={disableActions}
            onClick={handleCompileEmail}
          >
            compileEmail
          </button>
        </div>
      </header>

      <div className="banner">
        The toolbar above is external UI. Stripo is mounted below via a React
        wrapper component.
      </div>

      <main className="workspace">
        <section className="editor-section">
          {canInitializeEditor ? (
            template ? (
              <StripoEditor
                ref={editorRef}
                template={template}
                metadata={metadata}
                getAuthToken={canUseTokenEndpoint ? getAuthToken : undefined}
                auth={auth}
                locale="en"
                buttonSelectors={buttonSelectors}
                editorConfig={editorConfig}
                className="editor-container"
                style={{ height: '100%' }}
                onError={handleEditorError}
              />
            ) : (
              <div className="placeholder">Loading template...</div>
            )
          ) : (
            <div className="placeholder">
              Add <code>VITE_STRIPO_PLUGIN_ID</code> and{' '}
              <code>VITE_STRIPO_SECRET_KEY</code> in <code>.env</code>.
              <br />
              Optional: add <code>VITE_STRIPO_TOKEN_ENDPOINT</code> that returns{' '}
              <code>{'{ token: "..." }'}</code>.
            </div>
          )}
        </section>

      </main>
    </div>
  );
}

export default App;
