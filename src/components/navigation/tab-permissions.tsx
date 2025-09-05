import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SupporterManagement } from '@/components/permissions/supporter-management';
import { useAuth } from '@/components/auth/auth-provider';

export function TabPermissions() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Please log in to manage permissions</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">Permissions & Supporters</h1>
        <p className="text-muted-foreground">
          Manage who can access your goals and what they can do
        </p>
      </div>

      <div className="grid gap-6">
        <SupporterManagement individualId={user.id} />
        
        <Card>
          <CardHeader>
            <CardTitle>Permission Levels Guide</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 border border-gray-200 rounded-lg">
                <h3 className="font-semibold text-gray-600 mb-2">Viewer</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• View goals and progress</li>
                  <li>• Comment and encourage</li>
                  <li>• No editing permissions</li>
                </ul>
              </div>
              <div className="p-4 border border-orange-200 rounded-lg">
                <h3 className="font-semibold text-orange-600 mb-2">Collaborator</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Everything from Viewer</li>
                  <li>• Suggest/edit steps</li>
                  <li>• Mark progress complete</li>
                  <li>• Cannot delete goals</li>
                </ul>
              </div>
              <div className="p-4 border border-red-200 rounded-lg">
                <h3 className="font-semibold text-red-600 mb-2">Admin</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Everything from Collaborator</li>
                  <li>• Create/edit/delete goals</li>
                  <li>• Edit profile info</li>
                  <li>• Invite other supporters</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Role Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-blue-600">Supporter (Family/Coach)</h4>
                  <p className="text-sm text-muted-foreground">
                    Parents, guardians, relatives, mentors, and coaches. Can have any permission level.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-green-600">Friend</h4>
                  <p className="text-sm text-muted-foreground">
                    Goal-specific access only. Can view and encourage on specific goals.
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-purple-600">Provider/Professional</h4>
                  <p className="text-sm text-muted-foreground">
                    Therapists, educators, counselors. Usually read-only unless granted collaborator access.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-red-600">Admin</h4>
                  <p className="text-sm text-muted-foreground">
                    System-level control. Platform administrators for compliance and support.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}