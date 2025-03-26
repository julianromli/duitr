import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Header from '@/components/layout/Header';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Sun, Moon, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFinance } from '@/context/FinanceContext';
import LanguageSwitcher from '@/components/settings/LanguageSwitcher';
import { formatIDR } from '@/utils/currency';

// Currency data - Only keep IDR
const currencies = [
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp' },
];

const Settings: React.FC = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { updateCurrency } = useFinance();
  const location = useLocation();
  
  // Check if we need to open a specific tab from URL query params
  const urlParams = new URLSearchParams(location.search);
  const tabFromUrl = urlParams.get('tab');
  const defaultTab = tabFromUrl || 'appearance';
  
  const [initialSettings, setInitialSettings] = useState({
    theme: 'light' as 'light' | 'dark' | 'system',
    currency: 'IDR'
  });
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(initialSettings.theme);

  // Load saved settings
  useEffect(() => {
    const savedSettings = localStorage.getItem('settings');
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        const loadedSettings = {
          theme: parsedSettings.theme || 'light',
          currency: 'IDR', // Always set to IDR
        };
        setInitialSettings(loadedSettings);
        setTheme(loadedSettings.theme);
        
        // Force update currency to IDR
        updateCurrency();
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    }
  }, [updateCurrency]);

  // Apply theme effect only after user saves changes
  const applyTheme = (themeToApply: 'light' | 'dark' | 'system') => {
    const root = window.document.documentElement;
    
    if (themeToApply === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.remove('light', 'dark');
      root.classList.add(systemTheme);
    } else {
      root.classList.remove('light', 'dark');
      root.classList.add(themeToApply);
    }
  };

  const handleSave = () => {
    // Save to localStorage
    const settings = { 
      theme, 
      currency: 'IDR', // Always save as IDR
    };
    
    localStorage.setItem('settings', JSON.stringify(settings));
    
    // Dispatch an event to notify other components
    const event = new StorageEvent('storage', {
      key: 'settings',
      newValue: JSON.stringify(settings)
    });
    window.dispatchEvent(event);
    
    // Apply theme only after user saves
    applyTheme(theme);
    
    // Update initial settings
    setInitialSettings({
      theme,
      currency: 'IDR',
    });
    
    toast({
      title: t('buttons.save'),
      duration: 3000,
    });
  };

  return (
    <div className="flex flex-col h-full">
      <Header />
      <div className="flex-1 p-6 pb-24 md:pb-6 space-y-6 overflow-y-auto max-h-[calc(100vh-4rem)]">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">{t('settings.title')}</h2>
        </div>
        
        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="grid grid-cols-2 mb-6">
            <TabsTrigger value="appearance" className="flex items-center justify-center">
              <Sun className="h-5 w-5" />
              <span className="ml-2 hidden sm:block">{t('settings.appearance')}</span>
            </TabsTrigger>
            <TabsTrigger value="account" className="flex items-center justify-center">
              <User className="h-5 w-5" />
              <span className="ml-2 hidden sm:block">{t('settings.account')}</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="appearance">
            <Card>
              <CardHeader>
                <CardTitle>{t('settings.appearance')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>{t('settings.theme')}</Label>
                  <RadioGroup 
                    value={theme} 
                    onValueChange={(value) => setTheme(value as 'light' | 'dark' | 'system')}
                    className="flex flex-col sm:flex-row gap-4"
                  >
                    <div className="flex items-center space-x-2 border p-3 rounded-md hover:bg-secondary/50">
                      <RadioGroupItem value="light" id="light" className="rounded-full" />
                      <Label htmlFor="light" className="flex items-center gap-2 cursor-pointer">
                        <Sun className="h-4 w-4" />
                        {t('settings.light')}
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 border p-3 rounded-md hover:bg-secondary/50">
                      <RadioGroupItem value="dark" id="dark" className="rounded-full" />
                      <Label htmlFor="dark" className="flex items-center gap-2 cursor-pointer">
                        <Moon className="h-4 w-4" />
                        {t('settings.dark')}
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 border p-3 rounded-md hover:bg-secondary/50">
                      <RadioGroupItem value="system" id="system" className="rounded-full" />
                      <Label htmlFor="system" className="cursor-pointer">{t('settings.system')}</Label>
                    </div>
                  </RadioGroup>
                </div>
                
                <LanguageSwitcher />
                
                <Button className="w-full sm:w-auto" onClick={handleSave}>
                  {t('buttons.save')}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="account">
            <Card>
              <CardHeader>
                <CardTitle>{t('settings.profile')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>{t('settings.currency')}</Label>
                  <Select 
                    value="IDR" 
                    disabled={true}
                  >
                    <SelectTrigger className="w-full sm:w-72">
                      <SelectValue>
                        Rp - Indonesian Rupiah (IDR)
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IDR">
                        Rp - Indonesian Rupiah (IDR)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t('settings.currencyLocked')}
                  </p>
                </div>
                
                <Button className="w-full sm:w-auto" onClick={handleSave}>
                  {t('buttons.save')}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Settings;
