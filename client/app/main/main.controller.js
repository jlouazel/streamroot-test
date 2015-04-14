'use strict';

String.prototype.trunc =
function(n,useWordBoundary){
  var toLong = this.length>n,
  s_ = toLong ? this.substr(0,n-1) : this;
  s_ = useWordBoundary && toLong ? s_.substr(0,s_.lastIndexOf(' ')) : s_;
  return  toLong ? s_ + '&hellip;' : s_;
};

function makeid() {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for( var i=0; i < 10; i++ )
  text += possible.charAt(Math.floor(Math.random() * possible.length));
  return text;
}



angular.module('streamrootTestApp')
.controller('MainCtrl', function ($scope, socket, Auth, User, _, $timeout) {
  $scope.getCurrentUser = Auth.getCurrentUser;
  $scope.numConnectedUsers = 0;

  $scope.rooms = [];
  $scope.currentRoomIndex = -1;

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

  $scope.clientId = null;

  $scope.inAddition = false;

  $scope.message = '';
  $scope.messageQueue = [];

  $scope.clientsPool = [];

  var isInitiator = false;

  var configuration = {'iceServers': [{'url': 'stun:stun.l.google.com:19302'}]};


  socket.socket.on('alive', function(clientId, userId) {
    var user = _.find($scope.users, {'_id': userId});
    if (user) {
      user.connected = true;
      $scope.numConnectedUsers++;
    }
  });

  socket.socket.on('dead', function(socketid, userId) {
    console.log('DEAD');
    var user =  _.find($scope.users, {'_id': userId})
    if (user) {
      user.connected = false;
    }
    $scope.numConnectedUsers--;
  });

  socket.socket.on('ipaddr', function (ipaddr) {
    // console.log('Server IP address is: ' + ipaddr);
    // updateRoomURL(ipaddr);
  });

  socket.socket.on('created', function (room, clientId) {
    console.log('CREATED');
    $scope.clientId = clientId;

    updateRoomName(room);
    $scope.rooms.push(room);
    $scope.currentRoomIndex = $scope.rooms.length - 1;

    socket.socket.emit('add', room, room.users[0]._id);

    // console.log('Created room', $scope.room, '- my client ID is', clientId);
    isInitiator = true;
  });

  socket.socket.on('joined', function (room, clientId) {
    updateRoomName(room);
    $scope.currentRoomIndex = $scope.rooms.length - 1;
  });



  socket.socket.on('ready', function () {
    createPeerConnection(isInitiator, configuration);
  })

  socket.socket.on('log', function (array) {
    // console.log.apply(console, array);
  });

  socket.socket.on('message', function (message, clientId, userId, room) {
    if (!message.type && clientId != $scope.clientId) {
      var user = _.find($scope.users, {'_id': userId});

      if (!_.find($scope.rooms, {'id': room.id})) {
        $scope.rooms.push(room);
        $scope.currentRoomIndex = $scope.rooms.length - 1;
      }
      else if (userId !== $scope.getCurrentUser()._id) {
        $scope.rooms[$scope.currentRoomIndex].messages.push({content: message, sender: user});
        $timeout(function() {
          document.getElementById('chat').scrollTop = document.getElementById('chat').scrollHeight;
        }, 200);
      }
    }
    else
    signalingMessageCallback(message, clientId);
  });

  // Join a room
  // socket.socket.emit('create or join', $scope.room);

  function isInRoom(room, userId) {
    return !!_.find(room.users, {'_id': userId});
  }

  $scope.initRoom = function(user) {

    if (!$scope.inAddition) {
      var room = {
        id: makeid(),
        users: [user, $scope.getCurrentUser()],
        messages: []
      };

      var index = getRoomIndex(room);

      //
      if (index === -1) {
        updateRoomName(room);
        $scope.currentRoomIndex = $scope.rooms.length - 1;
        socket.socket.emit('create or join', room);
        socket.socket.emit('add', room, user._id);
      } else {
        $scope.currentRoomIndex = index;
      }
    } else {
      var currentRoom = $scope.rooms[$scope.currentRoomIndex];
      if (!isInRoom(currentRoom, user._id)) {
        currentRoom.users.push(user);
        updateRoomName(currentRoom);
        socket.socket.emit('add', currentRoom, user._id);
        $scope.inAddition = false;
      }
    }
  };

  $scope.additionActivation = function() {
    var currentRoom = $scope.rooms[$scope.currentRoomIndex];

    if (currentRoom.users.length < 5) {
      $scope.inAddition = !$scope.inAddition;
    } else {
      // TODO: Print that the room is full
    }
  };
  /**
  * Send message to signaling server
  */
  $scope.sendMessage = function(message) {
    if (message) {
      socket.socket.emit('message', message);
    } else if ($scope.message) {
      var currentRoom = $scope.rooms[$scope.currentRoomIndex];

      currentRoom.messages.push({
        content: $scope.message,
        sender: $scope.getCurrentUser()
      });

      if (currentRoom.messages.length === 1) {
        socket.socket.emit('notify', currentRoom, currentRoom.users[0]._id);
      }

      socket.socket.emit('message', $scope.message, $scope.rooms[$scope.currentRoomIndex]);

      $timeout(function() {
        document.getElementById('chat').scrollTop = document.getElementById('chat').scrollHeight;
      }, 200);

      $scope.message = '';

    }
  };


  if (location.hostname.match(/localhost|127\.0\.0/)) {
    socket.socket.emit('ipaddr');
  }

  function updateRoomName(room) {
    room.name = '';
    for (var i = 0, len = room.users.length; i < len; i++) {
      if (room.users[i]._id !== $scope.getCurrentUser()._id) {
        room.name += room.users[i].name;
      }
    }
    if (room.name.length > 37) {
      room.name.trunc(37);
      room.name += '...'
    }
  }

  function getRoomIndex(room) {
    console.log();
    for (var i = 0, len = $scope.rooms.length; i < len; i++) {
      if ($scope.rooms[i].users.length === room.users.length) {
        var onlyInA = $scope.rooms[i].users.filter(function(current){
          return room.users.filter(function(current_b){
            return current_b._id == current._id
          }).length == 0
        });

        var onlyInB = room.users.filter(function(current){
          return $scope.rooms[i].users.filter(function(current_a){
            return current_a._id == current._id
          }).length == 0
        });

        if (!onlyInA.concat(onlyInB).length) {
          return i;
        }
      }
    }
    return -1;
  }



  var peerConn;
  var dataChannel;

  function signalingMessageCallback(message, clientId) {
    if (message.type === 'offer') {
      // console.log('Got offer. Sending answer to peer.');
      peerConn.setRemoteDescription(new RTCSessionDescription(message), function(){}, logError);
      peerConn.createAnswer(onLocalSessionCreated, logError);

    } else if (message.type === 'answer') {
      // console.log('Got answer.');
      peerConn.setRemoteDescription(new RTCSessionDescription(message), function(){}, logError);

    } else if (message.type === 'candidate') {
      peerConn.addIceCandidate(new RTCIceCandidate({candidate: message.candidate}));

    } else if (message === 'bye') {
      // TODO: cleanup RTC connection?
    }
  }

  function createPeerConnection(isInitiator, config) {
    // console.log('Creating Peer connection as initiator?', isInitiator, 'config:', config);
    peerConn = new RTCPeerConnection(config);

    // send any ice candidates to the other peer
    peerConn.onicecandidate = function (event) {
      // console.log('onIceCandidate event:', event);
      if (event.candidate) {
        $scope.sendMessage({
          type: 'candidate',
          label: event.candidate.sdpMLineIndex,
          id: event.candidate.sdpMid,
          candidate: event.candidate.candidate
        });

      } else {
        // console.log('End of candidates.');
      }
    };

    if (isInitiator) {
      // console.log('Creating Data Channel');
      dataChannel = peerConn.createDataChannel("photos");
      onDataChannelCreated(dataChannel);

      // console.log('Creating an offer');
      peerConn.createOffer(onLocalSessionCreated, logError);
    } else {
      peerConn.ondatachannel = function (event) {
        // console.log('ondatachannel:', event.channel);
        dataChannel = event.channel;
        onDataChannelCreated(dataChannel);
      };
    }
  }

  function onLocalSessionCreated(desc) {
    // console.log('local session created:', desc);
    peerConn.setLocalDescription(desc, function () {
      // console.log('sending local desc:', peerConn.localDescription);
      $scope.sendMessage(peerConn.localDescription);
    }, logError);
  }

  function onDataChannelCreated(channel) {
    // console.log('onDataChannelCreated:', channel);

    channel.onopen = function () {
      // console.log('CHANNEL opened!!!');
    };

    channel.onmessage = (webrtcDetectedBrowser == 'firefox') ?
    receiveDataFirefoxFactory() :
    receiveDataChromeFactory();
  }

  function receiveDataChromeFactory() {
    var buf, count;

    return function onmessage(event) {
      if (typeof event.data === 'string') {
        buf = window.buf = new Uint8ClampedArray(parseInt(event.data));
        count = 0;
        // console.log('Expecting a total of ' + buf.byteLength + ' bytes');
        return;
      }

      var data = new Uint8ClampedArray(event.data);
      buf.set(data, count);

      count += data.byteLength;
      // console.log('count: ' + count);

      if (count == buf.byteLength) {
        // we're done: all data chunks have been received
        // console.log('Done. Rendering photo.');
        renderPhoto(buf);
      }
    }
  }

  function logError(err) {
    // console.log(err.toString(), err);
  }

  function receiveDataFirefoxFactory() {
    var count, total, parts;

    return function onmessage(event) {
      if (typeof event.data === 'string') {
        total = parseInt(event.data);
        parts = [];
        count = 0;
        console.log('Expecting a total of ' + total + ' bytes');
        return;
      }

      parts.push(event.data);
      count += event.data.size;
      // console.log('Got ' + event.data.size + ' byte(s), ' + (total - count) + ' to go.');

      if (count == total) {
        // console.log('Assembling payload')
        var buf = new Uint8ClampedArray(total);
        var compose = function(i, pos) {
          var reader = new FileReader();
          reader.onload = function() {
            buf.set(new Uint8ClampedArray(this.result), pos);
            if (i + 1 == parts.length) {
              // console.log('Done. Rendering photo.');
              renderPhoto(buf);
            } else {
              compose(i + 1, pos + this.result.byteLength);
            }
          };
          reader.readAsArrayBuffer(parts[i]);
        }
        compose(0, 0);
      }
    }
  }

  $scope.select = function(index) {
    $scope.currentRoomIndex = index;
  };

});
