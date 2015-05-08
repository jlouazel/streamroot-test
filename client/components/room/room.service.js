'use strict';

angular.module('streamrootTestApp')
.factory('Room', function ($rootScope, Auth, Peer) {
  var rooms = [],
  getCurrentUser = Auth.getCurrentUser,
  roomLimit = 5;

  function makeid() {
    var text = '';
    var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for(var i = 0; i < 10; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }


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

    getAll: function() {
      return rooms;
    },

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

    findById: function(roomId) {
      for (var i = 0, len = rooms.length; i < len; i++) {
        if (rooms[i].id === roomId) {
          return rooms[i];
        }
      }
      return null;
    },

    addUser: function(room, userId) {
      if (room && room.users.length + 1 < roomLimit) {
        room.users.push(userId);
        setName(room);
      }
    },

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

    getPeerById: function(peerId) {
      return Peer.getById(peerId);
    },

    setPeerConnected: function(peer, value) {
      Peer.setConnected(peer, value);
    },

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
