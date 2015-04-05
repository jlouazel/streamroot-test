'use strict';

angular.module('streamrootTestApp')
.factory('Message', function($resource) {
  return $resource('/api/messages', {}, {
    getAll: {
      method: 'GET',
      isArray: true
    }
  });
});
