'use strict';

angular.module('streamrootTestApp')
.factory('Conversation', function (Message) {
  var messages = [];

  Message.getAll({}, function(remoteMessages) {
    messages = remoteMessages;

    console.log(messages);
  }, function(err) {
    // TODO: Handle the error
  });

  return {
    getFullConversation: function() {
      return messages;
    }
  };
});
