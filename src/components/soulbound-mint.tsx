"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, XCircle, Lock, ExternalLink } from "lucide-react";

type NFTData = {
  tokenId: string;
  transactionHash: string;
};

// Add type definition for window.ethereum
declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: true;
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, handler: (accounts: string[]) => void) => void;
      removeListener: (event: string, handler: (accounts: string[]) => void) => void;
    };
  }
}

// Mock function to simulate checking eligibility
const checkWhitelistStatus = async (address: string): Promise<boolean> => {
  console.log(`Checking eligibility for ${address}...`);
  // In a real app, this would be a call to a backend or smart contract.
  await new Promise((resolve) => setTimeout(resolve, 1500));
  return Math.random() > 0.5;
};

// Mock function to simulate minting
const mintSoulboundToken = async (address: string): Promise<NFTData> => {
    console.log(`Minting for ${address}...`);
    // In a real app, this would be a web3 transaction.
    await new Promise((resolve) => setTimeout(resolve, 3000));
    // Simulate a possible failure
    if (Math.random() < 0.2) {
        throw new Error("Transaction failed. Please try again.");
    }
    return {
        tokenId: Math.floor(Math.random() * 10000).toString(),
        transactionHash: `0x${[...Array(64)].map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`,
    };
};


export default function SoulboundMint() {
  const [isClient, setIsClient] = useState(false);
  const [account, setAccount] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isEligible, setIsEligible] = useState<boolean | null>(null);
  const [isMinting, setIsMinting] = useState(false);
  const [nftData, setNftData] = useState<NFTData | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient && window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          setIsEligible(null);
          setNftData(null);
          setIsChecking(false);
          setIsMinting(false);
        } else {
          setAccount(null);
          toast({
            title: "Wallet Disconnected",
            description: "Please connect your wallet to continue.",
          });
        }
      };

      window.ethereum.on("accountsChanged", handleAccountsChanged);

      return () => {
        if (window.ethereum) {
          window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
        }
      };
    }
  }, [isClient, toast]);

  const connectWallet = async () => {
    if (!isClient) return;

    if (!window.ethereum) {
      console.log("MetaMask not found. Simulating wallet connection for development.");
      // Using a known address for mock connection
      const mockAccount = "0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B";
      setAccount(mockAccount);
      toast({
        title: "Wallet Connected (Simulated)",
        description: "This is a mock wallet for testing purposes.",
      });
      return;
    }

    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      if (accounts && accounts.length > 0) {
        setAccount(accounts[0]);
        toast({
          title: "Wallet Connected",
          description: "Your wallet has been successfully connected.",
        });
      }
    } catch (error) {
      console.error("Error connecting wallet:", error);
      toast({
        variant: "destructive",
        title: "Connection Failed",
        description: "Could not connect to wallet. Please try again.",
      });
    }
  };

  const handleCheckEligibility = async () => {
    if (!account) return;
    setIsChecking(true);
    setIsEligible(null);
    try {
      const eligibility = await checkWhitelistStatus(account);
      setIsEligible(eligibility);
      if (!eligibility) {
        toast({
            title: "Not Eligible",
            description: "Sorry, your wallet is not on the whitelist.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Eligibility Check Failed",
        description: "Could not check eligibility. Please try again later.",
      });
    } finally {
      setIsChecking(false);
    }
  };

  const handleMint = async () => {
    if (!account) return;
    setIsMinting(true);
    try {
      const data = await mintSoulboundToken(account);
      setNftData(data);
      toast({
        title: "Mint Successful!",
        description: `Your Soulbound NFT #${data.tokenId} has been minted.`,
      });
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Minting Failed",
            description: error.message || "An unknown error occurred during minting.",
        });
    } finally {
        setIsMinting(false);
    }
  };

  const truncateAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`;

  const renderContent = () => {
    if (!account) {
      return (
        <div className="text-center space-y-4">
          <p>Connect your wallet to get started.</p>
          <Button onClick={connectWallet} size="lg" className="w-full bg-primary hover:bg-primary/90">
            Connect Wallet
          </Button>
        </div>
      );
    }
    
    if (nftData) {
      return (
        <div className="space-y-4">
            <div className="relative mx-auto h-80 w-80 rounded-lg overflow-hidden border-2 border-primary shadow-lg">
                <Image src="https://placehold.co/400x400" alt="Soulbound NFT" width={400} height={400} className="h-full w-full object-cover" data-ai-hint="soulbound nft" />
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Lock className="w-20 h-20 text-primary-foreground/50" />
                </div>
            </div>
            <div className="text-center">
                <h3 className="text-2xl font-bold">Soulbound NFT #{nftData.tokenId}</h3>
                <p className="text-muted-foreground">Permanently bound to you.</p>
            </div>
            <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Owner:</span>
                    <span className="font-mono">{truncateAddress(account)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant="outline" className="text-chart-2 border-chart-2">Minted & Bound</Badge>
                </div>
            </div>
            <Button asChild variant="outline" className="w-full">
                <a href={`https://etherscan.io/tx/${nftData.transactionHash}`} target="_blank" rel="noopener noreferrer">
                    View on Etherscan <ExternalLink className="ml-2 h-4 w-4" />
                </a>
            </Button>
        </div>
      );
    }

    if (isMinting) {
        return (
            <div className="flex flex-col items-center justify-center text-center space-y-4 h-48">
                <Loader2 className="h-12 w-12 animate-spin text-accent" />
                <p className="text-lg font-semibold">Minting in Progress...</p>
                <p className="text-muted-foreground">Please confirm the transaction in your wallet.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Wallet:</span>
                    <span className="font-mono">{truncateAddress(account)}</span>
                </div>
                 <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Eligibility:</span>
                    {isChecking ? (
                        <Badge variant="outline"><Loader2 className="mr-2 h-3 w-3 animate-spin"/>Checking...</Badge>
                    ) : isEligible === null ? (
                        <Badge variant="secondary">Not Checked</Badge>
                    ) : isEligible ? (
                        <Badge variant="outline" className="text-chart-2 border-chart-2"><CheckCircle className="mr-2 h-3 w-3"/>Eligible</Badge>
                    ) : (
                        <Badge variant="destructive"><XCircle className="mr-2 h-3 w-3"/>Not Eligible</Badge>
                    )}
                </div>
            </div>

            {isEligible === null && (
                 <Button onClick={handleCheckEligibility} disabled={isChecking} className="w-full">
                    {isChecking && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                    Check Eligibility
                </Button>
            )}

            {isEligible && (
                <Button onClick={handleMint} disabled={isMinting} size="lg" className="w-full bg-accent hover:bg-accent/90">
                    {isMinting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Lock className="mr-2 h-4 w-4"/>}
                    Mint Your Soulbound NFT
                </Button>
            )}

            {isEligible === false && (
                <p className="text-center text-muted-foreground">Sorry, this wallet is not eligible. Try connecting another wallet.</p>
            )}

        </div>
    );
  };


  return (
    <Card className="w-full max-w-md shadow-2xl shadow-primary/10 border-border">
      <CardHeader>
        <CardTitle className="text-3xl font-bold text-center tracking-tight bg-gradient-to-r from-primary to-accent text-transparent bg-clip-text">
            Soulbound Mint
        </CardTitle>
        <CardDescription className="text-center">
          Claim your unique, non-transferable token.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-6 py-4">
        {renderContent()}
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground text-center flex-col space-y-1 pt-4">
          <p><Lock className="inline h-3 w-3 mr-1"/>Soulbound tokens are permanently tied to your wallet.</p>
          <p>They cannot be transferred or sold.</p>
      </CardFooter>
    </Card>
  );
}
