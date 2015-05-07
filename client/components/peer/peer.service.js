'use strict';

angular.module('streamrootTestApp')
.factory('Peer', function ($rootScope, Auth, User) {

  var peers = [],
  getCurrentUser = Auth.getCurrentUser,
  connectedUsersCount = 0;

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

    getConnectedUsersCount: function() {
      return connectedUsersCount;
    },

    setConnected: function(peerId) {
      for (var i = 0, len = peers.length; i < len; i++) {
        if (peers[i]._id === peerId) {
          peers[i].connected = true;
          connectedUsersCount++;
          $rootScope.$broadcast('update');
        }
      }
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
        if (peers[i].connected) {
          _peers.push(peers[i]);
        }
      }

      return _peers;
    },

    send: function(peerId, message) {
      var peer = this.getById(peerId);

      if (peer && peer.dataChannel) peer.dataChannel.send(JSON.stringify(message));
    }
  };
});
