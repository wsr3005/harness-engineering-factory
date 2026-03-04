export interface FeatureFlagProvider {
  isEnabled(flagName: string): boolean;
}

export class StaticFeatureFlagProvider implements FeatureFlagProvider {
  constructor(private readonly flags: Record<string, boolean> = {}) {}

  isEnabled(flagName: string): boolean {
    return this.flags[flagName] ?? false;
  }
}
