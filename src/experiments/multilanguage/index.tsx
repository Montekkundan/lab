import { useState, useEffect } from 'react';
import { DefaultLayout } from '../../components/layouts/default-layout';

interface Language {
  code: string;
  name: string;
}

interface TranslationResult {
  [key: string]: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const TranslationComponent = () => {
  const [text, setText] = useState('');
  const [sourceLanguage, setSourceLanguage] = useState('hi');
  const [translation, setTranslation] = useState('');
  const [allTranslations, setAllTranslations] = useState<TranslationResult>({});
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [apiStatus, setApiStatus] = useState<'checking' | 'connected' | 'disconnected' | 'port-conflict'>('checking');

  const checkApiStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.status === 'healthy' && data.model_loaded) {
          setApiStatus('connected');
          return true;
        } else {
          setApiStatus('disconnected');
          return false;
        }
      } else {
        setApiStatus('disconnected');
        return false;
      }
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes('fetch') || err.message.includes('NetworkError') || err.name === 'TypeError') {
          try {
            await fetch(`${API_BASE_URL}/`, {
              method: 'GET',
              signal: AbortSignal.timeout(3000)
            });
            setApiStatus('port-conflict');
          } catch {
            setApiStatus('disconnected');
          }
        } else {
          setApiStatus('disconnected');
        }
      } else {
        setApiStatus('disconnected');
      }
      return false;
    }
  };

  useEffect(() => {
    const initializeComponent = async () => {
      const isApiConnected = await checkApiStatus();
      if (isApiConnected) {
        await fetchLanguages();
      }
    };
    
    initializeComponent();
    
    const interval = setInterval(checkApiStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchLanguages = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/languages`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setLanguages(data.supported_languages || []);
    } catch (err) {
      console.error('Failed to fetch languages:', err);
      setError('Failed to fetch supported languages. Make sure the API server is running.');
    }
  };

  const handleTranslate = async () => {
    if (!text.trim()) return;
    
    const isConnected = await checkApiStatus();
    if (!isConnected) {
      setError('API server is not available. Please ensure the model server is running on localhost:8000.');
      return;
    }

    setLoading(true);
    setError('');
    setTranslation('');

    try {
      const response = await fetch(`${API_BASE_URL}/translate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          source_language: sourceLanguage
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Translation response:', data);
      
      if (!data.translated_text || data.translated_text.trim() === '') {
        setError('No translation available for this text. The model was trained on 1% of AI4Bharat Samanantar dataset and may not have learned this particular text pattern.');
        return;
      }
      
      setTranslation(data.translated_text);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Translation failed: ${errorMessage}`);
      console.error('Translation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTranslateAll = async () => {
    if (!text.trim()) return;
    
    const isConnected = await checkApiStatus();
    if (!isConnected) {
      setError('API server is not available. Please ensure the model server is running on localhost:8000.');
      return;
    }

    setLoading(true);
    setError('');
    setAllTranslations({});

    try {
      const response = await fetch(`${API_BASE_URL}/translate-all`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Multi-translation response:', data);
      
      const translations = data.translations || {};
      const hasValidTranslations = Object.values(translations).some(
        (translation) => translation && String(translation).trim() !== ''
      );
      
      if (!hasValidTranslations) {
        setError('No translations available for this text. The model was trained on 1% of AI4Bharat Samanantar dataset and may not have learned this particular text pattern.');
        return;
      }
      
      setAllTranslations(translations);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Translation failed: ${errorMessage}`);
      console.error('Multi-translation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderApiStatusBanner = () => {
    if (apiStatus === 'checking') {
      return (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 dark:bg-blue-900 dark:border-blue-700">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
            <span className="text-blue-800 dark:text-blue-200">Checking API server status...</span>
          </div>
        </div>
      );
    }

    if (apiStatus === 'connected') {
      return (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 dark:bg-green-900 dark:border-green-700">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-green-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-green-800 dark:text-green-200">✅ API server connected and model loaded</span>
          </div>
        </div>
      );
    }

    if (apiStatus === 'port-conflict') {
      return (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 dark:bg-orange-900 dark:border-orange-700">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-orange-800 dark:text-orange-200">
                Port Conflict Detected
              </h3>
              <div className="mt-2 text-sm text-orange-700 dark:text-orange-300">
                <p>Another application is running on port 8000. Please:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Stop the other application using port 8000</li>
                  <li>Start the translation model API server: <code className="bg-orange-100 dark:bg-orange-800 px-1 rounded">python api_server.py</code></li>
                  <li>Refresh this page</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (apiStatus === 'disconnected') {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 dark:bg-red-900 dark:border-red-700">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                API Server Not Running
              </h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                <p>This experiment requires the translation model API server to be running on localhost:8000.</p>
                <div className="mt-2">
                  <p className="font-medium">To start the server:</p>
                  <ol className="list-decimal list-inside mt-1 space-y-1">
                    <li>Clone the repository: <code className="bg-red-100 dark:bg-red-800 px-1 rounded">git clone https://github.com/Montekkundan/pytorch-transformer</code></li>
                    <li>Follow the setup instructions in the repository</li>
                    <li>Run: <code className="bg-red-100 dark:bg-red-800 px-1 rounded">python api_server.py</code></li>
                    <li>Wait for the model to load</li>
                    <li>Refresh this page</li>
                  </ol>
                  <p className="mt-2">
                    📖 <a href="https://www.montek.dev/post/building-google-translate-from-scratch-kinda" target="_blank" rel="noopener noreferrer" className="underline hover:text-red-900 dark:hover:text-red-100">Learn more: Building Google Translate from Scratch (kinda)</a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold text-center mb-8">
        AI Translation Tool
      </h1>

      {renderApiStatusBanner()}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 dark:bg-yellow-900 dark:border-yellow-700">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              Model Limitation Notice
            </h3>
            <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
              <p>This model was trained on 1% of the AI4Bharat Samanantar dataset. It may not translate all text accurately or may return empty results for certain inputs.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="text-sm text-gray-600 text-center mb-4">
        API Server: {API_BASE_URL} • Status: {apiStatus === 'connected' ? '🟢 Connected' : apiStatus === 'checking' ? '🟡 Checking...' : '🔴 Disconnected'}
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Select Source Language (for translation to English):
          </label>
          <select
            value={sourceLanguage}
            onChange={(e) => setSourceLanguage(e.target.value)}
            disabled={apiStatus !== 'connected'}
            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {languages.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name} ({lang.code})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Enter text to translate:
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={apiStatus === 'connected' ? "Enter your text here..." : "API server required to use translation..."}
            disabled={apiStatus !== 'connected'}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            rows={4}
          />
        </div>

        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
          <button
            onClick={handleTranslate}
            disabled={loading || !text.trim() || apiStatus !== 'connected'}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Translating...' : `Translate ${sourceLanguage.toUpperCase()} → English`}
          </button>

          <button
            onClick={handleTranslateAll}
            disabled={loading || !text.trim() || apiStatus !== 'connected'}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Translating...' : 'Translate English → All Indian Languages'}
          </button>
        </div>

        <div className="text-xs text-gray-500">
          <p>• First button: Translates from selected Indian language to English</p>
          <p>• Second button: Translates English text to all 11 Indian languages</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg dark:bg-red-900 dark:border-red-600 dark:text-red-100">
          Error: {error}
        </div>
      )}

      {translation && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">
            Translation from {sourceLanguage.toUpperCase()} to English:
          </h3>
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-900 dark:border-blue-700">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Original ({sourceLanguage}):</div>
            <div className="mb-3 font-medium">{text}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Translation (English):</div>
            <div className="font-medium text-blue-800 dark:text-blue-200">{translation}</div>
          </div>
        </div>
      )}

      {Object.keys(allTranslations).length > 0 && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">English → All Indian Languages:</h3>
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Original (English): <span className="font-medium">{text}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(allTranslations).map(([lang, translation]) => {
              const langInfo = languages.find(l => l.code === lang);
              const translationText = String(translation).trim();
              
              return (
                <div key={lang} className="p-3 bg-green-50 border border-green-200 rounded-lg dark:bg-green-900 dark:border-green-700">
                  <div className="text-sm font-medium text-green-700 mb-1 dark:text-green-300">
                    {langInfo?.name || lang} ({lang})
                  </div>
                  <div className="text-gray-800 dark:text-gray-200 font-medium">
                    {translationText || (
                      <span className="italic text-gray-500 dark:text-gray-400">
                        No translation available (model limitation)
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

function MultiLanguage() {
  return (
    <div className="flex w-full min-h-screen justify-center items-start py-8">
      <TranslationComponent />
    </div>
  );
}

MultiLanguage.Layout = DefaultLayout;
MultiLanguage.Title = 'Multi Language Translation';
MultiLanguage.Description = 'AI-powered multi-language translation tool';
MultiLanguage.Tags = ['ai', 'translation', 'ui'];
MultiLanguage.background = 'dots';

export default MultiLanguage; 