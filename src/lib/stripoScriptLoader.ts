import type { UIEditorGlobal } from '../types/stripo';

export const DEFAULT_STRIPO_SCRIPT_URL =
  'https://plugins.stripo.email/resources/uieditor/latest/UIEditor.js';

const scriptLoaders = new Map<string, Promise<UIEditorGlobal>>();

export function loadStripoEditorScript(
  scriptUrl = DEFAULT_STRIPO_SCRIPT_URL,
): Promise<UIEditorGlobal> {
  if (typeof window === 'undefined') {
    return Promise.reject(
      new Error('Stripo editor can only be initialized in a browser environment.'),
    );
  }

  if (window.UIEditor) {
    return Promise.resolve(window.UIEditor);
  }

  const existingLoader = scriptLoaders.get(scriptUrl);
  if (existingLoader) {
    return existingLoader;
  }

  const loaderPromise = new Promise<UIEditorGlobal>((resolve, reject) => {
    const onLoad = () => {
      if (!window.UIEditor) {
        scriptLoaders.delete(scriptUrl);
        reject(
          new Error(
            'Stripo script loaded, but UIEditor was not attached to the window object.',
          ),
        );
        return;
      }

      resolve(window.UIEditor);
    };

    const onError = () => {
      scriptLoaders.delete(scriptUrl);
      reject(new Error(`Failed to load Stripo script: ${scriptUrl}`));
    };

    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[src="${scriptUrl}"]`,
    );

    if (existingScript) {
      if (window.UIEditor) {
        resolve(window.UIEditor);
        return;
      }

      existingScript.addEventListener('load', onLoad, { once: true });
      existingScript.addEventListener('error', onError, { once: true });
      return;
    }

    const script = document.createElement('script');
    script.id = 'UiEditorScript';
    script.type = 'module';
    script.src = scriptUrl;
    script.async = true;
    script.addEventListener('load', onLoad, { once: true });
    script.addEventListener('error', onError, { once: true });

    document.body.appendChild(script);
  });

  scriptLoaders.set(scriptUrl, loaderPromise);
  return loaderPromise;
}
