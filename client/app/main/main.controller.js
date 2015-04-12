'use strict';

angular.module('streamrootTestApp')
.controller('MainCtrl', function ($scope, socket, Auth, User, _) {
  $scope.getCurrentUser = Auth.getCurrentUser;

  User.getAll().$promise.then(function(users) {
    $scope.users = users;

    _.remove($scope.users, {
      _id: $scope.getCurrentUser()._id
    });
  });

  $scope.connectedUsers = [];
  $scope.clientId = null;

  $scope.message = '';
  $scope.messageQueue = [];

  $scope.clientsPool = [];

  var isInitiator = false;

  var configuration = {'iceServers': [{'url': 'stun:stun.l.google.com:19302'}]};

  $scope.room = 'plop';


  socket.socket.on('live', function(clientId, userId) {

  });

  socket.socket.on('ipaddr', function (ipaddr) {
    console.log('Server IP address is: ' + ipaddr);
    // updateRoomURL(ipaddr);
  });

  socket.socket.on('created', function (room, clientId) {
    $scope.clientId = clientId;
    console.log('Created room', $scope.room, '- my client ID is', clientId);
    isInitiator = true;
  });

  socket.socket.on('joined', function (room, clientId) {
    $scope.clientId = clientId;
    console.log('This peer has joined room', room, 'with client ID', clientId);
    isInitiator = false;
  });

  socket.socket.on('quit', function(room, socketid) {
    console.log('Client ', socketid, ' has quitted.');
  });

  socket.socket.on('ready', function () {
    createPeerConnection(isInitiator, configuration);
  })

  socket.socket.on('log', function (array) {
    console.log.apply(console, array);
  });

  socket.socket.on('message', function (message, clientId, userId) {
    console.log('Client ', clientId,  ' received message:', message);

    if (!message.type && clientId != $scope.clientId) {
      $scope.messageQueue.push({content: message, sender: clientId});
    }
    else
    signalingMessageCallback(message, clientId);
  });

  // Join a room
  socket.socket.emit('create or join', $scope.room);

  if (location.hostname.match(/localhost|127\.0\.0/)) {
    socket.socket.emit('ipaddr');
  }

  /**
  * Send message to signaling server
  */
  $scope.sendMessage = function(message) {
    if (message) {
      socket.socket.emit('message', message);
    } else {
      console.log('Client sending message: ', $scope.message);
      socket.socket.emit('message', $scope.message, $scope.room);

      $scope.messageQueue.push({
        content: $scope.message,
        sender: $scope.getCurrentUser()._id
      });

      $scope.message = '';

    }
  }


  var peerConn;
  var dataChannel;

  function signalingMessageCallback(message, clientId) {
    if (message.type === 'offer') {
      console.log('Got offer. Sending answer to peer.');
      peerConn.setRemoteDescription(new RTCSessionDescription(message), function(){}, logError);
      peerConn.createAnswer(onLocalSessionCreated, logError);

    } else if (message.type === 'answer') {
      console.log('Got answer.');
      peerConn.setRemoteDescription(new RTCSessionDescription(message), function(){}, logError);

    } else if (message.type === 'candidate') {
      peerConn.addIceCandidate(new RTCIceCandidate({candidate: message.candidate}));

    } else if (message === 'bye') {
      // TODO: cleanup RTC connection?
    }
  }

  function createPeerConnection(isInitiator, config) {
    console.log('Creating Peer connection as initiator?', isInitiator, 'config:', config);
    peerConn = new RTCPeerConnection(config);

    // send any ice candidates to the other peer
    peerConn.onicecandidate = function (event) {
      console.log('onIceCandidate event:', event);
      if (event.candidate) {
        $scope.sendMessage({
          type: 'candidate',
          label: event.candidate.sdpMLineIndex,
          id: event.candidate.sdpMid,
          candidate: event.candidate.candidate
        });

      } else {
        console.log('End of candidates.');
      }
    };

    if (isInitiator) {
      console.log('Creating Data Channel');
      dataChannel = peerConn.createDataChannel("photos");
      onDataChannelCreated(dataChannel);

      console.log('Creating an offer');
      peerConn.createOffer(onLocalSessionCreated, logError);
    } else {
      peerConn.ondatachannel = function (event) {
        console.log('ondatachannel:', event.channel);
        dataChannel = event.channel;
        onDataChannelCreated(dataChannel);
      };
    }
  }

  function onLocalSessionCreated(desc) {
    console.log('local session created:', desc);
    peerConn.setLocalDescription(desc, function () {
      console.log('sending local desc:', peerConn.localDescription);
      $scope.sendMessage(peerConn.localDescription);
    }, logError);
  }

  function onDataChannelCreated(channel) {
    console.log('onDataChannelCreated:', channel);

    channel.onopen = function () {
      console.log('CHANNEL opened!!!');
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
        console.log('Expecting a total of ' + buf.byteLength + ' bytes');
        return;
      }

      var data = new Uint8ClampedArray(event.data);
      buf.set(data, count);

      count += data.byteLength;
      console.log('count: ' + count);

      if (count == buf.byteLength) {
        // we're done: all data chunks have been received
        console.log('Done. Rendering photo.');
        renderPhoto(buf);
      }
    }
  }

  function logError(err) {
    console.log(err.toString(), err);
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
      console.log('Got ' + event.data.size + ' byte(s), ' + (total - count) + ' to go.');

      if (count == total) {
        console.log('Assembling payload')
        var buf = new Uint8ClampedArray(total);
        var compose = function(i, pos) {
          var reader = new FileReader();
          reader.onload = function() {
            buf.set(new Uint8ClampedArray(this.result), pos);
            if (i + 1 == parts.length) {
              console.log('Done. Rendering photo.');
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


});
