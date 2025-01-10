'use client';

// Create a new file: src/utils/debug.utils.ts
type ResolveFunction = () => void;

declare global {
    interface Window {
      go: () => void;
      debug: {
        proceed: () => void;
        skip: () => void;
        status: () => void;
      }
    }
  }
  

class DebugController {
  private static instance: DebugController;
  private currentResolver: ResolveFunction | null = null;
  private isWaiting = false;

  private constructor() {
    // Initialize console command
    if (typeof window !== 'undefined') {
        window.go = () => window.debug.proceed();
        window.debug = {
          proceed: () => this.proceed(),
          skip: () => this.skip(),
          status: () => this.status(),
        };
        console.log('🔍 Debug mode active! Type "go" or "debug.proceed()" to advance');
    }
  }

  static getInstance(): DebugController {
    if (!DebugController.instance) {
      DebugController.instance = new DebugController();
    }
    return DebugController.instance;
  }

  async waitForCommand(stageName: string, details: object = {}): Promise<void> {
    if (typeof window === 'undefined') {
        return;
    }
    
    this.isWaiting = true;
    console.group(`🔍 Paused at: ${stageName}`);
    console.log('Details:', details);
    console.log('Type "go" to continue');
    console.log('Type "debug.status()" to see current state');
    console.groupEnd();

    return new Promise<void>((resolve) => {
      this.currentResolver = resolve;
    });
  }

  proceed(): void {
    if (this.currentResolver) {
      console.log('▶️ Proceeding...');
      const resolve = this.currentResolver;
      this.currentResolver = null;
      this.isWaiting = false;
      resolve();
    } else {
      console.log('No operation waiting to proceed');
    }
  }

  skip(): void {
    if (this.currentResolver) {
      console.log('⏭️ Skipping current pause');
      const resolve = this.currentResolver;
      this.currentResolver = null;
      this.isWaiting = false;
      resolve();
    } else {
      console.log('No operation to skip');
    }
  }

  status(): void {
    console.group('Debug Status');
    console.log('Is waiting:', this.isWaiting);
    console.log('Has pending operation:', !!this.currentResolver);
    console.groupEnd();
  }
}

export const debugController = DebugController.getInstance();

export async function debugStep(stageName: string, details: object = {}): Promise<void> {
  if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
    return debugController.waitForCommand(stageName, details);
  }
}