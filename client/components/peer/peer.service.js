'use strict';

angular.module('streamrootTestApp')
.factory('Peer', function (Auth, User) {

  var peers = User.getAll();
  var getCurrentUser = Auth.getCurrentUser;


  // User.getAll().$promise.then(function(users) {
  //
  //   peers = users;
  // });

  return {
    getPeers: function(cb) {
      if (peers.hasOwnProperty('$promise')) {
        peers.$promise.then(function(_peers) {
          _.remove(_peers, { _id: getCurrentUser()._id });
          cb(_peers);
        }).catch(function() {
          cb(null);
        });
      } else {
        cb(peers);
      }
    },

    onSignalReceived: function(message) {
      console.log(message);
    }

  };
});
