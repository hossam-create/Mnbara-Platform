import { create } from 'zustand';

export interface ConsentState {
    hasCompletedOnboarding: boolean;
    privacyPolicyAccepted: boolean;
    termsOfServiceAccepted: boolean;
    dataCollectionAccepted: boolean;
    marketingConsentAccepted: boolean;
    acceptPrivacyPolicy: () => void;
    acceptTermsOfService: () => void;
    acceptDataCollection: () => void;
    acceptMarketingConsent: (accepted: boolean) => void;
    completeOnboarding: () => void;
    resetConsents: () => void;
}

export const useConsentStore = create<ConsentState>((set) => ({
    hasCompletedOnboarding: false,
    privacyPolicyAccepted: false,
    termsOfServiceAccepted: false,
    dataCollectionAccepted: false,
    marketingConsentAccepted: false,
    acceptPrivacyPolicy: () => set({ privacyPolicyAccepted: true }),
    acceptTermsOfService: () => set({ termsOfServiceAccepted: true }),
    acceptDataCollection: () => set({ dataCollectionAccepted: true }),
    acceptMarketingConsent: (accepted) => set({ marketingConsentAccepted: accepted }),
    completeOnboarding: () => set({ hasCompletedOnboarding: true }),
    resetConsents: () => set({
        hasCompletedOnboarding: false,
        privacyPolicyAccepted: false,
        termsOfServiceAccepted: false,
        dataCollectionAccepted: false,
        marketingConsentAccepted: false,
    }),
}));
