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
.factory('Communication', function ($rootScope, Room, Auth) {
  var getCurrentUser = Auth.getCurrentUser;

  var servers = {
    iceServers: [ {
      url : 'stun:stun.l.google.com:19302'
    }]
  };

  var dataChannelName = 'plop';

  function sendSignalChannelMessage(message, socket) {
    message.sender = getCurrentUser()._id;
    socket.emit('signal', message);
  }

  function initWebRTC(peer) {
    peer.peerConnection = new webkitRTCPeerConnection(servers);
    peer.peerConnection.ondatachannel = handleDataChannel;
    peer.peerConnection.oniceconnectionstatechange = function() {};

    peer.dataChannel = peer.peerConnection.createDataChannel(dataChannelName);
    peer.dataChannel.onmessage = handleDataChannelMessage;
    peer.dataChannel.onopen = function() {
      peer.dataChannel.send(JSON.stringify({
        type: 'connect',
        sender: getCurrentUser()._id
      }));
    };
  }

  function treatMessage(message) {
    $rootScope.$broadcast('message:new');
  }

  function handleDataChannelMessage(e) {
    var message = JSON.parse(e.data);

    if (message.type === 'text') Room.handleNewMessage(message);
    else if (message.type === 'connect') Room.setPeerConnected(message.sender);
  }

  function handleDataChannel(e) {
    e.channel.onmessage = handleDataChannelMessage;
  }

  function handleOfferSignal(message, peer, socket) {
    peer.running = true;


    initWebRTC(peer);


    peer.peerConnection.setRemoteDescription(new RTCSessionDescription(message));
    peer.peerConnection.createAnswer(function(sessionDescription) {
      peer.peerConnection.setLocalDescription(sessionDescription);
      sendSignalChannelMessage(sessionDescription, socket);
    });
  }

  function handleCandidateSignal(message, peer) {
    peer.peerConnection.addIceCandidate(new RTCIceCandidate(message));
  }

  function handleAnswerSignal(message, peer) {
    peer.peerConnection.setRemoteDescription(new RTCSessionDescription(message));
  }

  return {
    handleSignalReception: function(message, socket) {

      var peer = Room.getPeerById(message.sender);

      if (peer) {
        if (message.type === 'offer') handleOfferSignal(message, peer, socket);
        else if (message.type == 'answer') handleAnswerSignal(message, peer);
        else if (message.type == 'candidate' && peer.running) handleCandidateSignal(message, peer);
      }
    },

    handleInitStart: function(peerId, socket) {
      var peer = Room.getPeerById(peerId);

      if (peer) {
        initWebRTC(peer);

        peer.peerConnection.onicecandidate = function(e) {
          var candidate = e.candidate;

          if (candidate) {
            candidate.type = 'candidate';
            sendSignalChannelMessage(candidate, socket);
          }
        };

        peer.peerConnection.createOffer(function(sessionDescription) {
          peer.peerConnection.setLocalDescription(sessionDescription);
          sendSignalChannelMessage(sessionDescription, socket);
        });
      }
    }
  };
});
