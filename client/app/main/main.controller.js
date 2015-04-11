'use strict';

angular.module('streamrootTestApp')
.controller('MainCtrl', function ($scope, Conversation) {
  $scope.message = '';

  // Conversation.getFullConversation().$promise.then(function(messages) {
  //   console.log(messages);
  // }).catch(function() {
  //
  // });

  $scope.post = function() {
    console.log($scope.message);
  };
});
