"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wallet, LogOut, ExternalLink, Copy, Check } from 'lucide-react';
import { web3Service, WalletInfo } from '@/lib/blockchain/web3-service';
import { toast } from 'sonner';

export function WalletConnection() {
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Check if wallet is already connected
    checkConnection();
    
    // Set up event listeners
    web3Service.on('walletConnected', handleWalletConnected);
    web3Service.on('walletDisconnected', handleWalletDisconnected);
    web3Service.on('chainChanged', handleChainChanged);

    return () => {
      web3Service.off('walletConnected', handleWalletConnected);
      web3Service.off('walletDisconnected', handleWalletDisconnected);
      web3Service.off('chainChanged', handleChainChanged);
    };
  }, []);

  const checkConnection = async () => {
    try {
      const info = await web3Service.getWalletInfo();
      setWalletInfo(info);
    } catch (error) {
      console.error('Failed to check connection:', error);
    }
  };

  const handleWalletConnected = (info: WalletInfo) => {
    setWalletInfo(info);
    toast.success('Wallet connected successfully!');
  };

  const handleWalletDisconnected = () => {
    setWalletInfo(null);
    toast.info('Wallet disconnected');
  };

  const handleChainChanged = (chainId: number) => {
    if (walletInfo) {
      setWalletInfo({ ...walletInfo, chainId });
    }
  };

  const connectWallet = async () => {
    setIsConnecting(true);
    try {
      await web3Service.connectWallet();
    } catch (error: any) {
      toast.error(error.message || 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = async () => {
    try {
      await web3Service.disconnectWallet();
    } catch (error: any) {
      toast.error(error.message || 'Failed to disconnect wallet');
    }
  };

  const switchToPolygon = async () => {
    try {
      await web3Service.switchToPolygon();
      toast.success('Switched to Polygon network');
    } catch (error: any) {
      toast.error(error.message || 'Failed to switch network');
    }
  };

  const switchToMumbai = async () => {
    try {
      await web3Service.switchToMumbai();
      toast.success('Switched to Mumbai testnet');
    } catch (error: any) {
      toast.error(error.message || 'Failed to switch network');
    }
  };

  const copyAddress = async () => {
    if (walletInfo?.address) {
      await navigator.clipboard.writeText(walletInfo.address);
      setCopied(true);
      toast.success('Address copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const openExplorer = () => {
    if (walletInfo?.address) {
      const url = web3Service.getAddressUrl(walletInfo.address, walletInfo.chainId);
      window.open(url, '_blank');
    }
  };

  const getNetworkName = (chainId: number) => {
    switch (chainId) {
      case 137:
        return 'Polygon';
      case 80001:
        return 'Mumbai';
      default:
        return `Chain ${chainId}`;
    }
  };

  const getNetworkColor = (chainId: number) => {
    switch (chainId) {
      case 137:
        return 'bg-purple-500';
      case 80001:
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (!walletInfo) {
    return (
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Connect Wallet
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Connect your wallet to interact with the blockchain and manage government budget transactions.
          </p>
          <Button
            onClick={connectWallet}
            disabled={isConnecting}
            className="w-full bg-gradient-to-r from-primary to-accent hover:shadow-lg hover:shadow-primary/20"
          >
            <Wallet className="w-4 h-4 mr-2" />
            {isConnecting ? 'Connecting...' : 'Connect MetaMask'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="w-5 h-5" />
          Wallet Connected
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Address */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
          <div className="flex-1 min-w-0">
            <p className="text-sm text-muted-foreground">Address</p>
            <p className="font-mono text-sm text-foreground truncate">
              {web3Service.formatAddress(walletInfo.address)}
            </p>
          </div>
          <div className="flex gap-2 ml-2">
            <Button
              variant="outline"
              size="sm"
              onClick={copyAddress}
              className="border-primary/30 hover:bg-primary/10"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={openExplorer}
              className="border-primary/30 hover:bg-primary/10"
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Network */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
          <div>
            <p className="text-sm text-muted-foreground">Network</p>
            <div className="flex items-center gap-2">
              <Badge className={`${getNetworkColor(walletInfo.chainId)} text-white`}>
                {getNetworkName(walletInfo.chainId)}
              </Badge>
            </div>
          </div>
          <div className="flex gap-2">
            {walletInfo.chainId !== 137 && (
              <Button
                variant="outline"
                size="sm"
                onClick={switchToPolygon}
                className="border-primary/30 hover:bg-primary/10"
              >
                Polygon
              </Button>
            )}
            {walletInfo.chainId !== 80001 && (
              <Button
                variant="outline"
                size="sm"
                onClick={switchToMumbai}
                className="border-primary/30 hover:bg-primary/10"
              >
                Mumbai
              </Button>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            onClick={disconnectWallet}
            className="flex-1 border-primary/30 hover:bg-primary/10"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Disconnect
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

