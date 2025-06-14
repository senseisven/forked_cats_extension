import { useState, useEffect } from 'react';
import '@src/Options.css';
import { Button } from '@extension/ui';
import { withErrorBoundary, withSuspense } from '@extension/shared';
import { t } from '@extension/i18n';
import { generalSettingsStore, type ThemeMode } from '@extension/storage';
import { GeneralSettings } from './components/GeneralSettings';
import { ModelSettings } from './components/ModelSettings';
import { FirewallSettings } from './components/FirewallSettings';

type TabTypes = 'general' | 'models' | 'firewall';

const TABS: { id: TabTypes; icon: string; label: string }[] = [
  { id: 'general', icon: '⚙️', label: t('generalTab') },
  { id: 'models', icon: '📊', label: t('modelsTab') },
  { id: 'firewall', icon: '🔒', label: t('firewallTab') },
];

const Options = () => {
  const [activeTab, setActiveTab] = useState<TabTypes>('models');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [themeMode, setThemeMode] = useState<ThemeMode>('light');

  // Load theme settings and determine dark mode
  useEffect(() => {
    const loadThemeSettings = async () => {
      try {
        const settings = await generalSettingsStore.getSettings();
        setThemeMode(settings.themeMode);

        // Determine if dark mode should be active
        if (settings.themeMode === 'system') {
          const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
          setIsDarkMode(darkModeMediaQuery.matches);

          const handleChange = (e: MediaQueryListEvent) => {
            setIsDarkMode(e.matches);
          };

          darkModeMediaQuery.addEventListener('change', handleChange);
          return () => darkModeMediaQuery.removeEventListener('change', handleChange);
        } else {
          setIsDarkMode(settings.themeMode === 'dark');
        }
      } catch (error) {
        console.error('Failed to load theme settings:', error);
        // Fallback to light mode (warm cream theme)
        setThemeMode('light');
        setIsDarkMode(false);
      }
    };

    loadThemeSettings();
  }, [themeMode]); // Re-run when themeMode changes

  const handleTabClick = (tabId: TabTypes) => {
    setActiveTab(tabId);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return <GeneralSettings isDarkMode={isDarkMode} />;
      case 'models':
        return <ModelSettings isDarkMode={isDarkMode} />;
      case 'firewall':
        return <FirewallSettings isDarkMode={isDarkMode} />;
      default:
        return null;
    }
  };

  return (
    <div
      className={`flex min-h-screen min-w-[768px] ${isDarkMode ? 'bg-slate-900' : 'bg-[#ede2c7]'} ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
      {/* Vertical Navigation Bar */}
      <nav
        className={`w-56 border-r ${isDarkMode ? 'border-slate-700 bg-slate-800/80' : 'border-[#d4c4a8] bg-[#8b7355]/10'} backdrop-blur-sm`}>
        <div className="p-4">
          <h1 className={`mb-6 text-xl font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
            {t('settingsTitle')}
          </h1>
          <ul className="space-y-2">
            {TABS.map(item => (
              <li key={item.id}>
                <Button
                  onClick={() => handleTabClick(item.id)}
                  className={`flex w-full items-center space-x-2 rounded-lg px-4 py-2 text-left text-base 
                    ${
                      activeTab !== item.id
                        ? `${isDarkMode ? 'bg-slate-700/70 text-gray-300 hover:text-white' : 'bg-[#8b7355]/15 font-medium text-gray-700 hover:text-white'} backdrop-blur-sm`
                        : `${isDarkMode ? 'bg-sky-800/50' : 'bg-[#8b7355]'} text-white backdrop-blur-sm`
                    }`}>
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Button>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className={`flex-1 ${isDarkMode ? 'bg-slate-800/50' : 'bg-white/20'} p-8 backdrop-blur-sm`}>
        <div className="mx-auto min-w-[512px] max-w-screen-lg">{renderTabContent()}</div>
      </main>
    </div>
  );
};

export default withErrorBoundary(withSuspense(Options, <div>{t('loadingText')}</div>), <div>{t('errorOccurred')}</div>);
