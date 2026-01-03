import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Prompt {
  id: string;
  name: string;
  category: string;
  content: string;
}

interface HistoryItem {
  id: string;
  timestamp: string;
  question: string;
  answer: string;
  type: 'screenshot' | 'text';
  imageBase64?: string;
}

interface ApiConfig {
  apiKey: string;
  model: string;
  temperature: number;
  visionModel: string;
}

interface AppContextType {
  apiConfig: ApiConfig | null;
  prompts: Prompt[];
  history: HistoryItem[];
  setApiConfig: (config: ApiConfig) => void;
  addPrompt: (prompt: Prompt) => void;
  updatePrompt: (id: string, prompt: Prompt) => void;
  deletePrompt: (id: string) => void;
  addHistory: (item: HistoryItem) => void;
  clearHistory: () => void;
  loadData: () => Promise<void>;
  saveData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [apiConfig, setApiConfigState] = useState<ApiConfig | null>(null);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const loadData = async () => {
    if (!window.electronAPI) return;

    try {
      const allData = await window.electronAPI.getAllStore();
      
      if (allData.api) {
        setApiConfigState(allData.api);
      }
      
      if (allData.prompts) {
        setPrompts(allData.prompts);
      }
      
      if (allData.history) {
        setHistory(allData.history);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const saveData = async () => {
    if (!window.electronAPI) return;

    try {
      if (apiConfig) {
        await window.electronAPI.setStoreValue('api', apiConfig);
      }
      await window.electronAPI.setStoreValue('prompts', prompts);
      await window.electronAPI.setStoreValue('history', history);
    } catch (error) {
      console.error('Failed to save data:', error);
    }
  };

  const setApiConfig = (config: ApiConfig) => {
    setApiConfigState(config);
    if (window.electronAPI) {
      window.electronAPI.setStoreValue('api', config);
    }
  };

  const addPrompt = (prompt: Prompt) => {
    const newPrompts = [...prompts, prompt];
    setPrompts(newPrompts);
    if (window.electronAPI) {
      window.electronAPI.setStoreValue('prompts', newPrompts);
    }
  };

  const updatePrompt = (id: string, prompt: Prompt) => {
    const newPrompts = prompts.map(p => p.id === id ? prompt : p);
    setPrompts(newPrompts);
    if (window.electronAPI) {
      window.electronAPI.setStoreValue('prompts', newPrompts);
    }
  };

  const deletePrompt = (id: string) => {
    const newPrompts = prompts.filter(p => p.id !== id);
    setPrompts(newPrompts);
    if (window.electronAPI) {
      window.electronAPI.setStoreValue('prompts', newPrompts);
    }
  };

  const addHistory = (item: HistoryItem) => {
    const newHistory = [item, ...history];
    setHistory(newHistory);
    if (window.electronAPI) {
      window.electronAPI.setStoreValue('history', newHistory);
    }
  };

  const clearHistory = () => {
    setHistory([]);
    if (window.electronAPI) {
      window.electronAPI.setStoreValue('history', []);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    saveData();
  }, [apiConfig, prompts, history]);

  return (
    <AppContext.Provider
      value={{
        apiConfig,
        prompts,
        history,
        setApiConfig,
        addPrompt,
        updatePrompt,
        deletePrompt,
        addHistory,
        clearHistory,
        loadData,
        saveData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}



