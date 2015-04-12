'use strict';

angular.module('streamrootTestApp', [
  'ngCookies',
  'ngResource',
  'ngSanitize',
  'btford.socket-io',
  'ui.router',
  'ui.bootstrap',
  'bernhardposselt.enhancetext'
])
.config(function ($stateProvider, $urlRouterProvider, $locationProvider, $httpProvider) {
  $urlRouterProvider
  .otherwise('/');

  $locationProvider.html5Mode(true);
  $httpProvider.interceptors.push('authInterceptor');
})

.config(function(enhanceTextFilterProvider) {
  enhanceTextFilterProvider.setOptions({
    cache: true,  // stores replaced text so angular update does not slow down
    // newLineToBr: true,  // replaces \n with <br/>
    embedLinks: true,  // replaces links with Html links
    embeddedLinkTarget: '_blank',  // sets the target of all replaced links
    embedImages: true,  // replaces links to images with Html images
    embeddedImagesHeight: undefined,  // if given will be used to set height of embedded images
    embeddedImagesWidth: undefined,  // if given will be used to set width of embedded images
    embedVideos: true,  // replaces links to videos with Html videos
    embeddedVideosHeight: undefined,  // if given will be used to set height of embedded videos
    embeddedVideosWidth: undefined,  // if given will be used to set width of embedded videos
    embedYoutube: true,  // replaces links to youtube videos with iframed youtube videos
    embeddedYoutubeHeight: undefined,  // height of youtube video
    embeddedYoutubeWidth: undefined,  // width of youtube video
  });
})
.factory('authInterceptor', function ($rootScope, $q, $cookieStore, $location) {
  return {
    // Add authorization token to headers
    request: function (config) {
      config.headers = config.headers || {};
      if ($cookieStore.get('token')) {
        config.headers.Authorization = 'Bearer ' + $cookieStore.get('token');
      }
      return config;
    },

    // Intercept 401s and redirect you to login
    responseError: function(response) {
      if(response.status === 401) {
        $location.path('/login');
        // remove any stale tokens
        $cookieStore.remove('token');
        return $q.reject(response);
      }
      else {
        return $q.reject(response);
      }
    }
  };
})

.run(function ($rootScope, $location, Auth) {
  // Redirect to login if route requires auth and you're not logged in
  $rootScope.$on('$stateChangeStart', function (event, next) {
    Auth.isLoggedInAsync(function(loggedIn) {
      if (next.authenticate && !loggedIn) {
        $location.path('/login');
      }
    });
  });
})
.constant('_', _);
