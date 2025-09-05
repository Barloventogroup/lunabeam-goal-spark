import React from 'react';
import { useParams } from 'react-router-dom';
import { AccountClaim } from '@/components/permissions/account-claim';

export function ClaimAccount() {
  const { claimToken } = useParams<{ claimToken: string }>();

  return (
    <div className="min-h-screen bg-gradient-primary flex items-center justify-center p-4">
      <AccountClaim claimToken={claimToken} />
    </div>
  );
}