'use strict';

// Use local.env.js for environment variables that grunt will set when the server starts locally.
// Use for your api keys, secrets, etc. This file should not be tracked by git.
//
// You will need to set these on the server you deploy to.

module.exports = {
  DOMAIN: 'http://localhost:9000',
  SESSION_SECRET: "streamroottest-secret",

  FACEBOOK_ID: '1387387798251200',
  FACEBOOK_SECRET: 'baca50ebdfc5e62b7d4fc0f484b04063',

  TWITTER_ID: 'R9yLFPUo7O45FzcfbKSvWfLKd',
  TWITTER_SECRET: 'Wx537Ubt77CeIChgu1WZ0AKISuIHsBHxdw8VtnBZbPmJy635Zs',

  GOOGLE_ID: '993012909849-g1u3thurvu1b6sqrnfd2ukte5f0dnek2.apps.googleusercontent.com',
  GOOGLE_SECRET: 'jkW67TH4IHdKXo16fgkA7I8N',

  // Control debug level for modules using visionmedia/debug
  DEBUG: ''
};
