// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: 'https://7d77159f42e7ee0967c0f17711f21138@o4510175831719936.ingest.us.sentry.io/4510175832637440',

  enabled: process.env.NODE_ENV === 'production',

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 1,
  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,
})

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
