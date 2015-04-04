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

  GOOGLE_ID: 'app-id',
  GOOGLE_SECRET: 'secret',

  // Control debug level for modules using visionmedia/debug
  DEBUG: ''
};
