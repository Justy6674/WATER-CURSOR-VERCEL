
import { useCallback, useState } from 'react';

export const useBiometrics = () => {
  const [isAvailable, setIsAvailable] = useState(false);

  const checkBiometricAvailability = useCallback(async () => {
    if (!window.PublicKeyCredential) {
      console.log('WebAuthn API not available');
      return false;
    }

    try {
      const available = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      console.log('Biometric authentication available:', available);
      setIsAvailable(available);
      return available;
    } catch (error) {
      console.error('Biometric check failed:', error);
      return false;
    }
  }, []);

  const authenticateWithBiometrics = async (): Promise<boolean> => {
    if (!isAvailable) {
      console.log('Biometric authentication not available');
      return false;
    }

    try {
      // Create a challenge (in a real app, this would come from the server)
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);
      
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: {
            name: 'Water-4-WeightLoss',
            id: window.location.hostname,
          },
          user: {
            id: new Uint8Array(16),
            name: localStorage.getItem('lastUsedEmail') || 'user',
            displayName: 'User',
          },
          pubKeyCredParams: [{
            type: 'public-key',
            alg: -7, // ES256
          }],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'required', // Requires biometric verification
          },
          timeout: 60000,
        },
      });

      if (credential) {
        console.log('Biometric authentication successful');
        // Store a flag that biometric auth was successful
        sessionStorage.setItem('biometricAuth', 'true');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Biometric authentication failed:', error);
      return false;
    }
  };

  return {
    isAvailable,
    checkBiometricAvailability,
    authenticateWithBiometrics,
  };
};
