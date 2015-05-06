'use strict';

function makeid() {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for( var i=0; i < 10; i++ ) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

angular.module('streamrootTestApp')
.controller('MainCtrl', function ($scope, socket, Auth, User, _, $timeout, toastr, Room, Peer) {
  $scope.peers = [];

  $scope.getConnectedPeers = Peer.getConnected;



  Peer.getAll(function(peers) { $scope.peers = peers; });

  // Start listening some socket's events from the signaling server.
  socket.listenToWebRTC();

  $scope.getRoom = Room.getRoom;

  // $scope.getCurrentUser = Auth.getCurrentUser;
  //``
  // // $scope.rooms = Room._rooms;
  //
  //
  // socket.socket.on('signal', function(message) {
  //   var user = getUserById(message.sender);
  //
  //   if (message.type == 'offer') { handleOfferSignal(message, user);}
  //   else if (message.type == 'answer') {handleAnswerSignal(message, user);}
  //   else if (message.type == 'candidate' && user.running) {handleCandidateSignal(message, user);}
  // });
  //
  //
  // /**
  // * Return the user which matches the id passed as parameter.
  // * @param {String} userId
  // */
  // function getUserById(userId) {
  //   for (var i = 0, len = $scope.users.length; i < len; i++) {
  //     if ($scope.users[i]._id === userId) return $scope.users[i];
  //   }
  //   return null;
  // }
  //
  // /**
  // * Return the room which matches the room id passed as parameter.
  // * @param {String} roomId
  // */
  // // function getRoomById(roomId) {
  // //   for (var i = 0, len = $scope.rooms.length; i < len; i++) {
  // //     if ($scope.rooms[i].id === roomId) return $scope.rooms[i];
  // //   }
  // //   return null;
  // // }
  //
  // var initiateWebRTCState = function(user) {
  //   user.peerConnection = new webkitRTCPeerConnection(servers);
  //   user.peerConnection.ondatachannel = handleDataChannel;
  //   user.dataChannel = user.peerConnection.createDataChannel(dataChannelName);
  //   user.dataChannel.onmessage = handleDataChannelMessage;
  //   user.dataChannel.onopen = function() {
  //     user.dataChannel.send(JSON.stringify({
  //       type: 'command',
  //       from: 'room',
  //       sender: $scope.getCurrentUser()._id,
  //       name: 'connect',
  //       src: [user._id]
  //     }));
  //   };
  //
  //
  // };
  //
  //
  //
  // socket.socket.on('init', function(userId) {
  //   var user = getUserById(userId);
  //
  //   initiateWebRTCState(user);
  //
  //   // Start sending candidates
  //   user.peerConnection.oniceconnectionstatechange = function() {
  //     if (user.peerConnection.iceConnectionState == 'disconnected') {}
  //   };
  //   user.peerConnection.onicecandidate = handleICECandidate;
  //
  //   user.peerConnection.createOffer(function(sessionDescription) {
  //     // console.log('Sending offer to ' + userId);
  //     user.peerConnection.setLocalDescription(sessionDescription);
  //     sendSignalChannelMessage(sessionDescription);
  //   });
  // });
  //
  // var handleDataChannelClosed = function() {
  //   // console.log('The data channel has been closed!');
  // };
  //
  // var handleAnswerSignal = function(message, user) {
  //   user.peerConnection.setRemoteDescription(new RTCSessionDescription(message));
  // };
  //
  // var handleCandidateSignal = function(message, user) {
  //   console.log(message);
  //   user.peerConnection.addIceCandidate(new RTCIceCandidate(message));
  // };
  //
  //
  //
  // var handleSignalChannelMessage = function(message) {
  // };
  //
  // var handleOfferSignal = function(message, user) {
  //   user.running = true;
  //   initiateWebRTCState(user);
  //   // startSendingCandidates();
  //   user.peerConnection.setRemoteDescription(new RTCSessionDescription(message));
  //   user.peerConnection.createAnswer(function(sessionDescription) {
  //     // console.log('Sending answer to ' + message.sender);
  //     user.peerConnection.setLocalDescription(sessionDescription);
  //     sendSignalChannelMessage(sessionDescription);
  //   });
  // };
  //
  // /**
  // * WEBRTC Stuff
  // */
  //
  // var dataChannelName = makeid();
  //
  // // Google server for webrtc communication
  // var servers = {
  //   iceServers: [ {
  //     url : 'stun:stun.l.google.com:19302'
  //   }]
  // };
  //
  //
  //
  // var handleDataChannel = function(event) {
  //   event.channel.onmessage = handleDataChannelMessage;
  // };
  //
  // var treatCommands = function(message, user) {
  //   if (message.name === 'connect') {
  //     console.log(message);
  //
  //     var sender = getUserById(message.sender);
  //
  //     if (sender) {
  //       sender.connected = true;
  //
  //       var roomId = Room.create().id;
  //       Room.addUser(roomId, sender._id);
  //       Room.setVisible(roomId, true);
  //
  //       //
  //       // $scope.rooms.push({
  //       //   users: [user],
  //       //   visible: false,
  //       //   id: sender._id,
  //       //   show: false,
  //       //   name: sender.name,
  //       //   messages: [],
  //       //   picture: sender.picture
  //       // });
  //
  //       $scope.$apply();
  //     }
  //   }
  // };
  //
  // function treatText(message, user) {
  //   if (message.from === 'room') {
  //     var room = getRoomById(message.sender);
  //
  //     if (room) {
  //       if (!$scope.currentRoom) $scope.currentRoom = room;
  //       room.visible = true;
  //
  //       message.sender = user;
  //
  //       room.messages.push(message);
  //       $scope.$apply();
  //     }
  //   }
  // }
  //
  // var handleDataChannelMessage = function(event) {
  //
  //   var message = JSON.parse(event.data),
  //   user = getUserById(message.sender);
  //
  //   message.timeStamp = event.timeStamp;
  //
  //   if (message.type === 'command') treatCommands(message, user);
  //   else if (message.type === 'text') treatText(message, user);
  //   // for (var i = 0, len = $scope.rooms.length; i < len; i++) {
  //   //   console.log($scope.rooms[i], message.room);
  //   //
  //   //   if ($scope.rooms[i].id === message.room) {
  //   //     $scope.rooms[i].messages.push(message);
  //   //     $scope.rooms[i].visible = true;
  //   //     if (!$scope.currentRoom) {
  //   //       $scope.currentRoom = $scope.rooms[i];
  //   //     }
  //   //   }
  //   // }
  // };
  //
  //
  // // Handle ICE Candidate events by sending them to our remote
  // // Send the ICE Candidates via the signal channel
  // var handleICECandidate = function(event) {
  //   var candidate = event.candidate;
  //   if (candidate) {
  //     candidate.type = 'candidate';
  //     // console.log('Sending candidate.');
  //     sendSignalChannelMessage(candidate);
  //   } else {
  //     // console.log('All candidates sent');
  //   }
  // };
  //
  //
  //
  //
  // var sendSignalChannelMessage = function(message) {
  //   message.sender = $scope.getCurrentUser()._id;
  //
  //   socket.socket.emit('signal', message);
  // };
  //
  // /**
  // * //WEBRTC Stuff
  // */
  // $scope.currentRoom = null;
  //
  // $scope.select = function(roomId) {
  //   $scope.currentRoom = Room.findById(roomId);
  //
  // };
  //
  //
  // $scope.nbConnectedUsers = 0;
  //
  // $scope.query = '';
  //
  // User.getAll().$promise.then(function(users) {
  //   $scope.users = users;
  //
  //   _.remove($scope.users, {
  //     _id: $scope.getCurrentUser()._id
  //   });
  // });
  //
  // $scope.showRoom = function(room) {
  //   room.visible = true;
  //   $scope.currentRoom = room;
  // };
  //
  // $scope.sendMessage = function() {
  //   var message = {
  //     type: 'text',
  //     from: 'room',
  //     sender: $scope.getCurrentUser()._id,
  //     body: $scope.message,
  //     room: $scope.currentRoom.id,
  //     timeStamp: Date.now()
  //   };
  //
  //   for (var i = 0, len = $scope.currentRoom.users.length; i < len; i++) {
  //     $scope.currentRoom.users[i].dataChannel.send(JSON.stringify(message));
  //   }
  //
  //   $scope.currentRoom.messages.push(message);
  //   $scope.message = '';
  // };
  //
  // $timeout(function() {
  //   socket.socket.emit('init', $scope.getCurrentUser()._id);
  // });
});
