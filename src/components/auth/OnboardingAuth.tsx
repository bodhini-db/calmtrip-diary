import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { supabase, signUp, signIn } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';

const OnboardingAuth = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<'welcome' | 'consent' | 'auth'>('welcome');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSignUp, setIsSignUp] = useState(true);
  const [gpsConsent, setGpsConsent] = useState(false);
  const [privacyConsent, setPrivacyConsent] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (isSignUp) {
        const { error } = await signUp(email, password);
        if (error) throw error;
        // Save consent preferences
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('privacy_settings').insert({
            user_id: user.id,
            gps_tracking_enabled: gpsConsent,
            allow_anonymous_sharing: privacyConsent,
            allow_research_data: privacyConsent,
          });
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) throw error;
      }
      navigate('/home');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        {step === 'welcome' && (
          <Card className="p-8 shadow-lg border-0">
            <div className="text-center space-y-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
                className="text-6xl"
              >
                🧳
              </motion.div>
              <h1 className="text-4xl font-bold text-gray-800">CalmTrip</h1>
              <p className="text-gray-600">
                Travel with intention. Capture moments. Reflect on journeys.
              </p>
              <Button
                onClick={() => setStep('consent')}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-12 text-lg"
              >
                Begin Your Journey
              </Button>
            </div>
          </Card>
        )}

        {step === 'consent' && (
          <Card className="p-8 shadow-lg border-0 space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">Privacy & Permissions</h2>

            <div className="space-y-4">
              <div className="border border-emerald-200 rounded-lg p-4 bg-emerald-50">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-2">
                  📍 GPS Tracking
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  CalmTrip uses GPS to detect your trips, map routes, and geo-tag photos. Your location data stays private.
                </p>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={gpsConsent}
                    onChange={(e) => setGpsConsent(e.target.checked)}
                    className="w-5 h-5 rounded accent-emerald-600"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    I consent to GPS tracking
                  </span>
                </label>
              </div>

              <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-2">
                  🔍 Data Sharing (Optional)
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Help improve CalmTrip by sharing anonymized trip insights. You can change this anytime.
                </p>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={privacyConsent}
                    onChange={(e) => setPrivacyConsent(e.target.checked)}
                    className="w-5 h-5 rounded accent-blue-600"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Share anonymized data
                  </span>
                </label>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep('welcome')}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={() => setStep('auth')}
                disabled={!gpsConsent}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Continue
              </Button>
            </div>
          </Card>
        )}

        {step === 'auth' && (
          <Card className="p-8 shadow-lg border-0 space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </h2>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleAuth} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="••••••••"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-12"
              >
                {isLoading ? 'Loading...' : isSignUp ? 'Create Account' : 'Sign In'}
              </Button>
            </form>

            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
              }}
              className="w-full text-center text-sm text-emerald-600 hover:text-emerald-700"
            >
              {isSignUp
                ? 'Already have an account? Sign in'
                : "Don't have an account? Create one"}
            </button>

            <Button
              variant="outline"
              onClick={() => setStep('consent')}
              className="w-full"
            >
              Back
            </Button>
          </Card>
        )}
      </motion.div>
    </div>
  );
};

export default OnboardingAuth;
