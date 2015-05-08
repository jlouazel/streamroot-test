'use strict';

angular.module('streamrootTestApp')
.controller('MainCtrl', function ($scope, socket, Auth, Room, Peer) {
  $scope.peers = [];
  $scope.currentRoom = null;

  // Import Auth functions.
  $scope.getCurrentUser = Auth.getCurrentUser;

  // Import Room functions.
  $scope.getRooms = Room.getAll;
  $scope.isInRoom = Room.isInRoom;
  $scope.getPeersFromRoom = Room.getPeers;

  // Import Peer functions.
  $scope.getPeerById = Peer.getById;
  $scope.getConnectedUsersCount = Peer.getConnectedUsersCount;

  /**
  * Add an user to the room.
  * @param {String} peerId The id of the user to add.
  */
  $scope.addUser = function(peerId) {
    Room.send($scope.currentRoom, {
      type: 'command',
      sender: $scope.getCurrentUser()._id,
      users: $scope.currentRoom.users,
      body: {
        name: 'AddUser',
        newUser: peerId
      },
      room: $scope.currentRoom.id,
      timeStamp: Date.now()
    });

    Room.addUser($scope.currentRoom, peerId);
  };

  /**
  * Create a room if needed and focus on it if an user selects a peer on the right menu.
  * @param {String} peerId The id of the selected peer.
  */
  $scope.setRoomActive = function(peerId) {
    var room = Room.findByPeerIds([peerId]);

    if (!room) {
      room = Room.create();
      Room.addUser(room, peerId);
    }

    Room.setActive(room, true);
    room.nonRead = 0;
    $scope.currentRoom = room;
  };

  /**
  * Change the focused room.
  * @param {Object} room Selected room;
  */
  $scope.selectRoom = function(room) {
    $scope.currentRoom = room;
    room.nonRead = 0;
  };

  /**
  * Send a message when the user submit it.
  */
  $scope.sendMessage = function() {
    if ($scope.message) {

      Room.send($scope.currentRoom, {
        type: 'text',
        sender: $scope.getCurrentUser()._id,
        users: $scope.currentRoom.users,
        body: $scope.message,
        room: $scope.currentRoom.id,
        timeStamp: Date.now()
      });

      $scope.message = '';
    }
  };

  // Get all peers.
  Peer.getAll(function(peers) { $scope.peers = peers; });

  // Launch the signaling server listening.
  socket.listenToWebRTC();

  // Signals to make things happens in this scope.
  $scope.$on('update', function() { $scope.$digest(); });
  $scope.$on('room:active', function(e, room) { $scope.currentRoom = room; });
});
