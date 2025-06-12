
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Smartphone, QrCode, Eye } from 'lucide-react';
import { trpc } from '@/utils/trpc';
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
          name: 'Apple Wallet',
          action: 'Add to Apple Wallet',
          color: 'bg-black text-white'
        };
      case 'android':
        return {
          logo: '📱',
          name: 'Google Wallet',
          action: 'Add to Google Wallet',
          color: 'bg-blue-600 text-white'
        };
      default:
        return {
          logo: '📱',
          name: 'Mobile Wallet',
          action: 'Scan QR Code',
          color: 'bg-gray-800 text-white'
        };
    }
  };

  const walletInfo = getWalletInfo();

  if (currentStep === 'registration') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🎁</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Rewards</h1>
            <p className="text-gray-600">Join our loyalty program and earn rewards with every visit!</p>
          </div>

          <Card className="shadow-xl border-0">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-xl text-gray-800">Create Your Account</CardTitle>
              <CardDescription>Enter your details to get started</CardDescription>
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
                    placeholder="First name"
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
                    placeholder="Last name"
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
                    placeholder="Phone number"
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
                  className="w-full h-12 text-base bg-rose-500 hover:bg-rose-600 text-white font-medium rounded-lg"
                >
                  {isLoading ? 'Creating Account...' : 'Join Rewards Program'}
                </Button>
              </form>

              <Separator className="my-6" />

              <div className="text-center">
                <p className="text-sm text-gray-600 mb-4">Want to see how the 5-visit reward system works?</p>
                <Button
                  onClick={handleDemoMode}
                  variant="outline"
                  className="w-full h-12 text-base font-medium rounded-lg border-2 border-blue-200 text-blue-600 hover:bg-blue-50"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View Demo Dashboard
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
      <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">✨</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">You're Almost Ready!</h1>
            <p className="text-gray-600">Add your loyalty pass to your wallet for easy access</p>
          </div>

          <Card className="shadow-xl border-0">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <CardTitle className="text-xl text-gray-800">Account Created Successfully!</CardTitle>
              <CardDescription>
                Hello {currentUser?.first_name}! Your loyalty pass is ready to download.
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
                    <p className="text-sm text-gray-600">Scan with your phone to add to wallet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="w-20 h-20 bg-gray-100 rounded-lg mx-auto flex items-center justify-center">
                      <Smartphone className="w-10 h-10 text-gray-400" />
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
                <p className="text-sm text-gray-600">
                  You'll earn 1 point for each visit. Get a free reward after just 5 visits! 🎉
                </p>
                <div className="bg-rose-50 border border-rose-200 rounded-lg p-3">
                  <p className="text-sm font-medium text-rose-800">
                    ⚡ Quick Rewards: Only 5 visits to unlock your first reward!
                  </p>
                </div>
              </div>

              <Button 
                onClick={handlePassDownloaded}
                variant="outline"
                className="w-full h-12 text-base font-medium rounded-lg border-2 border-rose-200 text-rose-600 hover:bg-rose-50"
              >
                Continue to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Dashboard view
  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Demo Mode Header */}
          {isDemoMode && (
            <Alert className="mb-6 border-blue-200 bg-blue-50">
              <AlertDescription className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-blue-600" />
                  <span className="text-blue-800 font-medium">
                    Demo Mode: This shows how the 5-visit reward system works
                  </span>
                </div>
                <Button
                  onClick={resetToRegistration}
                  variant="outline"
                  size="sm"
                  className="border-blue-300 text-blue-700 hover:bg-blue-100"
                >
                  Back to Registration
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back, {currentUser?.first_name}! 👋
            </h1>
            <p className="text-gray-600">Track your visits and rewards progress</p>
          </div>

          {/* Reward Alert for 5-visit system */}
          {userStats?.current_reward_points === 4 && (
            <Alert className="mb-6 border-amber-200 bg-amber-50">
              <AlertDescription className="text-amber-800 flex items-center gap-2">
                <span className="text-lg">🔥</span>
                <span className="font-medium">So close! Just 1 more visit to unlock your reward!</span>
              </AlertDescription>
            </Alert>
          )}

          {/* Stats Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card className="text-center shadow-lg border-0">
              <CardContent className="pt-6">
                <div className="text-3xl mb-2">🏪</div>
                <div className="text-2xl font-bold text-gray-900">
                  {userStats?.total_visits || 0}
                </div>
                <p className="text-gray-600">Total Visits</p>
              </CardContent>
            </Card>

            <Card className="text-center shadow-lg border-0">
              <CardContent className="pt-6">
                <div className="text-3xl mb-2">⭐</div>
                <div className="text-2xl font-bold text-gray-900">
                  {userStats?.current_reward_points || 0}
                </div>
                <p className="text-gray-600">Current Points</p>
              </CardContent>
            </Card>

            <Card className="text-center shadow-lg border-0">
              <CardContent className="pt-6">
                <div className="text-3xl mb-2">🎯</div>
                <div className="text-2xl font-bold text-gray-900">
                  {userStats?.visits_until_reward || 5}
                </div>
                <p className="text-gray-600">Visits Until Reward</p>
              </CardContent>
            </Card>
          </div>

          {/* Reward Status */}
          <Card className="shadow-lg border-0 mb-8">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Reward Progress</h3>
                {userStats?.is_eligible_for_reward && (
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    🎉 Reward Ready!
                  </Badge>
                )}
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-4 mb-4 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-rose-400 to-pink-500 h-4 rounded-full transition-all duration-700 ease-out relative"
                  style={{ 
                    width: `${Math.min(((userStats?.current_reward_points || 0) / 5) * 100, 100)}%` 
                  }}
                >
                  {/* Animated shimmer effect for progress */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                </div>
              </div>
              
              <div className="flex justify-between items-center text-sm text-gray-600">
                <span>0 visits</span>
                <div className="text-center">
                  <span className="font-bold text-base text-gray-800">
                    {userStats?.current_reward_points || 0} / 5 visits
                  </span>
                  <br />
                  <span className="text-xs text-rose-600 font-medium">
                    {userStats?.current_reward_points === 5 ? 'Reward Ready!' : 'Keep going!'}
                  </span>
                </div>
                <span className="font-medium text-rose-600">Free reward! 🎁</span>
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
                  <p className="text-green-700 font-medium">Total Rewards Earned</p>
                  <p className="text-sm text-green-600 mt-1">
                    {userStats.total_visits % 5 === 0 && userStats.total_visits > 0 
                      ? 'Congratulations on your latest reward! 🎉' 
                      : `${5 - (userStats.total_visits % 5)} more visits to your next reward!`
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Instructions */}
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="w-5 h-5" />
                How to Earn Points
              </CardTitle>
              <CardDescription className="text-rose-600 font-medium">
                ⚡ New: Get rewards faster with our 5-visit system!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-rose-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-sm font-bold text-rose-600">1</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800">Visit Our Store</h4>
                  <p className="text-gray-600 text-sm">Come to our physical location</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-rose-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-sm font-bold text-rose-600">2</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800">Show Your Pass</h4>
                  <p className="text-gray-600 text-sm">Present your wallet pass to our staff</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-rose-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-sm font-bold text-rose-600">3</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800">Earn Points Fast</h4>
                  <p className="text-gray-600 text-sm">
                    Get 1 point per visit - only <span className="font-semibold text-rose-600">5 points needed</span> for a free reward! 🚀
                  </p>
                </div>
              </div>

              <div className="mt-6 p-4 bg-rose-50 border border-rose-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">💡</span>
                  <h4 className="font-semibold text-rose-800">Pro Tip</h4>
                </div>
                <p className="text-sm text-rose-700">
                  With our new 5-visit reward system, you'll earn rewards twice as fast! 
                  Perfect for regular customers who want to see their loyalty rewarded quickly.
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
