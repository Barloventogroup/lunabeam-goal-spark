import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Check, X, Package, Clock } from "lucide-react";
import { rewardsService, Redemption } from "@/services/rewardsService";
import { toast } from "sonner";

interface RedemptionInboxProps {
  onBack: () => void;
}

export const RedemptionInbox: React.FC<RedemptionInboxProps> = ({ onBack }) => {
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [denyNotes, setDenyNotes] = useState<Record<string, string>>({});

  const loadRedemptions = async () => {
    try {
      setLoading(true);
      const data = await rewardsService.getRedemptions();
      setRedemptions(data);
    } catch (error) {
      console.error('Failed to load redemptions:', error);
      toast.error('Failed to load redemptions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRedemptions();
  }, []);

  const handleApprove = async (redemption: Redemption) => {
    try {
      setProcessingId(redemption.id);
      await rewardsService.approveRedemption(redemption.id);
      toast.success('Redemption approved! Points have been deducted.');
      loadRedemptions();
    } catch (error: any) {
      console.error('Failed to approve redemption:', error);
      toast.error(error.message || 'Failed to approve redemption');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeny = async (redemption: Redemption) => {
    try {
      setProcessingId(redemption.id);
      await rewardsService.denyRedemption(redemption.id, denyNotes[redemption.id]);
      toast.success('Redemption denied');
      loadRedemptions();
    } catch (error) {
      console.error('Failed to deny redemption:', error);
      toast.error('Failed to deny redemption');
    } finally {
      setProcessingId(null);
    }
  };

  const handleFulfill = async (redemption: Redemption) => {
    try {
      setProcessingId(redemption.id);
      await rewardsService.fulfillRedemption(redemption.id);
      toast.success('Reward marked as fulfilled! 🎉');
      loadRedemptions();
    } catch (error) {
      console.error('Failed to fulfill redemption:', error);
      toast.error('Failed to mark as fulfilled');
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending': return 'default';
      case 'approved': return 'secondary';
      case 'fulfilled': return 'outline';
      case 'denied': return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pending Review';
      case 'approved': return 'Approved - Ready to Fulfill';
      case 'fulfilled': return 'Fulfilled';
      case 'denied': return 'Denied';
      default: return status;
    }
  };

  const pendingRedemptions = redemptions.filter(r => r.status === 'pending');
  const approvedRedemptions = redemptions.filter(r => r.status === 'approved');
  const completedRedemptions = redemptions.filter(r => ['fulfilled', 'denied'].includes(r.status));

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-gradient-soft flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-gradient-soft">
      <PageHeader 
        title="Redemption Inbox" 
        onBack={onBack}
        right={
          <div className="bg-muted rounded-lg px-3 py-1 text-sm font-medium">
            {pendingRedemptions.length} pending
          </div>
        }
      />

      <div className="px-4 pt-safe-header pb-safe-nav space-y-4">
        <div className="space-y-8">
          {/* Pending Requests */}
          {pendingRedemptions.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Pending Requests ({pendingRedemptions.length})
              </h2>
              <div className="space-y-4">
                {pendingRedemptions.map((redemption) => (
                  <Card key={redemption.id} className="bg-white/95 backdrop-blur">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg font-semibold">
                            {redemption.reward?.image && (
                              <span className="mr-2">{redemption.reward.image}</span>
                            )}
                            {redemption.reward?.name}
                          </CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant={getStatusBadgeVariant(redemption.status)}>
                              {getStatusLabel(redemption.status)}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              Requested {new Date(redemption.requested_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-primary">
                            {redemption.reward?.point_cost} pts
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {redemption.reward?.description && (
                        <p className="text-sm text-muted-foreground mb-4">
                          {redemption.reward.description}
                        </p>
                      )}
                      
                      <div className="space-y-3">
                        <Textarea
                          placeholder="Optional note (visible to user)..."
                          value={denyNotes[redemption.id] || ''}
                          onChange={(e) => setDenyNotes(prev => ({ 
                            ...prev, 
                            [redemption.id]: e.target.value 
                          }))}
                          rows={2}
                        />
                        
                        <div className="flex gap-3">
                          <Button
                            onClick={() => handleDeny(redemption)}
                            disabled={processingId === redemption.id}
                            variant="outline"
                            className="flex-1"
                          >
                            <X className="w-4 h-4 mr-2" />
                            Deny
                          </Button>
                          <Button
                            onClick={() => handleApprove(redemption)}
                            disabled={processingId === redemption.id}
                            className="flex-1"
                          >
                            <Check className="w-4 h-4 mr-2" />
                            {processingId === redemption.id ? 'Processing...' : 'Approve & Deduct Points'}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* Approved - Ready to Fulfill */}
          {approvedRedemptions.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Package className="w-5 h-5" />
                Ready to Fulfill ({approvedRedemptions.length})
              </h2>
              <div className="space-y-4">
                {approvedRedemptions.map((redemption) => (
                  <Card key={redemption.id} className="bg-white/95 backdrop-blur border-green-200">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg font-semibold">
                            {redemption.reward?.image && (
                              <span className="mr-2">{redemption.reward.image}</span>
                            )}
                            {redemption.reward?.name}
                          </CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant={getStatusBadgeVariant(redemption.status)}>
                              {getStatusLabel(redemption.status)}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              Approved {new Date(redemption.approved_at!).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                        <p className="text-sm text-green-700">
                          Points have been deducted. Mark as fulfilled once you've delivered the reward.
                        </p>
                      </div>
                      
                      <Button
                        onClick={() => handleFulfill(redemption)}
                        disabled={processingId === redemption.id}
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        <Package className="w-4 h-4 mr-2" />
                        {processingId === redemption.id ? 'Processing...' : 'Mark as Fulfilled'}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* Completed */}
          {completedRedemptions.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Recent History ({completedRedemptions.length})
              </h2>
              <div className="space-y-3">
                {completedRedemptions.slice(0, 5).map((redemption) => (
                  <Card key={redemption.id} className="bg-white/80 backdrop-blur">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium">
                            {redemption.reward?.image && (
                              <span className="mr-2">{redemption.reward.image}</span>
                            )}
                            {redemption.reward?.name}
                          </span>
                          <Badge variant={getStatusBadgeVariant(redemption.status)} className="ml-2">
                            {getStatusLabel(redemption.status)}
                          </Badge>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {redemption.status === 'fulfilled' && redemption.fulfilled_at && 
                            new Date(redemption.fulfilled_at).toLocaleDateString()
                          }
                          {redemption.status === 'denied' && redemption.approved_at && 
                            new Date(redemption.approved_at).toLocaleDateString()
                          }
                        </span>
                      </div>
                      {redemption.notes && (
                        <p className="text-sm text-muted-foreground mt-1">{redemption.notes}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* Empty State */}
          {redemptions.length === 0 && (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <div className="text-foreground mb-2">No redemption requests yet</div>
              <div className="text-muted-foreground text-sm">
                Requests will appear here when users redeem rewards
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};