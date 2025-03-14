import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useLocale } from '../context/LocaleContext';
import LanguageSwitcher from './LanguageSwitcher';

const LoginForm = () => {
  const { login, isLoading } = useAuth();
  const { t } = useLocale();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(username, password);
    } catch (error) {
      // Error is handled in the Auth context
      console.error('Login failed:', error);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 animate-fade-in">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      <Card className="w-full max-w-md shadow-lg animate-slide-up glass">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-bold tracking-tight">{t('auth.login')}</CardTitle>
          <CardDescription className="text-muted-foreground">
            {t('auth.credentials')}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">{t('auth.username.label')}</Label>
              <Input
                id="username"
                type="text"
                placeholder={t('auth.username.placeholder')}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="transition-all-200"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">{t('auth.password.label')}</Label>
              </div>
              <Input
                id="password"
                type="password"
                placeholder={t('auth.password.placeholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="transition-all-200"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              type="submit" 
              className="w-full transition-all-200"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span>{t('auth.loggingIn')}</span>
                </>
              ) : (
                <span>{t('auth.login')}</span>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default LoginForm;
