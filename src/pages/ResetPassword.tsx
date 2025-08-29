import { FormEvent, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ResetPassword() {
  const nav = useNavigate();
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [msg, setMsg] = useState<string>('');
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (pw.length < 8) return setMsg('Use at least 8 characters.');
    if (pw !== pw2) return setMsg('Passwords do not match.');
    setBusy(true);
    setMsg('');
    const { data, error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) return setMsg(error.message);
    setMsg('Password updated! Redirecting to sign in…');
    setTimeout(() => nav('/auth', { replace: true }), 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Set a new password</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New password</Label>
              <Input
                id="password"
                type="password"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={pw2}
                onChange={(e) => setPw2(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            <Button type="submit" disabled={busy} className="w-full">
              {busy ? 'Saving…' : 'Save password'}
            </Button>
          </form>
          {msg && (
            <p className={`mt-3 text-sm ${msg.includes('updated') ? 'text-green-600' : 'text-red-600'}`}>
              {msg}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}