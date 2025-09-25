class Analytics {
  private initialized = false

  init(apiKey?: string, config?: Record<string, any>) {
    if (!this.initialized) {
      console.log('[Analytics] Initialized', { apiKey: apiKey ? '***' : 'none', config })
      this.initialized = true
    }
  }

  track(event: string, properties?: Record<string, any>) {
    console.log('[Analytics] Track:', event, properties || {})
  }

  identify(userId: string, traits?: Record<string, any>) {
    console.log('[Analytics] Identify:', userId, traits || {})
  }

  pageView(url?: string, properties?: Record<string, any>) {
    console.log('[Analytics] Page View:', url || window.location.pathname, properties || {})
  }

  reset() {
    console.log('[Analytics] User reset')
  }
}

export const analytics = new Analytics()