import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Smartphone, QrCode, Eye } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import { LanguageSelector } from '@/components/LanguageSelector';
import { useTranslation } from '@/components/useTranslation';
import type { CreateUserInput, User, UserWithStats } from '../../server/src/schema';

type Step = 'registration' | 'pass-download' | 'dashboard';
type DeviceType = 'ios' | 'android' | 'desktop';

function App() {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState<Step>('registration');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userStats, setUserStats] = useState<UserWithStats | null>(null);
  const [deviceType, setDeviceType] = useState<DeviceType>('desktop');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);

  const [formData, setFormData] = useState<CreateUserInput>({
    first_name: '',
    last_name: '',
    phone_number: ''
  });

  // Demo user data for showcasing the 5-visit system
  const demoUser: User = {
    id: 1,
    first_name: 'Demo',
    last_name: 'User',
    phone_number: '+1234567890',
    total_visits: 7,
    current_reward_points: 2, // 7 visits = 1 reward earned (5 visits) + 2 points toward next
    pass_serial_number: 'DEMO123',
    created_at: new Date('2024-01-01'),
    updated_at: new Date()
  };

  const demoUserStats: UserWithStats = {
    ...demoUser,
    is_eligible_for_reward: false,
    visits_until_reward: 3 // 5 - 2 = 3 more visits needed
  };

  // Device detection
  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setDeviceType('ios');
    } else if (/android/.test(userAgent)) {
      setDeviceType('android');
    } else {
      setDeviceType('desktop');
    }
  }, []);

  // Load user stats function with useCallback
  const loadUserStats = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      const stats = await trpc.getUserWithStats.query({ userId: currentUser.id });
      setUserStats(stats);
    } catch (error) {
      console.error('Failed to load user stats:', error);
    }
  }, [currentUser]);

  // Load user stats when user changes
  useEffect(() => {
    if (currentUser && !isDemoMode) {
      loadUserStats();
    }
  }, [currentUser, loadUserStats, isDemoMode]);

  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Create user
      const user = await trpc.createUser.mutate(formData);
      setCurrentUser(user);

      // Trigger pass creation
      await trpc.triggerPassCreation.mutate({
        userId: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        phoneNumber: user.phone_number
      });

      setCurrentStep('pass-download');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : t('errors.registrationFailed');
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePassDownloaded = () => {
    setCurrentStep('dashboard');
  };

  const handleDemoMode = () => {
    setIsDemoMode(true);
    setCurrentUser(demoUser);
    setUserStats(demoUserStats);
    setCurrentStep('dashboard');
  };

  const resetToRegistration = () => {
    setIsDemoMode(false);
    setCurrentUser(null);
    setUserStats(null);
    setCurrentStep('registration');
    setFormData({
      first_name: '',
      last_name: '',
      phone_number: ''
    });
  };

  const getWalletInfo = () => {
    switch (deviceType) {
      case 'ios':
        return {
          logo: '🍎',
          name: t('passDownload.appleWallet'),
          action: t('passDownload.addToAppleWallet'),
          color: 'bg-black text-white'
        };
      case 'android':
        return {
          logo: '📱',
          name: t('passDownload.googleWallet'),
          action: t('passDownload.addToGoogleWallet'),
          color: 'bg-blue-600 text-white'
        };
      default:
        return {
          logo: '📱',
          name: t('passDownload.mobileWallet'),
          action: t('passDownload.scanQrCode'),
          color: 'bg-gray-800 text-white'
        };
    }
  };

  const walletInfo = getWalletInfo();

  if (currentStep === 'registration') {
    return (
      <div className="min-h-screen flex flex-col sweet-bg">
        {/* Language Selector Header */}
        <div className="flex justify-end p-4">
          <LanguageSelector />
        </div>

        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">🎁</div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('welcome.title')}</h1>
              <p className="text-gray-600">{t('welcome.subtitle')}</p>
            </div>

            <Card className="card-shadow">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-xl text-gray-800">{t('registration.createAccount')}</CardTitle>
                <CardDescription>{t('registration.enterDetails')}</CardDescription>
              </CardHeader>
              <CardContent>
                {error && (
                  <Alert className="mb-4 border-red-200 bg-red-50">
                    <AlertDescription className="text-red-700">{error}</AlertDescription>
                  </Alert>
                )}
                
                <form onSubmit={handleRegistration} className="space-y-4">
                  <div className="space-y-2">
                    <Input
                      placeholder={t('registration.firstName')}
                      value={formData.first_name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreateUserInput) => ({ ...prev, first_name: e.target.value }))
                      }
                      className="h-12 text-base airbnb-input"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Input
                      placeholder={t('registration.lastName')}
                      value={formData.last_name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreateUserInput) => ({ ...prev, last_name: e.target.value }))
                      }
                      className="h-12 text-base airbnb-input"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Input
                      placeholder={t('registration.phoneNumber')}
                      type="tel"
                      value={formData.phone_number}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreateUserInput) => ({ ...prev, phone_number: e.target.value }))
                      }
                      className="h-12 text-base airbnb-input"
                      required
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full h-12 text-base sweet-button airbnb-button"
                  >
                    {isLoading ? t('registration.creatingAccount') : t('registration.joinProgram')}
                  </Button>
                </form>

                <Separator className="my-6" />

                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-4">{t('demo.description')}</p>
                  <Button
                    onClick={handleDemoMode}
                    variant="outline"
                    className="w-full h-12 text-base font-medium rounded-lg border-2 border-blue-200 text-blue-600 hover:bg-blue-50 airbnb-button"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    {t('demo.viewDemo')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (currentStep === 'pass-download') {
    return (
      <div className="min-h-screen flex flex-col sweet-bg">
        {/* Language Selector Header */}
        <div className="flex justify-end p-4">
          <LanguageSelector />
        </div>

        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">✨</div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('passDownload.almostReady')}</h1>
              <p className="text-gray-600">{t('passDownload.addToWallet')}</p>
            </div>

            <Card className="card-shadow">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <CardTitle className="text-xl text-gray-800">{t('passDownload.accountCreated')}</CardTitle>
                <CardDescription>
                  {t('passDownload.helloUser', { name: currentUser?.first_name || '' })}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center">
                  <div className="text-4xl mb-2">{walletInfo.logo}</div>
                  <h3 className="font-semibold text-gray-800 mb-2">{walletInfo.name}</h3>
                  
                  {deviceType === 'desktop' ? (
                    <div className="space-y-4">
                      <div className="w-32 h-32 bg-gray-100 rounded-lg mx-auto flex items-center justify-center">
                        <QrCode className="w-16 h-16 text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-600">{t('passDownload.scanWithPhone')}</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="w-20 h-20 bg-gray-100 rounded-lg mx-auto flex items-center justify-center">
                        <Smartphone className="w-10 h-10 text-gray-400" />
                      </div>
                      <Button 
                        className={`w-full h-12 text-base font-medium rounded-lg ${walletInfo.color} airbnb-button`}
                        onClick={() => {
                          // This would open the wallet pass URL when provided
                          console.log('Opening wallet pass...');
                        }}
                      >
                        {walletInfo.action}
                      </Button>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="text-center space-y-2">
                  <p className="text-sm text-gray-600">
                    {t('passDownload.earnPoints')}
                  </p>
                  <div className="sweet-bg-light sweet-border-light border rounded-lg p-3">
                    <p className="text-sm font-medium sweet-text">
                      {t('passDownload.quickRewards')}
                    </p>
                  </div>
                </div>

                <Button 
                  onClick={handlePassDownloaded}
                  variant="outline"
                  className="w-full h-12 text-base font-medium rounded-lg border-2 sweet-border sweet-text hover:sweet-bg-light airbnb-button"
                >
                  {t('passDownload.continueToDashboard')}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard view
  return (
    <div className="min-h-screen sweet-bg">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Language Selector Header */}
          <div className="flex justify-end mb-4">
            <LanguageSelector />
          </div>

          {/* Demo Mode Header */}
          {isDemoMode && (
            <Alert className="mb-6 border-blue-200 bg-blue-50">
              <AlertDescription className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-blue-600" />
                  <span className="text-blue-800 font-medium">
                    {t('demo.modeActive')}
                  </span>
                </div>
                <Button
                  onClick={resetToRegistration}
                  variant="outline"
                  size="sm"
                  className="border-blue-300 text-blue-700 hover:bg-blue-100 airbnb-button"
                >
                  {t('demo.backToRegistration')}
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {t('dashboard.welcomeBack', { name: currentUser?.first_name || '' })}
            </h1>
            <p className="text-gray-600">{t('dashboard.trackProgress')}</p>
          </div>

          {/* Reward Alert for 5-visit system */}
          {userStats?.current_reward_points === 4 && (
            <Alert className="mb-6 border-amber-200 bg-amber-50">
              <AlertDescription className="text-amber-800 flex items-center gap-2">
                <span className="text-lg">🔥</span>
                <span className="font-medium">{t('dashboard.soClose')}</span>
              </AlertDescription>
            </Alert>
          )}

          {/* Stats Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card className="text-center card-shadow">
              <CardContent className="pt-6">
                <div className="text-3xl mb-2">🏪</div>
                <div className="text-2xl font-bold text-gray-900">
                  {userStats?.total_visits || 0}
                </div>
                <p className="text-gray-600">{t('dashboard.totalVisits')}</p>
              </CardContent>
            </Card>

            <Card className="text-center card-shadow">
              <CardContent className="pt-6">
                <div className="text-3xl mb-2">⭐</div>
                <div className="text-2xl font-bold text-gray-900">
                  {userStats?.current_reward_points || 0}
                </div>
                <p className="text-gray-600">{t('dashboard.currentPoints')}</p>
              </CardContent>
            </Card>

            <Card className="text-center card-shadow">
              <CardContent className="pt-6">
                <div className="text-3xl mb-2">🎯</div>
                <div className="text-2xl font-bold text-gray-900">
                  {userStats?.visits_until_reward || 5}
                </div>
                <p className="text-gray-600">{t('dashboard.visitsUntilReward')}</p>
              </CardContent>
            </Card>
          </div>

          {/* Reward Status */}
          <Card className="card-shadow mb-8">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">{t('dashboard.rewardProgress')}</h3>
                {userStats?.is_eligible_for_reward && (
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    {t('dashboard.rewardReady')}
                  </Badge>
                )}
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-4 mb-4 overflow-hidden">
                <div 
                  className="reward-gradient h-4 rounded-full transition-all duration-700 ease-out relative"
                  style={{ 
                    width: `${Math.min(((userStats?.current_reward_points || 0) / 5) * 100, 100)}%` 
                  }}
                >
                  {/* Animated shimmer effect for progress */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent shimmer-effect"></div>
                </div>
              </div>
              
              <div className="flex justify-between items-center text-sm text-gray-600">
                <span>0 {t('dashboard.totalVisits').toLowerCase()}</span>
                <div className="text-center">
                  <span className="font-bold text-base text-gray-800">
                    {t('progress.visits', { current: userStats?.current_reward_points || 0, total: 5 })}
                  </span>
                  <br />
                  <span className="text-xs font-medium sweet-text">
                    {userStats?.current_reward_points === 5 ? t('dashboard.rewardReady') : t('dashboard.keepGoing')}
                  </span>
                </div>
                <span className="font-medium sweet-text">{t('dashboard.freeReward')}</span>
              </div>
            </CardContent>
          </Card>

          {/* Rewards Earned Counter */}
          {userStats && userStats.total_visits > 0 && (
            <Card className="card-shadow mb-8 bg-gradient-to-r from-green-50 to-emerald-50">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-4xl mb-2">🏆</div>
                  <div className="text-2xl font-bold text-green-800">
                    {Math.floor(userStats.total_visits / 5)}
                  </div>
                  <p className="text-green-700 font-medium">{t('dashboard.totalRewardsEarned')}</p>
                  <p className="text-sm text-green-600 mt-1">
                    {userStats.total_visits % 5 === 0 && userStats.total_visits > 0 
                      ? t('dashboard.congratulations')
                      : t('dashboard.moreVisitsNeeded', { count: 5 - (userStats.total_visits % 5) })
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Instructions */}
          <Card className="card-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="w-5 h-5" />
                {t('howToEarn.title')}
              </CardTitle>
              <CardDescription className="font-medium sweet-text">
                {t('howToEarn.subtitle')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 sweet-bg-light rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-sm font-bold sweet-text">1</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800">{t('howToEarn.step1Title')}</h4>
                  <p className="text-gray-600 text-sm">{t('howToEarn.step1Description')}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 sweet-bg-light rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-sm font-bold sweet-text">2</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800">{t('howToEarn.step2Title')}</h4>
                  <p className="text-gray-600 text-sm">{t('howToEarn.step2Description')}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 sweet-bg-light rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-sm font-bold sweet-text">3</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800">{t('howToEarn.step3Title')}</h4>
                  <p className="text-gray-600 text-sm">
                    {t('howToEarn.step3Description')}
                  </p>
                </div>
              </div>

              <div className="mt-6 p-4 sweet-bg-light sweet-border-light border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">💡</span>
                  <h4 className="font-semibold" style={{ color: '#881337' }}>{t('howToEarn.proTip')}</h4>
                </div>
                <p className="text-sm" style={{ color: '#be185d' }}>
                  {t('howToEarn.proTipDescription')}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default App;