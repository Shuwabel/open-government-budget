"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Shield, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Download,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';
import { signatureService, SignatureData, VerificationResult } from '@/lib/crypto/signature-service';
import { web3Service } from '@/lib/blockchain/web3-service';
import { toast } from 'sonner';

interface SignatureVerifierProps {
  action: string;
  data: any;
  onSignatureVerified?: (result: VerificationResult) => void;
  onSignatureGenerated?: (signatureData: SignatureData) => void;
  expectedSigner?: string;
  readOnly?: boolean;
}

export function SignatureVerifier({
  action,
  data,
  onSignatureVerified,
  onSignatureGenerated,
  expectedSigner,
  readOnly = false
}: SignatureVerifierProps) {
  const [nonce, setNonce] = useState('');
  const [message, setMessage] = useState('');
  const [signature, setSignature] = useState('');
  const [signer, setSigner] = useState('');
  const [timestamp, setTimestamp] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [showSignature, setShowSignature] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);

  useEffect(() => {
    checkWalletConnection();
    generateNewNonce();
  }, []);

  useEffect(() => {
    if (nonce && action && data) {
      const timestamp = Date.now();
      const message = signatureService.createSignableMessage(action, data, nonce, timestamp);
      setMessage(message);
      setTimestamp(timestamp);
    }
  }, [nonce, action, data]);

  const checkWalletConnection = async () => {
    const walletInfo = await web3Service.getWalletInfo();
    setWalletConnected(walletInfo?.isConnected || false);
  };

  const generateNewNonce = () => {
    const newNonce = signatureService.generateNonce();
    setNonce(newNonce);
    setSignature('');
    setSigner('');
    setVerificationResult(null);
  };

  const generateSignature = async () => {
    if (!walletConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!message) {
      toast.error('No message to sign');
      return;
    }

    setIsGenerating(true);
    try {
      const signature = await signatureService.signMessage(message);
      const walletInfo = await web3Service.getWalletInfo();
      
      setSignature(signature);
      setSigner(walletInfo?.address || '');

      const signatureData: SignatureData = {
        message,
        signature,
        signer: walletInfo?.address || '',
        timestamp,
        nonce
      };

      onSignatureGenerated?.(signatureData);
      toast.success('Signature generated successfully');
    } catch (error) {
      toast.error(`Failed to generate signature: ${error}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const verifySignature = async () => {
    if (!signature || !signer || !message) {
      toast.error('Please generate a signature first');
      return;
    }

    setIsVerifying(true);
    try {
      const signatureData: SignatureData = {
        message,
        signature,
        signer,
        timestamp,
        nonce
      };

      let result: VerificationResult;
      
      if (action === 'approve_allocation' && expectedSigner) {
        result = await signatureService.verifyAllocationApproval(
          data.allocationId,
          signatureData,
          expectedSigner
        );
      } else if (action === 'approve_disbursement' && expectedSigner) {
        result = await signatureService.verifyDisbursementApproval(
          data.disbursementId,
          signatureData,
          expectedSigner
        );
      } else {
        result = await signatureService.verifySignature(signatureData);
      }

      setVerificationResult(result);
      onSignatureVerified?.(result);

      if (result.isValid) {
        toast.success('Signature verified successfully');
      } else {
        toast.error(`Signature verification failed: ${result.error}`);
      }
    } catch (error) {
      toast.error(`Verification error: ${error}`);
    } finally {
      setIsVerifying(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const downloadSignature = () => {
    if (!signature || !message) return;

    const signatureData = {
      action,
      data,
      message,
      signature,
      signer,
      timestamp,
      nonce,
      verificationResult
    };

    const blob = new Blob([JSON.stringify(signatureData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `signature-${action}-${timestamp}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Signature data downloaded');
  };

  const requirements = signatureService.getSignatureRequirements(action);

  return (
    <div className="space-y-6">
      {/* Signature Requirements */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Signature Requirements
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Required Role:</span>
            <Badge variant="outline" className="border-primary/30">
              {requirements.requiredRole}
            </Badge>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Description:</span>
            <p className="text-sm font-medium">{requirements.description}</p>
          </div>
          {expectedSigner && (
            <div>
              <span className="text-sm text-muted-foreground">Expected Signer:</span>
              <p className="text-sm font-mono bg-muted px-2 py-1 rounded">
                {web3Service.formatAddress(expectedSigner)}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Message Generation */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle>Signable Message</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="nonce">Nonce:</Label>
            <Input
              id="nonce"
              value={nonce}
              readOnly
              className="font-mono text-sm"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(nonce, 'Nonce')}
            >
              <Copy className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={generateNewNonce}
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>

          <div>
            <Label htmlFor="message">Message to Sign:</Label>
            <Textarea
              id="message"
              value={message}
              readOnly
              rows={6}
              className="font-mono text-sm"
            />
            <div className="flex justify-end mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(message, 'Message')}
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy Message
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Signature Generation */}
      {!readOnly && (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle>Generate Signature</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!walletConnected && (
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <div className="flex items-center gap-2 text-yellow-600">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    Wallet not connected. Please connect your wallet to generate signatures.
                  </span>
                </div>
              </div>
            )}

            <Button
              onClick={generateSignature}
              disabled={!walletConnected || isGenerating || !message}
              className="w-full bg-gradient-to-r from-primary to-accent hover:shadow-lg hover:shadow-primary/20"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Generating Signature...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 mr-2" />
                  Generate Digital Signature
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Signature Display */}
      {signature && (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle>Generated Signature</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="signer">Signer Address:</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="signer"
                  value={web3Service.formatAddress(signer)}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(signer, 'Signer address')}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="signature">Signature:</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="signature"
                  type={showSignature ? 'text' : 'password'}
                  value={signature}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSignature(!showSignature)}
                >
                  {showSignature ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(signature, 'Signature')}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={verifySignature}
                disabled={isVerifying}
                className="flex-1"
              >
                {isVerifying ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Verify Signature
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={downloadSignature}
              >
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Verification Result */}
      {verificationResult && (
        <Card className={`border-2 ${
          verificationResult.isValid 
            ? 'border-green-500/50 bg-green-500/5' 
            : 'border-red-500/50 bg-red-500/5'
        }`}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              {verificationResult.isValid ? (
                <>
                  <CheckCircle2 className="w-12 h-12 text-green-500 flex-shrink-0" />
                  <div>
                    <h3 className="text-xl font-bold text-green-600">Signature Verified</h3>
                    <p className="text-sm text-muted-foreground">
                      Digital signature is valid and authentic
                    </p>
                    <p className="text-sm font-mono text-green-600 mt-1">
                      Signer: {web3Service.formatAddress(verificationResult.signer)}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <AlertCircle className="w-12 h-12 text-red-500 flex-shrink-0" />
                  <div>
                    <h3 className="text-xl font-bold text-red-600">Signature Invalid</h3>
                    <p className="text-sm text-muted-foreground">
                      {verificationResult.error || 'Signature verification failed'}
                    </p>
                    {verificationResult.signer && (
                      <p className="text-sm font-mono text-red-600 mt-1">
                        Recovered Signer: {web3Service.formatAddress(verificationResult.signer)}
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

