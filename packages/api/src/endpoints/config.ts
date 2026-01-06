import { Providers } from '@librechat/agents';
import { logger } from '@librechat/data-schemas';
import { EModelEndpoint } from 'librechat-data-provider';
import type { TEndpoint } from 'librechat-data-provider';
import type { AppConfig } from '@librechat/data-schemas';
import type { BaseInitializeParams, InitializeResultBase } from '~/types';
import { initializeAnthropic } from './anthropic/initialize';
import { initializeBedrock } from './bedrock/initialize';
import { initializeCustom } from './custom/initialize';
import { initializeGoogle } from './google/initialize';
import { initializeOpenAI } from './openai/initialize';
import { getCustomEndpointConfig } from '~/app/config';

/**
 * Type for initialize functions
 */
export type InitializeFn = (params: BaseInitializeParams) => Promise<InitializeResultBase>;

/**
 * Check if the provider is a known custom provider
 * @param provider - The provider string
 * @returns True if the provider is a known custom provider, false otherwise
 */
export function isKnownCustomProvider(provider?: string): boolean {
  return [Providers.XAI, Providers.DEEPSEEK, Providers.OPENROUTER].includes(
    (provider?.toLowerCase() ?? '') as Providers,
  );
}

/**
 * Provider configuration map mapping providers to their initialization functions
 */
export const providerConfigMap: Record<string, InitializeFn> = {
  [Providers.XAI]: initializeCustom,
  [Providers.DEEPSEEK]: initializeCustom,
  [Providers.OPENROUTER]: initializeCustom,
  [EModelEndpoint.openAI]: initializeOpenAI,
  [EModelEndpoint.google]: initializeGoogle,
  [EModelEndpoint.bedrock]: initializeBedrock,
  [EModelEndpoint.azureOpenAI]: initializeOpenAI,
  [EModelEndpoint.anthropic]: initializeAnthropic,
};

/**
 * Result from getProviderConfig
 */
export interface ProviderConfigResult {
  /** The initialization function for this provider */
  getOptions: InitializeFn;
  /** The resolved provider name (may be different from input if normalized) */
  overrideProvider: string;
  /** Custom endpoint configuration (if applicable) */
  customEndpointConfig?: Partial<TEndpoint>;
}

/**
 * Get the provider configuration and override endpoint based on the provider string
 *
 * @param params - Configuration parameters
 * @param params.provider - The provider string
 * @param params.appConfig - The application configuration
 * @returns Provider configuration including getOptions function, override provider, and custom config
 * @throws Error if provider is not supported
 */
export function getProviderConfig({
  provider,
  appConfig,
}: {
  provider: string;
  appConfig?: AppConfig;
}): ProviderConfigResult {
  let getOptions = providerConfigMap[provider];
  let overrideProvider = provider;
  let customEndpointConfig: Partial<TEndpoint> | undefined;

  logger.debug(`[getProviderConfig] Resolving provider: ${provider}`, {
    isInMap: !!getOptions,
    isLowercaseInMap: !!providerConfigMap[provider.toLowerCase()],
  });

  if (!getOptions && providerConfigMap[provider.toLowerCase()] != null) {
    overrideProvider = provider.toLowerCase();
    getOptions = providerConfigMap[overrideProvider];
    logger.debug(`[getProviderConfig] Found provider using lowercase: ${overrideProvider}`);
  } else if (!getOptions) {
    logger.debug(`[getProviderConfig] Provider not in map, checking for custom endpoint: ${provider}`);
    customEndpointConfig = getCustomEndpointConfig({ endpoint: provider, appConfig });
    if (customEndpointConfig) {
      getOptions = initializeCustom;
      overrideProvider = Providers.OPENAI;
      logger.info(`[getProviderConfig] Found custom endpoint config for: ${provider}`, {
        baseURL: customEndpointConfig.baseURL,
        modelDisplayLabel: customEndpointConfig.modelDisplayLabel,
      });
    } else {
      logger.error(`[getProviderConfig] Provider not found: ${provider}`);
      throw new Error(`Provider ${provider} not supported`);
    }
  }

  if (isKnownCustomProvider(overrideProvider) && !customEndpointConfig) {
    logger.debug(`[getProviderConfig] Known custom provider, checking for config: ${overrideProvider}`);
    customEndpointConfig = getCustomEndpointConfig({ endpoint: provider, appConfig });
    if (!customEndpointConfig) {
      logger.error(`[getProviderConfig] No config found for known custom provider: ${provider}`);
      throw new Error(`Provider ${provider} not supported`);
    }
  }

  logger.debug(`[getProviderConfig] Resolution complete`, {
    provider,
    overrideProvider,
    hasCustomConfig: !!customEndpointConfig,
  });

  return {
    getOptions,
    overrideProvider,
    customEndpointConfig,
  };
}
