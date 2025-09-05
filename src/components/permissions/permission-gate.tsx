import React, { useState, useEffect } from 'react';
import { PermissionsService } from '@/services/permissionsService';
import { useAuth } from '@/components/auth/auth-provider';

interface PermissionGateProps {
  individualId: string;
  action: string;
  goalId?: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function PermissionGate({ 
  individualId, 
  action, 
  goalId, 
  children, 
  fallback = null 
}: PermissionGateProps) {
  const { user } = useAuth();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) {
      setHasPermission(false);
      return;
    }

    const checkPermission = async () => {
      try {
        const permission = await PermissionsService.checkPermission(
          individualId, 
          action, 
          goalId
        );
        setHasPermission(permission);
      } catch (error) {
        console.error('Permission check failed:', error);
        setHasPermission(false);
      }
    };

    checkPermission();
  }, [user, individualId, action, goalId]);

  // Loading state
  if (hasPermission === null) {
    return (
      <div className="animate-pulse bg-gray-200 h-8 w-24 rounded"></div>
    );
  }

  // No permission
  if (!hasPermission) {
    return <>{fallback}</>;
  }

  // Has permission
  return <>{children}</>;
}