import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { WebSocketService } from '@/services/websocket';

interface SwapOffer {
  offerId: string;
  fromUser: string;
  toUser: string;
  offerAmount: string;
  offerCurrency: string;
  requestAmount: string;
  requestCurrency: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';
  createdAt: Date;
  expiresAt: Date;
}

interface RealTimeMatch {
  matchId: string;
  userId: string;
  matchedUserId: string;
  swapType: 'buy' | 'sell';
  currencyPair: string;
  amount: number;
  agreedPrice: number;
  matchScore: number;
  trustScore: number;
  estimatedCompletionTime: number;
  createdAt: Date;
}

export const P2PSwapInterface: React.FC = () => {
  const [activeOffers, setActiveOffers] = useState<SwapOffer[]>([]);
  const [matches, setMatches] = useState<RealTimeMatch[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [formData, setFormData] = useState({
    offerAmount: '',
    offerCurrency: 'USDT',
    requestAmount: '',
    requestCurrency: 'ETH',
    targetUser: '',
    expiresInHours: 24
  });
  
  const { toast } = useToast();
  const wsService = WebSocketService.getInstance();

  useEffect(() => {
    // Initialize WebSocket connection
    const initWebSocket = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (token) {
          await wsService.connect(token);
          setIsConnected(true);
          
          // Subscribe to P2P swap events
          wsService.subscribe('swap:offer:created', handleNewOffer);
          wsService.subscribe('swap:offer:accepted', handleOfferAccepted);
          wsService.subscribe('swap:offer:rejected', handleOfferRejected);
          wsService.subscribe('match:proposal', handleMatchProposal);
          wsService.subscribe('match:accepted', handleMatchAccepted);
          
          // Load initial data
          await loadInitialData();
        }
      } catch (error) {
        console.error('WebSocket connection failed:', error);
        toast({
          title: 'Connection Error',
          description: 'Failed to connect to real-time services',
          variant: 'destructive'
        });
      }
    };

    initWebSocket();

    return () => {
      // Cleanup subscriptions
      wsService.unsubscribe('swap:offer:created', handleNewOffer);
      wsService.unsubscribe('swap:offer:accepted', handleOfferAccepted);
      wsService.unsubscribe('swap:offer:rejected', handleOfferRejected);
      wsService.unsubscribe('match:proposal', handleMatchProposal);
      wsService.unsubscribe('match:accepted', handleMatchAccepted);
    };
  }, []);

  const loadInitialData = async () => {
    try {
      // Fetch active offers
      const offersResponse = await fetch('/api/p2p-swap/offers/active');
      if (offersResponse.ok) {
        const offers = await offersResponse.json();
        setActiveOffers(offers);
      }

      // Fetch recent matches
      const matchesResponse = await fetch('/api/real-time-matches/recent');
      if (matchesResponse.ok) {
        const matchesData = await matchesResponse.json();
        setMatches(matchesData);
      }
    } catch (error) {
      console.error('Failed to load initial data:', error);
    }
  };

  const handleNewOffer = (data: any) => {
    setActiveOffers(prev => [...prev, data.offer]);
    toast({
      title: 'New Offer',
      description: `New swap offer received from ${data.offer.fromUser}`
    });
  };

  const handleOfferAccepted = (data: any) => {
    setActiveOffers(prev => prev.filter(offer => offer.offerId !== data.offerId));
    toast({
      title: 'Offer Accepted',
      description: 'Swap offer has been accepted successfully'
    });
  };

  const handleOfferRejected = (data: any) => {
    setActiveOffers(prev => prev.filter(offer => offer.offerId !== data.offerId));
    toast({
      title: 'Offer Rejected',
      description: 'Swap offer has been rejected'
    });
  };

  const handleMatchProposal = (data: any) => {
    setMatches(prev => [...prev, data.match]);
    toast({
      title: 'Match Found!',
      description: `Found a matching user with ${(data.match.matchScore * 100).toFixed(1)}% compatibility`
    });
  };

  const handleMatchAccepted = (data: any) => {
    setMatches(prev => prev.filter(match => match.matchId !== data.matchId));
    toast({
      title: 'Match Accepted',
      description: 'Real-time match has been accepted'
    });
  };

  const createSwapOffer = async () => {
    try {
      const response = await fetch('/api/p2p-swap/offers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast({
          title: 'Offer Created',
          description: 'Swap offer created successfully'
        });
        setFormData({
          offerAmount: '',
          offerCurrency: 'USDT',
          requestAmount: '',
          requestCurrency: 'ETH',
          targetUser: '',
          expiresInHours: 24
        });
      } else {
        throw new Error('Failed to create offer');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create swap offer',
        variant: 'destructive'
      });
    }
  };

  const acceptMatch = async (matchId: string) => {
    try {
      const response = await fetch(`/api/real-time-matches/${matchId}/accept`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (response.ok) {
        toast({
          title: 'Match Accepted',
          description: 'You have accepted the match'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to accept match',
        variant: 'destructive'
      });
    }
  };

  const joinMatchingPool = async () => {
    try {
      const response = await fetch('/api/real-time-matches/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          swapType: 'buy', // or 'sell' based on user selection
          currencyPair: `${formData.offerCurrency}/${formData.requestCurrency}`,
          amount: parseFloat(formData.offerAmount)
        })
      });

      if (response.ok) {
        toast({
          title: 'Joined Pool',
          description: 'You have joined the real-time matching pool'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to join matching pool',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Connection Status */}
      <div className="flex items-center space-x-2">
        <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
        <span className="text-sm">
          {isConnected ? 'Connected to Real-time Services' : 'Disconnected'}
        </span>
      </div>

      {/* Create Swap Offer */}
      <Card>
        <CardHeader>
          <CardTitle>Create P2P Swap Offer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="offerAmount">Offer Amount</Label>
              <Input
                id="offerAmount"
                type="number"
                value={formData.offerAmount}
                onChange={(e) => setFormData({ ...formData, offerAmount: e.target.value })}
                placeholder="Enter amount"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="offerCurrency">Offer Currency</Label>
              <Select
                value={formData.offerCurrency}
                onValueChange={(value) => setFormData({ ...formData, offerCurrency: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USDT">USDT</SelectItem>
                  <SelectItem value="ETH">ETH</SelectItem>
                  <SelectItem value="BTC">BTC</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="requestAmount">Request Amount</Label>
              <Input
                id="requestAmount"
                type="number"
                value={formData.requestAmount}
                onChange={(e) => setFormData({ ...formData, requestAmount: e.target.value })}
                placeholder="Enter amount"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="requestCurrency">Request Currency</Label>
              <Select
                value={formData.requestCurrency}
                onValueChange={(value) => setFormData({ ...formData, requestCurrency: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ETH">ETH</SelectItem>
                  <SelectItem value="BTC">BTC</SelectItem>
                  <SelectItem value="USDT">USDT</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetUser">Target User (Optional)</Label>
            <Input
              id="targetUser"
              value={formData.targetUser}
              onChange={(e) => setFormData({ ...formData, targetUser: e.target.value })}
              placeholder="User ID (leave empty for public offer)"
            />
          </div>

          <div className="flex space-x-4">
            <Button onClick={createSwapOffer} disabled={!formData.offerAmount || !formData.requestAmount}>
              Create Offer
            </Button>
            <Button variant="outline" onClick={joinMatchingPool}>
              Join Matching Pool
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Active Offers */}
      <Card>
        <CardHeader>
          <CardTitle>Active Swap Offers</CardTitle>
        </CardHeader>
        <CardContent>
          {activeOffers.length === 0 ? (
            <p className="text-gray-500">No active offers</p>
          ) : (
            <div className="space-y-3">
              {activeOffers.map((offer) => (
                <div key={offer.offerId} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold">
                        {offer.offerAmount} {offer.offerCurrency} → {offer.requestAmount} {offer.requestCurrency}
                      </p>
                      <p className="text-sm text-gray-500">From: {offer.fromUser}</p>
                    </div>
                    <Badge variant={offer.status === 'pending' ? 'default' : 'secondary'}>
                      {offer.status}
                    </Badge>
                  </div>
                  <div className="mt-2 flex space-x-2">
                    <Button size="sm">Accept</Button>
                    <Button size="sm" variant="outline">Reject</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Real-time Matches */}
      <Card>
        <CardHeader>
          <CardTitle>Real-time Matches</CardTitle>
        </CardHeader>
        <CardContent>
          {matches.length === 0 ? (
            <p className="text-gray-500">No active matches</p>
          ) : (
            <div className="space-y-3">
              {matches.map((match) => (
                <div key={match.matchId} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold">
                        {match.swapType.toUpperCase()} {match.amount} {match.currencyPair}
                      </p>
                      <p className="text-sm text-gray-500">
                        Match Score: {(match.matchScore * 100).toFixed(1)}%
                      </p>
                      <p className="text-sm text-gray-500">
                        Trust Score: {(match.trustScore * 100).toFixed(1)}%
                      </p>
                    </div>
                    <Badge variant="success">
                      {match.matchScore > 0.8 ? 'Excellent' : 'Good'} Match
                    </Badge>
                  </div>
                  <div className="mt-2">
                    <Button 
                      size="sm" 
                      onClick={() => acceptMatch(match.matchId)}
                      disabled={!isConnected}
                    >
                      Accept Match
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};