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
.controller('MainCtrl', ['$scope', 'socket', 'Auth', 'User', '_', '$timeout', 'toastr',
function ($scope, socket, Auth, User, _, $timeout, toastr) {
  $scope.getCurrentUser = Auth.getCurrentUser;

  $scope.rooms = [];

  /**
  * WEBRTC Stuff
  */
  var running = false,
  peerConnection,
  dataChannel;


  var dataChannelName = makeid();

  // Google server for webrtc communication
  var servers = {
    iceServers: [ {
      url : 'stun:stun.l.google.com:19302'
    }]
  };

  function getUserById(userId) {
    for (var i = 0, len = $scope.users.length; i < len; i++) {
      if ($scope.users[i]._id === userId) return $scope.users[i];
    }
    return null;
  }

  function getRoomById(roomId) {
    for (var i = 0, len = $scope.rooms.length; i < len; i++) {
      if ($scope.rooms[i].id === roomId) return $scope.rooms[i];
    }
    return null;
  }

  var handleDataChannel = function(event) {
    event.channel.onmessage = handleDataChannelMessage;
  };

  var treatCommands = function(message) {
    if (message.name === 'connect') {
      var sender = getUserById(message.sender);

      if (sender) {
        sender.connected = true;

        $scope.rooms.push({
          visible: false,
          dataChannel: dataChannel,
          id: sender._id,
          show: false,
          name: sender.name,
          messages: [],
          picture: sender.picture
        });

        $scope.$apply();
      }
    }
  };

  function treatText(message) {
    if (message.from === 'room') {
      var room = getRoomById(message.sender);

      if (room) {
        if (!$scope.currentRoom) $scope.currentRoom = room;
        room.visible = true;

        message.sender = getUserById(message.sender);

        room.messages.push(message);
        $scope.$apply();
      }
    }
  }

  var handleDataChannelMessage = function(event) {
    var message = JSON.parse(event.data);
    message.timeStamp = event.timeStamp;

    if (message.type === 'command') treatCommands(message);
    else if (message.type === 'text') treatText(message);
    // for (var i = 0, len = $scope.rooms.length; i < len; i++) {
    //   console.log($scope.rooms[i], message.room);
    //
    //   if ($scope.rooms[i].id === message.room) {
    //     $scope.rooms[i].messages.push(message);
    //     $scope.rooms[i].visible = true;
    //     if (!$scope.currentRoom) {
    //       $scope.currentRoom = $scope.rooms[i];
    //     }
    //   }
    // }
  };

  socket.socket.on('joined', function(userId, channelName) {
    for (var i = 0, len = $scope.users.length; i < len; i++) {
      if ($scope.users[i]._id === userId) {
        $scope.users[i].connected = true;
        $scope.users[i].roomId = channelName;

        var picture = $scope.users[i].picture || 'assets/images/no_photo.png';


        toastr.info('<img src="'+ picture + '"' +
        ' alt="" style="margin-left: -40px; margin-right: 10px;border-radius: 50%;width: 45px;float: left;">' +
        '<p style="color: #5f7676;"><b>' + $scope.users[i].name + '</b></br>is now connected.</p>', {
          iconClass: 'toast-default',
          allowHtml: true
        });

        $scope.nbConnectedUsers++;

        // console.log('ROOMID:',channelName);
        $scope.rooms.push({
          visible: false,
          id: channelName,
          show: false,
          name: $scope.users[i].name,
          messages: [],
          picture: $scope.users[i].picture
        });
      }
    }

    // console.log($scope.rooms);
  });

  // This is called when the WebRTC sending data channel is offically 'open'
  var handleDataChannelOpen = function(e) {
    // socket.socket.emit('joined', $scope.getCurrentUser()._id, dataChannelName);

    // console.log(e);
    //
    // e.currentTarget.send('PLOP');
    // e.srcElement.send('PLOP');
    dataChannel.send(JSON.stringify({
      type: 'command',
      from: 'room',
      sender: $scope.getCurrentUser()._id,
      name: 'connect'
    }));
  };

  // Called when the data channel has closed
  var handleDataChannelClosed = function() {
    // console.log('The data channel has been closed!');
  };

  var handleAnswerSignal = function(message) {
    peerConnection.setRemoteDescription(new RTCSessionDescription(message));
  };

  var handleCandidateSignal = function(message) {
    var candidate = new RTCIceCandidate(message);
    peerConnection.addIceCandidate(candidate);
  };


  var initiateWebRTCState = function() {
    peerConnection = new webkitRTCPeerConnection(servers);
    peerConnection.ondatachannel = handleDataChannel;
    dataChannel = peerConnection.createDataChannel(dataChannelName);
    dataChannel.onmessage = handleDataChannelMessage;
    dataChannel.onopen = handleDataChannelOpen;
  };

  // Annouce arrival
  socket.socket.emit('init', $scope.getCurrentUser()._id);

  socket.socket.on('init', function(userId) {
    initiateWebRTCState();

    startSendingCandidates();
    peerConnection.createOffer(function(sessionDescription) {
      // console.log('Sending offer to ' + userId);
      peerConnection.setLocalDescription(sessionDescription);
      sendSignalChannelMessage(sessionDescription);
    });

  });

  var startSendingCandidates = function() {
    peerConnection.oniceconnectionstatechange = handleICEConnectionStateChange;
    peerConnection.onicecandidate = handleICECandidate;
  };

  var handleICEConnectionStateChange = function() {
    if (peerConnection.iceConnectionState == 'disconnected') {

      // console.log('Client disconnected!');
      socket.socket.emit('ready', $scope.getCurrentUser()._id);
    }
  };

  socket.socket.on('signal', function(message) {
    handleSignalChannelMessage(message);
  });


  var handleSignalChannelMessage = function(message) {
    var sender = message.sender;
    var type = message.type;
    // console.log('Recieved a \'' + type + '\' signal from ' + sender);
    if (type == 'offer') handleOfferSignal(message);
    else if (type == 'answer') handleAnswerSignal(message);
    else if (type == 'candidate' && running) handleCandidateSignal(message);
  };

  // Handle ICE Candidate events by sending them to our remote
  // Send the ICE Candidates via the signal channel
  var handleICECandidate = function(event) {
    var candidate = event.candidate;
    if (candidate) {
      candidate.type = 'candidate';
      // console.log('Sending candidate.');
      sendSignalChannelMessage(candidate);
    } else {
      // console.log('All candidates sent');
    }
  };

  var handleOfferSignal = function(message) {
    running = true;
    initiateWebRTCState();
    startSendingCandidates();
    peerConnection.setRemoteDescription(new RTCSessionDescription(message));
    peerConnection.createAnswer(function(sessionDescription) {
      // console.log('Sending answer to ' + message.sender);
      peerConnection.setLocalDescription(sessionDescription);
      sendSignalChannelMessage(sessionDescription);
    });
  };


  var sendSignalChannelMessage = function(message) {
    message.sender = $scope.getCurrentUser()._id;

    socket.socket.emit('signal', message);
  };

  /**
  * //WEBRTC Stuff
  */
  $scope.currentRoom = null;

  $scope.select = function(room) {
    $scope.currentRoom = room;
  };


  $scope.nbConnectedUsers = 0;

  $scope.query = '';

  User.getAll().$promise.then(function(users) {
    $scope.users = users;

    _.remove($scope.users, {
      _id: $scope.getCurrentUser()._id
    });
  });

  $scope.showRoom = function(room) {
    room.visible = true;
    $scope.currentRoom = room;
  };

  $scope.sendMessage = function() {
    $scope.currentRoom.dataChannel.send(JSON.stringify({
      type: 'text',
      from: 'room',
      sender: $scope.getCurrentUser()._id,
      body: $scope.message,
      room: $scope.currentRoom.id
    }));

    $scope.currentRoom.messages.push({
      sender: $scope.getCurrentUser()._id,
      body: $scope.message,
      timeStamp: Date.now()
    });

    $scope.message = '';
  };

}]);
