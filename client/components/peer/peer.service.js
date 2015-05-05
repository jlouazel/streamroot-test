'use strict';

angular.module('streamrootTestApp')
.factory('Peer', function () {


  return {
    onSignalReceived: function(message) {
      console.log(message);
    }

  };
});
