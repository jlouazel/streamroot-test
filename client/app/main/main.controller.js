'use strict';

angular.module('streamrootTestApp')
.controller('MainCtrl', function ($scope, socket, Auth, Room, Peer) {

  $scope.peers = [];
  $scope.getCurrentUser = Auth.getCurrentUser;
  $scope.getRooms = Room.getAll;

  $scope.getPeerById = Peer.getById;
  $scope.getPeersFromRoom = Room.getPeers;


  $scope.getConnectedUsersCount = Peer.getConnectedUsersCount;

  $scope.currentRoom = null;


  Peer.getAll(function(peers) { $scope.peers = peers; });

  socket.listenToWebRTC();

  $scope.$on('update', function() { $scope.$digest(); });
  $scope.$on('room:active', function(e, room) {
    $scope.currentRoom = room;
  });

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

  $scope.isInRoom = Room.isInRoom;

  $scope.getRoom = Room.getRoom;
  $scope.setRoomActive = function(peerId) {
    var room = Room.findByPeerIds([peerId]);

    if (!room) {
      room = Room.create();
      Room.addUser(room, peerId);
    }

    Room.setActive(room, true);
    if (!$scope.currentRoom) {
      $scope.currentRoom = room;
    }
  };

  $scope.selectRoom = function(room) {
    $scope.currentRoom = room;
  };


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
});
