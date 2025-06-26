import { useState, useCallback, useEffect } from 'react';
import { Address, zeroAddress } from 'viem';
import { useAccount, usePublicClient } from 'wagmi';
import { useVaultCreation } from './useVaultCreation';
import { VaultType } from '@/types/contracts';

// Form validation errors
type FormErrors = {
  name?: string;
  symbol?: string;
  asset?: string;
  strategy?: string;
  depositAmount?: string;
  general?: string;
};

// Vault creation form state
type VaultCreationFormState = {
  // Basic info
  name: string;
  symbol: string;
  description: string;
  
  // Asset selection
  asset: Address;
  assetSymbol: string;
  assetDecimals: number;
  
  // Strategy
  strategy: string;
  
  // Initial deposit
  depositAmount: string;
  
  // Advanced settings
  performanceFee: number;
  managementFee: number;
  depositLimit: string;
  
  // UI state
  isSubmitting: boolean;
  isSuccess: boolean;
  errors: FormErrors;
  vaultAddress?: Address;
};

// Default form state
const DEFAULT_FORM_STATE: Omit<VaultCreationFormState, 'errors'> = {
  name: '',
  symbol: '',
  description: '',
  asset: zeroAddress,
  assetSymbol: '',
  assetDecimals: 18,
  strategy: 'aave-v3',
  depositAmount: '0',
  performanceFee: 10, // 10%
  managementFee: 2,   // 2%
  depositLimit: '0',    // 0 = no limit
  isSubmitting: false,
  isSuccess: false,
};

type UseVaultCreationFormProps = {
  defaultValues?: Partial<Omit<VaultCreationFormState, 'errors'>>;
  onSuccess?: (vaultAddress: Address) => void;
};

export function useVaultCreationForm({
  defaultValues = {},
  onSuccess,
}: UseVaultCreationFormProps = {}) {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  
  const [formState, setFormState] = useState<Omit<VaultCreationFormState, 'errors'>>({
    ...DEFAULT_FORM_STATE,
    ...defaultValues,
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  
  // Vault creation hook
  const { createVault, isLoading: isCreating, error: creationError } = useVaultCreation({
    onSuccess: (vaultAddress) => {
      setFormState(prev => ({
        ...prev,
        isSubmitting: false,
        isSuccess: true,
        vaultAddress,
      }));
      
      if (onSuccess) {
        onSuccess(vaultAddress);
      }
    },
    onError: (error) => {
      setFormState(prev => ({
        ...prev,
        isSubmitting: false,
      }));
      
      setErrors(prev => ({
        ...prev,
        general: error.message,
      }));
    },
  });
  
  // Update form field
  const updateField = useCallback(<K extends keyof Omit<VaultCreationFormState, 'errors'>>(
    field: K,
    value: VaultCreationFormState[K]
  ) => {
    setFormState(prev => ({
      ...prev,
      [field]: value,
    }));
    
    // Clear error for this field when it's updated
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined,
      }));
    }
  }, [errors]);
  
  // Update asset information
  const updateAsset = useCallback((asset: Address, symbol: string, decimals: number) => {
    setFormState(prev => ({
      ...prev,
      asset,
      assetSymbol: symbol,
      assetDecimals: decimals,
    }));
    
    // Clear asset-related errors
    setErrors(prev => ({
      ...prev,
      asset: undefined,
    }));
  }, []);
  
  // Validate form
  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};
    
    // Validate name
    if (!formState.name.trim()) {
      newErrors.name = 'Vault name is required';
    } else if (formState.name.length > 32) {
      newErrors.name = 'Name must be 32 characters or less';
    }
    
    // Validate symbol
    if (!formState.symbol.trim()) {
      newErrors.symbol = 'Vault symbol is required';
    } else if (formState.symbol.length > 10) {
      newErrors.symbol = 'Symbol must be 10 characters or less';
    } else if (!/^[A-Z0-9]+$/.test(formState.symbol)) {
      newErrors.symbol = 'Symbol must contain only uppercase letters and numbers';
    }
    
    // Validate asset
    if (formState.asset === zeroAddress) {
      newErrors.asset = 'Please select an asset';
    }
    
    // Validate deposit amount if provided
    if (formState.depositAmount) {
      const amount = parseFloat(formState.depositAmount);
      if (isNaN(amount) || amount < 0) {
        newErrors.depositAmount = 'Invalid deposit amount';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formState]);
  
  // Handle form submission
  const submitForm = useCallback(async () => {
    if (!address) {
      setErrors({ general: 'Please connect your wallet' });
      return false;
    }
    
    // Validate form
    if (!validateForm()) {
      return false;
    }
    
    try {
      setFormState(prev => ({
        ...prev,
        isSubmitting: true,
      }));
      
      // Convert vault type
      let vaultType: VaultType;
      switch (formState.strategy) {
        case 'aave-v3':
          vaultType = VaultType.AAVE_V3;
          break;
        case 'compound':
          vaultType = VaultType.COMPOUND;
          break;
        case 'yearn':
          vaultType = VaultType.YEARN;
          break;
        default:
          vaultType = VaultType.AAVE_V3; // Default to Aave V3
      }
      
      // Create the vault
      await createVault(
        vaultType,
        formState.name,
        formState.symbol.toUpperCase(),
        formState.asset
      );
      
      // If there's an initial deposit, it will be handled by the onSuccess callback
      
      return true;
    } catch (error) {
      console.error('Vault creation failed:', error);
      setErrors({
        general: error instanceof Error ? error.message : 'Failed to create vault',
      });
      return false;
    }
  }, [address, formState, validateForm, createVault]);
  
  // Reset form
  const resetForm = useCallback(() => {
    setFormState({
      ...DEFAULT_FORM_STATE,
      ...defaultValues,
    });
    setErrors({});
  }, [defaultValues]);
  
  return {
    // Form state
    ...formState,
    errors,
    isSubmitting: formState.isSubmitting || isCreating,
    
    // Actions
    updateField,
    updateAsset,
    submitForm,
    resetForm,
    
    // Validation
    validateForm,
    
    // Derived state
    isFormValid: Object.keys(errors).length === 0 && 
                formState.name.trim() !== '' && 
                formState.symbol.trim() !== '' && 
                formState.asset !== zeroAddress,
  };
}
