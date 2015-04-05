'use strict';

angular.module('streamrootTestApp')
.factory('Conversation', function (Message) {
  var messages = [];

  return {
    getFullConversation: function() {
      return messages;
    }
  };
});
