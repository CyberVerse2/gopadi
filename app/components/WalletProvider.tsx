"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getAddress, isConnected, requestAccess, signTransaction } from "@stellar/freighter-api";

const TESTNET_PASSPHRASE = "Test SDF Network ; September 2015";

type WalletContextValue = {
  address: string | null;
  connected: boolean;
  connecting: boolean;
  error: string | null;
  connect: () => Promise<string>;
  signXdr: (unsignedXdr: string, signer?: string) => Promise<string>;
};

const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    isConnected()
      .then(async (result) => {
        if (result.error || !result.isConnected) return;
        const current = await getAddress();
        if (!current.error && current.address) setAddress(current.address);
      })
      .catch(() => undefined);
  }, []);

  const connect = useCallback(async () => {
    setConnecting(true);
    setError(null);
    try {
      const connectedResult = await isConnected();
      if (connectedResult.error) throw new Error(connectedResult.error.message);
      if (!connectedResult.isConnected) {
        throw new Error("Install or unlock Freighter to connect a Stellar wallet.");
      }

      const access = await requestAccess();
      if (access.error) throw new Error(access.error.message);
      setAddress(access.address);
      return access.address;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Wallet connection failed.";
      setError(message);
      throw new Error(message);
    } finally {
      setConnecting(false);
    }
  }, []);

  const signXdr = useCallback(
    async (unsignedXdr: string, signer?: string) => {
      const signerAddress = signer ?? address ?? (await connect());
      const result = await signTransaction(unsignedXdr, {
        networkPassphrase: TESTNET_PASSPHRASE,
        address: signerAddress,
      });
      if (result.error) throw new Error(result.error.message);
      return result.signedTxXdr;
    },
    [address, connect],
  );

  const value = useMemo(
    () => ({
      address,
      connected: Boolean(address),
      connecting,
      error,
      connect,
      signXdr,
    }),
    [address, connect, connecting, error, signXdr],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const value = useContext(WalletContext);
  if (!value) throw new Error("useWallet must be used inside WalletProvider.");
  return value;
}
