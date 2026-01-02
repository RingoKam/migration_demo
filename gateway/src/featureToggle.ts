// In-memory feature toggle store
interface FeatureToggleState {
  userService: boolean;
  licenseService: boolean;
}

// Initialize from environment variables
const initialState: FeatureToggleState = {
  userService: process.env.USE_NEW_USER_SERVICE === 'true',
  licenseService: process.env.USE_NEW_LICENSE_SERVICE === 'true'
};

// In-memory state
let featureToggleState: FeatureToggleState = { ...initialState };

export const featureToggle = {
  // Get current state
  getState(): FeatureToggleState {
    return { ...featureToggleState };
  },

  // Get toggle for specific service
  getUserService(): boolean {
    return featureToggleState.userService;
  },

  getLicenseService(): boolean {
    return featureToggleState.licenseService;
  },

  // Update toggles
  setUserService(enabled: boolean): void {
    featureToggleState.userService = enabled;
  },

  setLicenseService(enabled: boolean): void {
    featureToggleState.licenseService = enabled;
  },

  // Update all toggles
  setState(state: Partial<FeatureToggleState>): FeatureToggleState {
    featureToggleState = { ...featureToggleState, ...state };
    return { ...featureToggleState };
  },

  // Reset to initial state
  reset(): void {
    featureToggleState = { ...initialState };
  },
};

