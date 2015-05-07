'use strict';

angular.module('streamrootTestApp')
.factory('Room', function ($rootScope, Auth, Peer) {
  var rooms = [],
  getCurrentUser = Auth.getCurrentUser;

  function makeid() {
    var text = '';
    var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for(var i = 0; i < 10; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }

  return {
    _rooms: rooms,

    getAll: function() {
      return rooms;
    },

    create: function () {
      var newRoom = {
        id: makeid(),
        name: '',
        messages: [],
        picture: null,
        users: [],
        active: false
      };

      rooms.push(newRoom);
      return newRoom;
    },

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

    setName: function(room) {
      room.name = '';

      for (var i = 0, len = room.users.length; i < len; i++) {
        var user = Peer.getById(room.users[i]);

        if (i !== 0) {
          room.name += ' ';
        }

        room.name += user.name;
      }
    },

    findByPeerIds: function(peerIds) {
      var peerIdsLength = peerIds.length;

      for (var i = 0, roomsLength = rooms.length; i < roomsLength; i++) {
        for (var j = 0, roomUsersLength = rooms[i].users.length; j < roomUsersLength; j++) {
          var matches = 0;
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

    findById: function(roomId) {
      for (var i = 0, len = rooms.length; i < len; i++) {
        if (rooms[i].id === roomId) {
          return rooms[i];
        }
      }
      return null;
    },

    addUser: function(room, userId) {
      if (room) {
        room.users.push(userId);
        this.setName(room);
      }
    },

    setActive: function(room, value) {
      if (room) {
        room.active = value;
      }
    },

    send: function(room, message) {
      for (var i = 0, len = room.users.length; i < len; i++) {
        Peer.send(room.users[i], message);
      }
      room.messages.push(message);
    },

    getPeerById: function(peerId) {
      return Peer.getById(peerId);
    },

    setPeerConnected: function(peerId, value) {
      Peer.setConnected(peerId, value);
    },

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
      this.setActive(room, true);

      $rootScope.$broadcast('room:active', room);
    }
  };
});
