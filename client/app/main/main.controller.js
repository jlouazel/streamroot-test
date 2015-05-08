'use strict';

angular.module('streamrootTestApp')
.controller('MainCtrl', function ($scope, socket, Auth, Room, Peer) {

  $scope.peers = [];
  $scope.getCurrentUser = Auth.getCurrentUser;
  $scope.getRooms = Room.getAll;
  $scope.getPeersFromRoom = Room.getPeers;

  $scope.getConnectedUsersCount = Peer.getConnectedUsersCount;

  $scope.currentRoom = null;


  Peer.getAll(function(peers) { $scope.peers = peers; });

  socket.listenToWebRTC();

  $scope.$on('update', function() { $scope.$digest(); });
  $scope.$on('room:active', function(e, room) {
    $scope.currentRoom = room;
    $scope.$apply();
  });

  $scope.getRoom = Room.getRoom;
  $scope.setRoomActive = function(peerId) {
    var room = Room.findByPeerIds([peerId]);

    // If the rooms does not yet exists.
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
