'use strict';

angular.module('streamrootTestApp')
.factory('Communication', function (Peer, Auth) {
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
    peer.dataChannel = peer.peerConnection.createDataChannel(dataChannelName);
    peer.dataChannel.onmessage = handleDataChannelMessage;
    peer.dataChannel.onopen = function() {
      peer.dataChannel.send(JSON.stringify({
        type: 'command',
        from: 'room',
        sender: getCurrentUser()._id,
        name: 'connect',
        src: [peer._id]
      }));
    };
  }

  function treatCommand(message, peer) {
    console.log();
  }

  function handleDataChannelMessage(e) {
    var message = JSON.parse(e.data),
    peer = Peer.getById(message.sender);

    message.timeStamp = e.timeStamp;
    console.log(peer);
  }

  function handleDataChannel(e) {
    e.channel.onmessage = handleDataChannelMessage;
  }

  function handleOfferSignal(message, peer, socket) {
    initWebRTC(peer);

    peer.connected = true;
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
      var peer = Peer.getById(message.sender);

      if (peer) {

        if (message.type === 'offer') handleOfferSignal(message, peer, socket);
        else if (message.type == 'answer') handleAnswerSignal(message, peer);
        else if (message.type == 'candidate' && peer.connected) handleCandidateSignal(message, peer);
      }
    },

    handleInitStart: function(peerId, socket) {
      var peer = Peer.getById(peerId);

      if (peer) {
        initWebRTC(peer);

        peer.peerConnection.oniceconnectionstatechange = function() {};
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

    },



  };
});
