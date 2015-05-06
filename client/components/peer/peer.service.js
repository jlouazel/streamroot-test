'use strict';

angular.module('streamrootTestApp')
.factory('Peer', function (Auth, User) {

  var peers = [];
  var getCurrentUser = Auth.getCurrentUser;

  return {
    getAll: function(cb) {
      if (!peers || !peers.hasOwnProperty('$promise')) {
        peers = User.getAll();

        peers.$promise.then(function(_peers) {
          _.remove(_peers, { _id: getCurrentUser()._id });
          cb(_peers);
        }).catch(function() {
          cb(null);
        });
      } else cb(peers);
    },

    getById: function(peerId) {
      for (var i = 0, len = peers.length; i < len; i++) {
        if (peers[i]._id === peerId) return peers[i];
      }
      return null;
    },

    getConnected: function(peer) {
      var _peers = [];
      for (var i = 0, len = peers.length; i < len; i++) {
        if (peers[i].connected) _peers.push(peers[i]);
      }

      return _peers;
    }
  };
});
