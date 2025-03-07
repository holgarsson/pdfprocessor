interface Config {
  apiUrl: string;
}

class ConfigService {
  private static instance: ConfigService;
  private config: Config = {
    apiUrl: 'https://localhost:5001' // Default (local development)
  };
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;

  private constructor() {}

  public static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }

  public async init(): Promise<void> {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = new Promise<void>(async (resolve) => {
      if (this.isInitialized) {
        resolve();
        return;
      }

      try {
        const response = await fetch('/config.json');
        const json = await response.json();
        this.config = json;
        this.isInitialized = true;
        resolve();
      } catch (error) {
        console.error('Failed to load config.json:', error);
        // Keep using default config if loading fails
        this.isInitialized = true;
        resolve();
      }
    });

    return this.initPromise;
  }

  public getConfig(): Config {
    if (!this.isInitialized) {
      throw new Error('Config not initialized. Call init() first');
    }
    return this.config;
  }
}

export const configService = ConfigService.getInstance();
export const getConfig = () => configService.getConfig();