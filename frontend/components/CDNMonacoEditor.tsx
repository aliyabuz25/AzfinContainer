import React, { useEffect, useRef } from 'react';

declare global {
  interface Window {
    require?: any;
    MonacoEnvironment?: { getWorkerUrl?: () => string };
  }
}

const MONACO_LOADER = 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.39.0/min/vs/loader.min.js';
const MONACO_BASE = 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.39.0/min/vs';

let loaderPromise: Promise<void> | null = null;

const ensureMonacoLoader = () => {
  if (loaderPromise) {
    return loaderPromise;
  }

  if (typeof window === 'undefined') {
    loaderPromise = Promise.reject(new Error('Monaco editor cannot load on the server.'));
    return loaderPromise;
  }

  loaderPromise = new Promise((resolve, reject) => {
    if (window.require && window.require.config) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = MONACO_LOADER;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = (event) => reject(new Error(`Failed to load Monaco loader: ${(event as ErrorEvent).message}`));
    document.body.appendChild(script);
  });

  return loaderPromise;
};

interface CDNMonacoEditorProps {
  value: string;
  language?: string;
  height?: number;
  onChange: (value: string) => void;
}

const CDNMonacoEditor: React.FC<CDNMonacoEditorProps> = ({ value, language = 'json', height = 460, onChange }) => {
  const container = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<any>(null);
  const lastValue = useRef(value);

  useEffect(() => {
    let cancelled = false;
    let monacoInstance: typeof import('monaco-editor') | null = null;

    const initEditor = async () => {
      try {
        await ensureMonacoLoader();
        if (cancelled) return;
        window.require.config({ paths: { vs: MONACO_BASE } });
        window.require(['vs/editor/editor.main'], (monaco: typeof import('monaco-editor')) => {
          if (cancelled || !container.current) return;
          monacoInstance = monaco;
          editorRef.current = monaco.editor.create(container.current, {
            value,
            language,
            theme: 'vs-light',
            automaticLayout: true,
            minimap: { enabled: false },
          });
          lastValue.current = value;
          editorRef.current.onDidChangeModelContent(() => {
            const current = editorRef.current.getValue();
            if (current !== lastValue.current) {
              lastValue.current = current;
              onChange(current);
            }
          });
        });
      } catch (err) {
        console.error('Failed to initialize Monaco editor', err);
      }
    };

    initEditor();

    return () => {
      cancelled = true;
      if (editorRef.current) {
        editorRef.current.dispose();
        editorRef.current = null;
      }
      if (monacoInstance) {
        monacoInstance.editor.getModels().forEach((model) => model.dispose());
      }
    };
  }, []);

  useEffect(() => {
    if (editorRef.current && value !== lastValue.current) {
      const model = editorRef.current.getModel();
      if (model) {
        model.pushEditOperations([], [{ range: model.getFullModelRange(), text: value }], () => null);
        lastValue.current = value;
      }
    }
  }, [value]);

  return (
    <div
      ref={container}
      style={{ height, width: '100%', borderRadius: 24, overflow: 'hidden' }}
      className="border border-slate-200"
    />
  );
};

export default CDNMonacoEditor;
