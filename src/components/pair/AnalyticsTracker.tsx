'use client';

import { useEffect } from 'react';

interface AnalyticsTrackerProps {
  pairId: string;
}

export function AnalyticsTracker({ pairId }: AnalyticsTrackerProps) {
  useEffect(() => {
    // Track page view
    const trackPageView = () => {
      // In a real app, you would integrate with analytics services like:
      // - Google Analytics
      // - Mixpanel
      // - PostHog
      // - Custom analytics endpoint

      console.log(`Analytics: Pair detail page viewed - ${pairId}`);

      // Example: Send to your analytics endpoint
      // fetch('/api/analytics/track', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     event: 'pair_detail_view',
      //     pairId,
      //     timestamp: new Date().toISOString(),
      //     url: window.location.href,
      //     userAgent: navigator.userAgent,
      //   }),
      // });

      // Example: Google Analytics 4
      // if (typeof gtag !== 'undefined') {
      //   gtag('event', 'page_view', {
      //     page_title: `Pair Detail - ${pairId}`,
      //     page_location: window.location.href,
      //     custom_map: { custom_parameter_1: pairId }
      //   });
      // }
    };

    // Track interaction events
    const trackInteraction = (event: Event) => {
      const target = event.target as HTMLElement;
      const action = target.getAttribute('data-analytics-action');

      if (action) {
        console.log(`Analytics: Interaction - ${action} on pair ${pairId}`);

        // Example: Track specific interactions
        // fetch('/api/analytics/track', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({
        //     event: 'pair_interaction',
        //     action,
        //     pairId,
        //     timestamp: new Date().toISOString(),
        //   }),
        // });
      }
    };

    // Initial page view tracking
    trackPageView();

    // Add event listeners for interactions
    document.addEventListener('click', trackInteraction);

    // Track time spent on page
    const startTime = Date.now();

    const handleBeforeUnload = () => {
      const timeSpent = Date.now() - startTime;
      console.log(
        `Analytics: Time spent on pair ${pairId}: ${Math.round(
          timeSpent / 1000
        )}s`
      );

      // Example: Track session duration
      // navigator.sendBeacon('/api/analytics/track', JSON.stringify({
      //   event: 'pair_session_duration',
      //   pairId,
      //   duration: timeSpent,
      //   timestamp: new Date().toISOString(),
      // }));
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup
    return () => {
      document.removeEventListener('click', trackInteraction);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [pairId]);

  // This component doesn't render anything visible
  return null;
}

// Hook for manual analytics tracking
export function useAnalytics() {
  const trackEvent = (eventName: string, properties?: Record<string, any>) => {
    console.log(`Analytics: Custom event - ${eventName}`, properties);

    // Example: Send custom events
    // fetch('/api/analytics/track', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     event: eventName,
    //     properties,
    //     timestamp: new Date().toISOString(),
    //   }),
    // });
  };

  const trackSubscription = (
    pairId: string,
    action: 'subscribe' | 'renew' | 'upgrade'
  ) => {
    trackEvent('subscription_action', {
      pairId,
      action,
      timestamp: new Date().toISOString(),
    });
  };

  const trackChartInteraction = (pairId: string, interactionType: string) => {
    trackEvent('chart_interaction', {
      pairId,
      interactionType,
      timestamp: new Date().toISOString(),
    });
  };

  return {
    trackEvent,
    trackSubscription,
    trackChartInteraction,
  };
}
