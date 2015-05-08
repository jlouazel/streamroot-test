'use strict';

angular.module('streamrootTestApp')
.factory('Peer', function ($rootScope, Auth, User) {

  var peers = [],
  getCurrentUser = Auth.getCurrentUser;

  // Handle `logout` broadcast from Auth.
  $rootScope.$on('logout', function() {
    for (var i = 0, len = peers.length; i < len; i++) {
      if (peers[i].connected === true  && peers[i].dataChannel) {
        peers[i].connected = false;
        peers[i].dataChannel.close();
        peers[i].peerConnection.close();
      }
    }
  });


  return {
    /**
     * Get all peers.
     * @param {Function} cb Callback to call when the $promise is resolved.
     */
    getAll: function(cb) {
      if (!peers || !peers.hasOwnProperty('$promise')) {
        peers = User.getAll();

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

    /**
     * Get the number of connected peers.
     * @return {Integer}  Number of connected peers.
     */
    getConnectedUsersCount: function() {
      var res = 0;
      for (var i = 0, len = peers.length; i < len; i++) {
        if (peers[i].connected) {
          res++;
        }
      }
      return res;
    },

    /**
     * Localy connect a peer.
     * @param {Object} peer  The peer object to connect.
     * @param {Boolean} value The value to set to the connection.
     */
    setConnected: function(peer, value) {
      if (peer) {
        if (value === true) {
          peer.connected = true;
        } else {
          peer.connected = false;
        }

        peer.checking = false;
        $rootScope.$broadcast('update');
      }
    },

    /**
     * Get peer by a specific id;
     * @param {String} peerId   Id of the peer to find.
     * @return {Object}         Found peer.
     */
    getById: function(peerId) {
      for (var i = 0, len = peers.length; i < len; i++) {
        if (peers[i]._id === peerId) {
          return peers[i];
        }
      }
      return null;
    },

    /**
     * Get all connected peers.
     * @return  {[Object]}  An array of the connected peers.
     */
    getConnected: function() {
      var _peers = [];
      for (var i = 0, len = peers.length; i < len; i++) {
        if (peers[i].connected) {
          _peers.push(peers[i]);
        }
      }
      return _peers;
    },

    /**
     * Send a message to a specific peer.
     * @param  {String} peerId  The targeted peer id.
     * @param  {Object} message The message to send.
     * @return {String}         Returns null if all was well completed and return its name if he could not send the mesaage.
     */
    send: function(peerId, message) {
      var peer = this.getById(peerId);

      if (peer) {
        if (peer.connected && peer.dataChannel && peer.dataChannel.readyState === 'open') {
          peer.dataChannel.send(JSON.stringify(message));
          return null;
        }
        return peer.name;
      }
      return null;
    }
  };
});
