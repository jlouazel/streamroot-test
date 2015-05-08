'use strict';

angular.module('streamrootTestApp')
.factory('Room', function ($rootScope, Auth, Peer) {
  var rooms = [],
  getCurrentUser = Auth.getCurrentUser,
  roomLimit = 5;

  /**
  * Create a unique id.
  * @return {String} The generated id.
  */
  function makeid() {
    var text = '';
    var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for(var i = 0; i < 10; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }

  /**
  * Change the room name with connected peers names.
  * @param {Object} room The target room.
  */
  function setName(room) {
    room.name = '';

    for (var i = 0, len = room.users.length; i < len; i++) {
      var user = Peer.getById(room.users[i]);

      if (user) {
        if (i !== 0) {
          room.name += ', ';
        }

        room.name += user.name;
      }
    }
  }

  return {
    _rooms: rooms,

    /**
     * Returns all rooms.
     * @return  {[Object]}  All created rooms.
     */
    getAll: function() {
      return rooms;
    },

    /**
     * Create a new room.
     * @return {Object} Returns the new created rooms.
     */
    create: function () {
      var newRoom = {
        id: makeid(),
        name: '',
        messages: [],
        picture: null,
        nonRead: 0,
        users: [],
        active: false
      };

      rooms.push(newRoom);
      return newRoom;
    },

    /**
     * Get peers from the room.
     * @param {Object} room The room containing the array of peer ids.
     * @return {[Object]}   An array of peers.
     */
    getPeers: function(room) {
      var peers = [];

      if (room) {
        for (var i = 0, len = room.users.length; i < len; i++) {
          var peer = Peer.getById(room.users[i]);

          if (peer) {
            peers.push(peer);
          }
        }
      }
      return peers;
    },

    /**
     * Find a room with an array of peer ids.
     * @param {[String]} peerIds  The array of peer ids to match with existing rooms.
     * @return {Object}           The matching room or null if not.
     */
    findByPeerIds: function(peerIds) {
      var peerIdsLength = peerIds.length;

      for (var i = 0, roomsLength = rooms.length; i < roomsLength; i++) {
        var matches = 0;
        for (var j = 0, roomUsersLength = rooms[i].users.length; j < roomUsersLength; j++) {
          if (roomUsersLength === peerIdsLength) {
            for (var k = 0; k < peerIdsLength; k++) {
              if (rooms[i].users[j] === peerIds[k]) {
                matches++;
              }
              if (matches === peerIdsLength) {
                return rooms[i];
              }
            }
          }
        }
      }
      return null;
    },

    /**
     * Find a room by its id.
     * @param {String} roomId The room id.
     * @return {Object}       The found room.
     */
    findById: function(roomId) {
      for (var i = 0, len = rooms.length; i < len; i++) {
        if (rooms[i].id === roomId) {
          return rooms[i];
        }
      }
      return null;
    },

    /**
     * Add a new user in a room.
     * @param {Object} room   The room in which to add the user.
     * @param {String} userId An user id to add in the room.
     */
    addUser: function(room, userId) {
      if (room && room.users.length + 1 < roomLimit) {
        room.users.push(userId);
        setName(room);
      }
    },

    /**
     * Set a room as `active`.
     * @param {Object} room  The room object to change.
     * @param {Boolean} value The value of the activate room state.
     */
    setActive: function(room, value) {
      if (room) {
        room.active = value;
      }

      var count = 0;
      for (var i = 0, len = rooms.length; i < len; i++) {
        if (rooms[i].active) {
          count++;
        }
      }

      if (count === 1) {
        $rootScope.$broadcast('room:active', room);
      }
    },

    /**
     * Send a message at all users in the room.
     * @param  {Object} room    The target room.
     * @param  {Object} message The message to send.
     */
    send: function(room, message) {
      message.blind = [];

      for (var i = 0, len = room.users.length; i < len; i++) {
        var peerName = Peer.send(room.users[i], message);

        if (peerName) {
          message.blind.push(peerName);
        }
      }
      room.messages.push(message);
    },

    /**
     * Check if an user is in room or not.
     * @param {Object} room   The room to check in.
     * @param {String} peerId The id of the user.
     * @return {Boolean}      Returns true if the user is found and false if not.
     */
    isInRoom: function(room, peerId) {
      if (room) {
        for (var i = 0, len = room.users.length; i < len; i++) {
          if (room.users[i] === peerId) {
            return true;
          }
        }
      }
      return false;
    },

    /**
     * Get a peer by its id through the room.
     * @param {String} peerId The peer id.
     * @return {Object}       The full related Peer object.
     */
    getPeerById: function(peerId) {
      return Peer.getById(peerId);
    },

    /**
     * Set a peer as connected through the room.
     * @param {Object} peer  The peer to change.
     * @param {Boolean} value State of the connection.
     */
    setPeerConnected: function(peer, value) {
      Peer.setConnected(peer, value);
    },

    /**
     * Remove a peer from a room.
     * @param {Object} room   Context room.
     * @param {String} peerId Id of the peer.
     */
    banPeer: function(room, peerId) {
      if (room) {
        for (var i = 0, len = room.users.length; i < len; i++) {
          if (room.users[i] === peerId) {
            room.users.splice(i, 1);
            setName(room);
          }
        }
      }
    },

    /**
     * Function called when a new message arrives. Treat in which room to put the message
     * and if there is no room, creates one.
     * @param {Object} message Received message.
     */
    handleNewMessage: function(message) {
      var users = message.users,
      sender = Peer.getById(message.sender);

      users.push(message.sender);

      var crtUserIdx = users.indexOf(getCurrentUser()._id);
      if (crtUserIdx >= -1) {
        users.splice(crtUserIdx, 1);
      }


      var room = this.findByPeerIds(users);

      if (!room) {
        room = this.create();
        for (var i = 0, len = users.length; i < len; i++) {
          this.addUser(room, users[i]);
        }
      }

      if (sender) {
        message.sender = sender;
      }

      room.messages.push(message);
      room.nonRead++;
      this.setActive(room, true);
      $rootScope.$broadcast('update');
    }
  };
});
