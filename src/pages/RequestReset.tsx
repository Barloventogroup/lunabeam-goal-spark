import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function RequestReset() {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [lastSent, setLastSent] = useState<number>(0);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Rate limiting: prevent sending within 10 seconds
    const now = Date.now();
    if (now - lastSent < 10000) {
      const remaining = Math.ceil((10000 - (now - lastSent)) / 1000);
      setMsg(`Please wait ${remaining} seconds before requesting another reset link.`);
      return;
    }
    
    setBusy(true);
    setMsg('Sending…');
    const redirectTo = `${window.location.origin}/auth/callback`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    setBusy(false);
    
    if (error) return setMsg(error.message);
    
    setLastSent(now);
    setMsg('Check your email for a reset link.');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Reset your password</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={busy} className="w-full">
              {busy ? 'Sending…' : 'Send reset link'}
            </Button>
          </form>
          {msg && (
            <p className={`mt-3 text-sm ${msg.includes('Check') ? 'text-green-600' : 'text-red-600'}`}>
              {msg}
            </p>
          )}
          
          <div className="mt-4 text-center">
            <Link 
              to="/auth"
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Back to sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}