'use strict';

String.prototype.trunc = function(n,useWordBoundary){
  var toLong = this.length>n,
  s_ = toLong ? this.substr(0,n-1) : this;
  s_ = useWordBoundary && toLong ? s_.substr(0,s_.lastIndexOf(' ')) : s_;
  return  toLong ? s_ + '&hellip;' : s_;
};

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

  /**
  * WEBRTC Stuff
  */
  var running = false,
  peerConnection,
  dataChannel;


  var dataChannelName = 'myAwesomeDataChannel';

  // Google server for webrtc communication
  var servers = {
    iceServers: [ {
      url : 'stun:stun.l.google.com:19302'
    } ]
  };

  var handleDataChannel = function(event) {
    event.channel.onmessage = handleDataChannelMessage;
  };

  var handleDataChannelMessage = function(event) {
    var message = JSON.parse(event.data);

    console.log(message.sender);
  };

  socket.socket.on('joined', function(userId) {
    for (var i = 0, len = $scope.users.length; i < len; i++) {
      if ($scope.users[i]._id === userId) {
        $scope.users[i].connected = true;

        var picture = $scope.users[i].picture || 'assets/images/no_photo.png';

        toastr.info('<img src="'+ picture + '"' +
        ' alt="" style="margin-left: -40px; margin-right: 10px;border-radius: 50%;width: 45px;float: left;">' +
        '<p style="color: #5f7676;"><b>' + $scope.users[i].name + '</b></br>is now connected.</p>', {
          iconClass: 'toast-default',
          allowHtml: true
        });
      }
    }

    console.log('>>>>>>>>>>>>>', userId, ' is now connected.');
  });

  // This is called when the WebRTC sending data channel is offically 'open'
  var handleDataChannelOpen = function(e) {
    socket.socket.emit('joined', $scope.getCurrentUser()._id, dataChannelName);

    console.log(e);
    dataChannel.send('Hello! I am');
  };

  // Called when the data channel has closed
  var handleDataChannelClosed = function() {
    console.log('The data channel has been closed!');
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
  // var peerConnection = new webkitRTCPeerConnection(servers);
  // peerConnection.ondatachannel = handleDataChannel;
  //
  // var dataChannel = peerConnection
  // .createDataChannel(dataChannelName);

  // Annouce arrival
  socket.socket.emit('ready', $scope.getCurrentUser()._id);
  socket.socket.on('ready', function(userId) {
    initiateWebRTCState();

    startSendingCandidates();
    peerConnection.createOffer(function(sessionDescription) {
      console.log('Sending offer to ' + userId);
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
      console.log('Client disconnected!');
      socket.socket.emit('ready', $scope.getCurrentUser()._id);
    }
  };

  socket.socket.on('signal', function(message) {
    handleSignalChannelMessage(message);
  });


  var handleSignalChannelMessage = function(message) {
    var sender = message.sender;
    var type = message.type;
    console.log('Recieved a \'' + type + '\' signal from ' + sender);
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
      console.log('Sending candidate.');
      sendSignalChannelMessage(candidate);
    } else {
      console.log('All candidates sent');
    }
  };

  var handleOfferSignal = function(message) {
    running = true;
    initiateWebRTCState();
    startSendingCandidates();
    peerConnection.setRemoteDescription(new RTCSessionDescription(message));
    peerConnection.createAnswer(function(sessionDescription) {
      console.log('Sending answer to ' + message.sender);
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





  $scope.numConnectedUsers = 0;

  $scope.query = '';

  User.getAll().$promise.then(function(users) {
    $scope.users = users;

    _.remove($scope.users, {
      _id: $scope.getCurrentUser()._id
    });

    User.getConnected().$promise.then(function(connectedUsers) {

      angular.forEach(connectedUsers, function(user) {
        var found = _.find($scope.users, {'_id': user});
        if (found && found._id !== $scope.getCurrentUser()._id && !found.connected) {
          found.connected = true;
          $scope.numConnectedUsers++;
        }
      });
    });
  });

  // $scope.clientId = null;
  //
  // $scope.inAddition = false;
  //
  // $scope.message = '';
  //
  // /*
  // * Set the user as connected when his socket connects to the application
  // */
  // socket.socket.on('alive', function(clientId, userId) {
  //   var user = _.find($scope.users, {'_id': userId});
  //   if (user) {
  //     user.connected = true;
  //     $scope.numConnectedUsers++;
  //   }
  // });
  //
  // /*
  // *
  // */
  // socket.socket.on('dead', function(socketid, userId) {
  //   var user =  _.find($scope.users, {'_id': userId});
  //   if (user) {
  //     user.connected = false;
  //     $scope.numConnectedUsers--;
  //   }
  // });
  //
  // socket.socket.on('created', function (room) {
  //   updateRoomName(room);
  //   $scope.rooms.push(room);
  //   $scope.currentRoomIndex = $scope.rooms.length - 1;
  // });
  //
  // socket.socket.on('joined', function (room) {
  //   updateRoomName(room);
  //   $scope.rooms.push(room);
  //   $scope.currentRoomIndex = $scope.rooms.length - 1;
  // });
  //
  // socket.socket.on('ban', function(room) {
  //   $scope.rooms.splice(room);
  //   $scope.currentRoomIndex = $scope.rooms.length - 1;
  // });
  //
  // socket.socket.on('leave', function(user, room) {
  //   var _room = _.find($scope.rooms, {'id': room.id});
  //   if (_room) {
  //     for (var i = 0, len = _room.users.length; i < len; i++) {
  //       if (_room.users[i] && _room.users[i]._id === user._id) {
  //         _room.users.splice(i, 1);
  //       }
  //     }
  //     if (_room.users.length === 1) {
  //       for (var j = 0, len1 = $scope.rooms.length; j < len1; j++) {
  //         if (_room.id === $scope.rooms[j].id) {
  //           $scope.rooms.splice(j, 1);
  //           $scope.currentRoomIndex = $scope.rooms.length - 1;
  //         }
  //       }
  //     }
  //   }
  // });
  //
  // socket.socket.on('message', function (message, userId, room) {
  //   if (!message.type) {
  //     var user = _.find($scope.users, {'_id': userId});
  //
  //     if (!_.find($scope.rooms, {'id': room.id})) {
  //       $scope.rooms.push(room);
  //       $scope.currentRoomIndex = $scope.rooms.length - 1;
  //     }
  //     else if (userId !== $scope.getCurrentUser()._id) {
  //       $scope.rooms[$scope.currentRoomIndex].messages.push({content: message, sender: user});
  //       $timeout(function() {
  //         document.getElementById('chat').scrollTop = document.getElementById('chat').scrollHeight;
  //       }, 200);
  //     }
  //   }
  // });
  //
  // function isInRoom(room, userId) {
  //   return !!_.find(room.users, {'_id': userId});
  // }
  //
  // $scope.ban = function(user) {
  //   socket.socket.emit('ban', user, $scope.rooms[$scope.currentRoomIndex]);
  // };
  //
  // $scope.initRoom = function(user) {
  //   if (!$scope.inAddition) {
  //     var room = {
  //       id: makeid(),
  //       users: [user, $scope.getCurrentUser()],
  //       messages: []
  //     };
  //
  //     var index = getRoomIndex(room);
  //
  //     //
  //     if (index === -1) {
  //       updateRoomName(room);
  //       $scope.currentRoomIndex = $scope.rooms.length - 1;
  //
  //       socket.socket.emit('init', room);
  //       socket.socket.emit('add', room, user._id);
  //     } else {
  //       $scope.currentRoomIndex = index;
  //     }
  //   } else {
  //     var currentRoom = $scope.rooms[$scope.currentRoomIndex];
  //     if (!isInRoom(currentRoom, user._id)) {
  //       currentRoom.users.push(user);
  //       updateRoomName(currentRoom);
  //       socket.socket.emit('add', currentRoom, user._id);
  //       $scope.inAddition = false;
  //     }
  //   }
  // };
  //
  // $scope.additionActivation = function() {
  //   var currentRoom = $scope.rooms[$scope.currentRoomIndex];
  //
  //   if (currentRoom.users.length < 5) {
  //     $scope.inAddition = !$scope.inAddition;
  //   } else {
  //     // TODO: Print that the room is full
  //   }
  // };
  // /**
  // * Send message to signaling server
  // */
  //
  //
  $scope.sendMessage = function() {
    dataChannel.send(JSON.stringify({
      sender: $scope.getCurrentUser()._id,
      body: $scope.message
    }));


    // if ($scope.message) {
    //   // $scope.roomsRTC[$scope.currentRoomIndex].sendToAll('message', {data: 'some text'});
    //
    //   var currentRoom = $scope.rooms[$scope.currentRoomIndex];
    //
    //   currentRoom.messages.push({
    //     content: $scope.message,
    //     sender: $scope.getCurrentUser()
    //   });
    //
    //   if (currentRoom.messages.length === 1) {
    //     socket.socket.emit('notify', currentRoom, currentRoom.users[0]._id);
    //   }
    //
    //   socket.socket.emit('message', $scope.message, $scope.rooms[$scope.currentRoomIndex]);
    //
    //   $timeout(function() {
    //     document.getElementById('chat').scrollTop = document.getElementById('chat').scrollHeight;
    //   }, 200);
    //
    //   $scope.message = '';
    //
    // }
  };
  //
  // if (location.hostname.match(/localhost|127\.0\.0/)) {
  //   socket.socket.emit('ipaddr');
  // }
  //
  // function updateRoomName(room) {
  //   room.name = '';
  //   for (var i = 0, len = room.users.length; i < len; i++) {
  //     if (room.users[i]._id !== $scope.getCurrentUser()._id) {
  //       room.name += room.users[i].name;
  //     }
  //   }
  //   if (room.name.length > 37) {
  //     room.name.trunc(37);
  //   }
  // }
  //
  // function getRoomIndex(room) {
  //   for (var i = 0, len = $scope.rooms.length; i < len; i++) {
  //     if ($scope.rooms[i].users.length === room.users.length) {
  //       var onlyInA = $scope.rooms[i].users.filter(function(current){
  //         return room.users.filter(function(currentB) {
  //           return currentB._id === current._id;
  //         }).length === 0;
  //       });
  //
  //       var onlyInB = room.users.filter(function(current){
  //         return $scope.rooms[i].users.filter(function(currentA){
  //           return currentA._id === current._id;
  //         }).length === 0;
  //       });
  //
  //       if (!onlyInA.concat(onlyInB).length) {
  //         return i;
  //       }
  //     }
  //   }
  //   return -1;
  // }
  //
  // $scope.select = function(index) {
  //   $scope.currentRoomIndex = index;
  // };

}]);
