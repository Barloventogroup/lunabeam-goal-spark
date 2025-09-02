import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/components/auth/auth-provider';
import { toast } from 'sonner';

export default function Auth() {
  const { user, signIn, signUp, signOut } = useAuth();
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  // Redirect to dashboard after successful authentication
  useEffect(() => {
    if (user && !loading) {
      navigate('/', { replace: true });
    }
  }, [user, loading, navigate]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await signUp(formData.email, formData.password, '');
        if (error) {
          toast.error(error.message);
        } else {
          toast.success('Account created! Please check your email to verify your account.');
          setIsSignUp(false);
        }
      } else {
        const { error } = await signIn(formData.email, formData.password);
        if (error) {
          toast.error(error.message);
        } else {
          toast.success('Welcome back!');
        }
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-primary flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <img 
              src="/lovable-uploads/7f6e5283-da38-4bfc-ac26-ae239e843b39.png" 
              alt="Lunabeam logo"
              className="h-16 w-auto object-cover object-center"
            />
          </div>
          <CardDescription className="text-black font-bold">
            Guiding big dreams, one step at a time
          </CardDescription>
          {user && (
            <div className="mt-2 text-sm text-muted-foreground">
              You're currently signed in. 
              <Button variant="ghost" className="ml-1 px-2 py-0 h-6" onClick={async () => { await signOut(); }}>
                Sign out to switch account
              </Button>
            </div>
          )}
        </CardHeader>
        
        <CardContent>
          {!isSignUp && (
            <div className="mb-4 mt-10 text-sm text-black text-center">
              Sign in with your email to access your account
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div className="space-y-2">
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                placeholder="Enter your email"
                className="border-gray-300 focus:border-primary"
              />
            </div>
            
            <div className="space-y-2">
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                placeholder="Enter your password"
                minLength={6}
                className="border-gray-300 focus:border-primary"
              />
            </div>
            
            {!isSignUp && (
              <div className="mb-3 text-center">
                <Link 
                  to="/auth/request-reset"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Forgot your password?
                </Link>
              </div>
            )}
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? 'Loading...' : (isSignUp ? 'Create Account' : 'Sign In')}
            </Button>
          </form>
          
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              {isSignUp 
                ? 'Already have an account? Sign in' 
                : <>Don't have an account? Sign up</>
              }
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}