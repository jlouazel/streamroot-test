'use strict';

angular.module('streamrootTestApp')
.factory('User', function ($resource) {
  return $resource('/api/users/:id/:controller', {
    id: '@_id'
  },
  {
    changePassword: {
      method: 'PUT',
      params: {
        controller:'password'
      }
    },
    get: {
      method: 'GET',
      params: {
        id:'me'
      }
    },
    getAll: {
      method: 'GET',
      isArray: true
    },
    getConnected: {
      method: 'GET',
      isArray: true,
      params: {
        controller: 'connected'
      }
    }
  });
});
