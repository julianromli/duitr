
import React, { useState, useEffect } from 'react';
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
import { Sun, Moon, Globe } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Translation data
const translations = {
  en: {
    settings: 'Settings',
    appearance: 'Appearance',
    theme: 'Theme',
    light: 'Light',
    dark: 'Dark',
    system: 'System',
    language: 'Language',
    english: 'English',
    indonesian: 'Indonesian',
    currency: 'Currency',
    save: 'Save Changes',
    saveSuccess: 'Settings updated successfully',
    selectCurrency: 'Select currency',
    account: 'Account',
    profile: 'Profile',
    security: 'Security',
    notifications: 'Notifications',
  },
  id: {
    settings: 'Pengaturan',
    appearance: 'Tampilan',
    theme: 'Tema',
    light: 'Terang',
    dark: 'Gelap',
    system: 'Sistem',
    language: 'Bahasa',
    english: 'Inggris',
    indonesian: 'Indonesia',
    currency: 'Mata Uang',
    save: 'Simpan Perubahan',
    saveSuccess: 'Pengaturan berhasil diperbarui',
    selectCurrency: 'Pilih mata uang',
    account: 'Akun',
    profile: 'Profil',
    security: 'Keamanan',
    notifications: 'Notifikasi',
  }
};

// Currency data
const currencies = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
];

const Settings: React.FC = () => {
  const { toast } = useToast();
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [language, setLanguage] = useState<'en' | 'id'>('en');
  const [currency, setCurrency] = useState('USD');
  const t = translations[language];

  // Apply theme effect
  useEffect(() => {
    const root = window.document.documentElement;
    
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.remove('light', 'dark');
      root.classList.add(systemTheme);
    } else {
      root.classList.remove('light', 'dark');
      root.classList.add(theme);
    }
  }, [theme]);

  const handleSave = () => {
    // In a real app, save to backend or localStorage
    localStorage.setItem('settings', JSON.stringify({ theme, language, currency }));
    
    toast({
      title: t.saveSuccess,
      duration: 3000,
    });
  };

  return (
    <div className="flex flex-col h-full animate-in">
      <Header />
      <div className="flex-1 p-6 pb-24 md:pb-6 space-y-6 overflow-auto fade-mask">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">{t.settings}</h2>
        </div>
        
        <Tabs defaultValue="appearance" className="w-full">
          <TabsList className="grid grid-cols-4 mb-6">
            <TabsTrigger value="appearance">{t.appearance}</TabsTrigger>
            <TabsTrigger value="account">{t.account}</TabsTrigger>
            <TabsTrigger value="security">{t.security}</TabsTrigger>
            <TabsTrigger value="notifications">{t.notifications}</TabsTrigger>
          </TabsList>
          
          <TabsContent value="appearance">
            <Card>
              <CardHeader>
                <CardTitle>{t.appearance}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>{t.theme}</Label>
                  <RadioGroup 
                    value={theme} 
                    onValueChange={(value) => setTheme(value as 'light' | 'dark' | 'system')}
                    className="flex flex-col sm:flex-row gap-4"
                  >
                    <div className="flex items-center space-x-2 border p-3 rounded-md hover:bg-secondary/50">
                      <RadioGroupItem value="light" id="light" />
                      <Label htmlFor="light" className="flex items-center gap-2">
                        <Sun className="h-4 w-4" />
                        {t.light}
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 border p-3 rounded-md hover:bg-secondary/50">
                      <RadioGroupItem value="dark" id="dark" />
                      <Label htmlFor="dark" className="flex items-center gap-2">
                        <Moon className="h-4 w-4" />
                        {t.dark}
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 border p-3 rounded-md hover:bg-secondary/50">
                      <RadioGroupItem value="system" id="system" />
                      <Label htmlFor="system">{t.system}</Label>
                    </div>
                  </RadioGroup>
                </div>
                
                <div className="space-y-2">
                  <Label>{t.language}</Label>
                  <RadioGroup 
                    value={language} 
                    onValueChange={(value) => setLanguage(value as 'en' | 'id')}
                    className="flex flex-col sm:flex-row gap-4"
                  >
                    <div className="flex items-center space-x-2 border p-3 rounded-md hover:bg-secondary/50">
                      <RadioGroupItem value="en" id="english" />
                      <Label htmlFor="english" className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        {t.english}
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 border p-3 rounded-md hover:bg-secondary/50">
                      <RadioGroupItem value="id" id="indonesian" />
                      <Label htmlFor="indonesian" className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        {t.indonesian}
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
                
                <div className="space-y-2">
                  <Label>{t.currency}</Label>
                  <Select 
                    value={currency} 
                    onValueChange={setCurrency}
                  >
                    <SelectTrigger className="w-full sm:w-72">
                      <SelectValue placeholder={t.selectCurrency} />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map(curr => (
                        <SelectItem key={curr.code} value={curr.code}>
                          {curr.symbol} - {curr.name} ({curr.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <Button className="w-full sm:w-auto" onClick={handleSave}>
                  {t.save}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="account">
            <Card>
              <CardHeader>
                <CardTitle>{t.profile}</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Profile settings would go here */}
                <p className="text-muted-foreground">Profile settings will be implemented in future updates.</p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>{t.security}</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Security settings would go here */}
                <p className="text-muted-foreground">Security settings will be implemented in future updates.</p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>{t.notifications}</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Notification settings would go here */}
                <p className="text-muted-foreground">Notification settings will be implemented in future updates.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Settings;
