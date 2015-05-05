'use strict';

angular.module('streamrootTestApp')
.factory('Room', function (socket) {
  var rooms = [];

  function setName(room) {
    console.log(room);
  }

  // Public API here
  return {
    _rooms: rooms,

    getAll: function() {
      return rooms;
    },

    create: function (visible) {
      var newRoom = {
        id: 'xyz',
        name: 'xyz',
        message: [],
        name: null,
        picture: null,
        users: [],
        visible: !!visible
      };

      rooms.push(newRoom);
      return newRoom;
    },

    findById: function(roomId) {
      for (var i = 0, len = rooms.length; i < len; i++) {
        if (rooms[i].id === roomId) return rooms[i];
      }
      return null;
    },

    find: function(room) {
      if (!room || !room.users) return null;

      for (var i = 0, len = rooms.length; i < len; i++) {
        if (rooms[i].users.length === room.users.length) {
          console.log('Possible match between', rooms[i], room);
        }
      }
    },

    addUser: function(roomId, userId) {
      var room = this.findById(roomId);

      if (room) room.users.push(userId);
    },

    setVisible: function(roomId, value) {
      var room = this.findById(roomId);

      if (room) room.visible = value
    }
  };
});
