'use strict';

angular.module('streamrootTestApp')
.controller('MainCtrl', function ($scope) {
  $scope.message = '';

  $scope.post = function() {
    console.log($scope.message);
  };
});
