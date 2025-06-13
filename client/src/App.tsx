import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Smartphone, QrCode, Eye } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { i18n } from '@/components/i18n';
import type { CreateUserInput, User, UserWithStats } from '../../server/src/schema';

type Step = 'registration' | 'pass-download' | 'dashboard';
type DeviceType = 'ios' | 'android' | 'desktop';

function App() {
  const [currentStep, setCurrentStep] = useState<Step>('registration');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userStats, setUserStats] = useState<UserWithStats | null>(null);
  const [deviceType, setDeviceType] = useState<DeviceType>('desktop');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

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

  // Force re-render when language changes
  const handleLanguageChange = () => {
    setRefreshKey(prev => prev + 1);
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
      const errorMessage = error instanceof Error ? error.message : 'Registration failed. Please try again.';
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
          name: i18n.t('apple_wallet'),
          action: i18n.t('add_to_apple_wallet'),
          color: 'bg-black text-white'
        };
      case 'android':
        return {
          logo: '📱',
          name: i18n.t('google_wallet'),
          action: i18n.t('add_to_google_wallet'),
          color: 'bg-blue-600 text-white'
        };
      default:
        return {
          logo: '📱',
          name: i18n.t('mobile_wallet'),
          action: i18n.t('scan_qr_code'),
          color: 'bg-gray-800 text-white'
        };
    }
  };

  const walletInfo = getWalletInfo();

  if (currentStep === 'registration') {
    return (
      <div key={refreshKey} className="min-h-screen bg-background flex items-center justify-center p-4 relative">
        <div className="absolute top-4 right-4">
          <LanguageSwitcher onLanguageChange={handleLanguageChange} />
        </div>
        
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🍭</div>
            <h1 className="text-3xl font-bold text-foreground mb-2">{i18n.t('welcome_title')}</h1>
            <p className="text-muted-foreground">{i18n.t('welcome_subtitle')}</p>
          </div>

          <Card className="shadow-xl border-0 bg-card">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-xl text-card-foreground">{i18n.t('create_account')}</CardTitle>
              <CardDescription>{i18n.t('enter_details')}</CardDescription>
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
                    placeholder={i18n.t('first_name')}
                    value={formData.first_name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateUserInput) => ({ ...prev, first_name: e.target.value }))
                    }
                    className="h-12 text-base"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Input
                    placeholder={i18n.t('last_name')}
                    value={formData.last_name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateUserInput) => ({ ...prev, last_name: e.target.value }))
                    }
                    className="h-12 text-base"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Input
                    placeholder={i18n.t('phone_number')}
                    type="tel"
                    value={formData.phone_number}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateUserInput) => ({ ...prev, phone_number: e.target.value }))
                    }
                    className="h-12 text-base"
                    required
                  />
                </div>
                
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full h-12 text-base bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg"
                >
                  {isLoading ? i18n.t('creating_account') : i18n.t('join_program')}
                </Button>
              </form>

              <Separator className="my-6" />

              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-4">{i18n.t('demo_system')}</p>
                <Button
                  onClick={handleDemoMode}
                  variant="outline"
                  className="w-full h-12 text-base font-medium rounded-lg border-2 border-blue-200 text-blue-600 hover:bg-blue-50"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  {i18n.t('view_demo')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (currentStep === 'pass-download') {
    return (
      <div key={refreshKey} className="min-h-screen bg-background flex items-center justify-center p-4 relative">
        <div className="absolute top-4 right-4">
          <LanguageSwitcher onLanguageChange={handleLanguageChange} />
        </div>
        
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">✨</div>
            <h1 className="text-3xl font-bold text-foreground mb-2">{i18n.t('almost_ready')}</h1>
            <p className="text-muted-foreground">{i18n.t('add_to_wallet')}</p>
          </div>

          <Card className="shadow-xl border-0 bg-card">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <CardTitle className="text-xl text-card-foreground">{i18n.t('account_created')}</CardTitle>
              <CardDescription>
                {i18n.t('welcome_back', { name: currentUser?.first_name || 'User' })} {i18n.t('pass_ready')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="text-4xl mb-2">{walletInfo.logo}</div>
                <h3 className="font-semibold text-card-foreground mb-2">{walletInfo.name}</h3>
                
                {deviceType === 'desktop' ? (
                  <div className="space-y-4">
                    <div className="w-32 h-32 bg-muted rounded-lg mx-auto flex items-center justify-center">
                      <QrCode className="w-16 h-16 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">{i18n.t('scan_phone')}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="w-20 h-20 bg-muted rounded-lg mx-auto flex items-center justify-center">
                      <Smartphone className="w-10 h-10 text-muted-foreground" />
                    </div>
                    <Button 
                      className={`w-full h-12 text-base font-medium rounded-lg ${walletInfo.color}`}
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
                <p className="text-sm text-muted-foreground">
                  {i18n.t('earn_points_visit')}
                </p>
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
                  <p className="text-sm font-medium text-primary">
                    {i18n.t('quick_rewards')}
                  </p>
                </div>
              </div>

              <Button 
                onClick={handlePassDownloaded}
                variant="outline"
                className="w-full h-12 text-base font-medium rounded-lg border-2 border-primary/20 text-primary hover:bg-primary/10"
              >
                {i18n.t('continue_dashboard')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Dashboard view
  return (
    <div key={refreshKey} className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto relative">
          <div className="absolute top-0 right-0">
            <LanguageSwitcher onLanguageChange={handleLanguageChange} />
          </div>
          
          {/* Demo Mode Header */}
          {isDemoMode && (
            <Alert className="mb-6 border-blue-200 bg-blue-50">
              <AlertDescription className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-blue-600" />
                  <span className="text-blue-800 font-medium">
                    {i18n.t('demo_mode')}
                  </span>
                </div>
                <Button
                  onClick={resetToRegistration}
                  variant="outline"
                  size="sm"
                  className="border-blue-300 text-blue-700 hover:bg-blue-100"
                >
                  {i18n.t('back_to_registration')}
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Header */}
          <div className="text-center mb-8 pt-12">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {i18n.t('welcome_back', { name: currentUser?.first_name || 'User' })}
            </h1>
            <p className="text-muted-foreground">{i18n.t('track_progress')}</p>
          </div>

          {/* Reward Alert for 5-visit system */}
          {userStats?.current_reward_points === 4 && (
            <Alert className="mb-6 border-amber-200 bg-amber-50">
              <AlertDescription className="text-amber-800 flex items-center gap-2">
                <span className="text-lg">🔥</span>
                <span className="font-medium">{i18n.t('so_close')}</span>
              </AlertDescription>
            </Alert>
          )}

          {/* Stats Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card className="text-center shadow-lg border-0 bg-card">
              <CardContent className="pt-6">
                <div className="text-3xl mb-2">🏪</div>
                <div className="text-2xl font-bold text-card-foreground">
                  {userStats?.total_visits || 0}
                </div>
                <p className="text-muted-foreground">{i18n.t('total_visits')}</p>
              </CardContent>
            </Card>

            <Card className="text-center shadow-lg border-0 bg-card">
              <CardContent className="pt-6">
                <div className="text-3xl mb-2">⭐</div>
                <div className="text-2xl font-bold text-card-foreground">
                  {userStats?.current_reward_points || 0}
                </div>
                <p className="text-muted-foreground">{i18n.t('current_points')}</p>
              </CardContent>
            </Card>

            <Card className="text-center shadow-lg border-0 bg-card">
              <CardContent className="pt-6">
                <div className="text-3xl mb-2">🎯</div>
                <div className="text-2xl font-bold text-card-foreground">
                  {userStats?.visits_until_reward || 5}
                </div>
                <p className="text-muted-foreground">{i18n.t('visits_until_reward')}</p>
              </CardContent>
            </Card>
          </div>

          {/* Reward Status */}
          <Card className="shadow-lg border-0 mb-8 bg-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-card-foreground">{i18n.t('reward_progress')}</h3>
                {userStats?.is_eligible_for_reward && (
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    {i18n.t('reward_ready')}
                  </Badge>
                )}
              </div>
              
              <div className="w-full bg-muted rounded-full h-4 mb-4 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-primary to-primary/80 h-4 rounded-full transition-all duration-700 ease-out relative"
                  style={{ 
                    width: `${Math.min(((userStats?.current_reward_points || 0) / 5) * 100, 100)}%` 
                  }}
                >
                  {/* Animated shimmer effect for progress */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                </div>
              </div>
              
              <div className="flex justify-between items-center text-sm text-muted-foreground">
                <span>0 visits</span>
                <div className="text-center">
                  <span className="font-bold text-base text-card-foreground">
                    {userStats?.current_reward_points || 0} / 5 visits
                  </span>
                  <br />
                  <span className="text-xs text-primary font-medium">
                    {userStats?.current_reward_points === 5 ? i18n.t('reward_ready') : i18n.t('keep_going')}
                  </span>
                </div>
                <span className="font-medium text-primary">{i18n.t('free_reward')}</span>
              </div>
            </CardContent>
          </Card>

          {/* Rewards Earned Counter */}
          {userStats && userStats.total_visits > 0 && (
            <Card className="shadow-lg border-0 mb-8 bg-gradient-to-r from-green-50 to-emerald-50">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-4xl mb-2">🏆</div>
                  <div className="text-2xl font-bold text-green-800">
                    {Math.floor(userStats.total_visits / 5)}
                  </div>
                  <p className="text-green-700 font-medium">{i18n.t('total_rewards_earned')}</p>
                  <p className="text-sm text-green-600 mt-1">
                    {userStats.total_visits % 5 === 0 && userStats.total_visits > 0 
                      ? i18n.t('congrats_reward')
                      : i18n.t('more_visits_needed', { count: 5 - (userStats.total_visits % 5) })
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Instructions */}
          <Card className="shadow-lg border-0 bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-card-foreground">
                <Smartphone className="w-5 h-5" />
                {i18n.t('how_to_earn')}
              </CardTitle>
              <CardDescription className="text-primary font-medium">
                {i18n.t('faster_system')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-sm font-bold text-primary">1</span>
                </div>
                <div>
                  <h4 className="font-medium text-card-foreground">{i18n.t('visit_store')}</h4>
                  <p className="text-muted-foreground text-sm">{i18n.t('visit_store_desc')}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-sm font-bold text-primary">2</span>
                </div>
                <div>
                  <h4 className="font-medium text-card-foreground">{i18n.t('show_pass')}</h4>
                  <p className="text-muted-foreground text-sm">{i18n.t('show_pass_desc')}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-sm font-bold text-primary">3</span>
                </div>
                <div>
                  <h4 className="font-medium text-card-foreground">{i18n.t('earn_fast')}</h4>
                  <p className="text-muted-foreground text-sm">
                    {i18n.t('earn_fast_desc')}
                  </p>
                </div>
              </div>

              <div className="mt-6 p-4 bg-primary/10 border border-primary/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">💡</span>
                  <h4 className="font-semibold text-primary">{i18n.t('pro_tip')}</h4>
                </div>
                <p className="text-sm text-primary">
                  {i18n.t('pro_tip_desc')}
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