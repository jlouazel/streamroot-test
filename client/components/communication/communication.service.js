'use strict';

/**
* Create a unique id.
* @return {String} The generated id.
*/
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

  // Google servers for WebRTC communication.
  var servers = {
    iceServers: [ {
      url : 'stun:stun.l.google.com:19302'
    }]
  };

  var dataChannelName = makeid();

  /**
  * Send to signaling server for candidates.
  * @param {Object} message Message to send.
  * @param {Object} peer    Target user object.
  * @param {Object} socket  Socket object.
  */
  function sendSignalChannelMessage(message, peer, socket) {
    message.sender = getCurrentUser()._id;
    socket.emit('signal', peer._id, message);
  }

  /**
  * Initialize the basis of peerConnection and dataChannel to enable direct
  * communication between two peers.
  * @param {Object} peer  Target peer.
  */
  function initWebRTC(peer) {
    peer.peerConnection = new RTCPeerConnection(servers);
    peer.peerConnection.ondatachannel = handleDataChannel;
    peer.peerConnection.oniceconnectionstatechange = function() {
      var state = peer.peerConnection.iceConnectionState;

      if (state === 'disconnected') {
        Room.setPeerConnected(peer, false);
      }
    };

    peer.dataChannel = peer.peerConnection.createDataChannel(dataChannelName);
    peer.dataChannel.onmessage = handleDataChannelMessage;
    peer.dataChannel.onopen = function() {
      Room.setPeerConnected(peer, true);
    };
    peer.dataChannel.onclose = function() {
      peer.connected = false;
    };
  }

  /**
  * Called when a message is of type `command`.
  * @param {Object} message   Object of the message to send.
  */
  function handleCommand(message) {
    var users = [];

    users.push(message.sender);

    if (message.body.name === 'AddUser') {
      for (var i = 0, len = message.users; i < len; i++) {
        if (message.users[i] !== getCurrentUser()._id && message.users[i] !== message.body.newUser) {
          users.push(users[i]);
        }
      }

      var room = Room.findByPeerIds(users);
      if (room) {
        Room.addUser(room, message.body.newUser);
      } else {
        room = Room.create();
        users.push(message.body.newUser);
        for (var j = 0, len1 = users.length; j < len1; j++) {
          Room.addUser(room, users[j]);
          Room.handleNewMessage(message);
        }
        Room.setActive(room, true);
        $rootScope.$broadcast('room:active', room);
      }
    }
  }

  /**
   * Called when a message is received on the dataChannel. Calls others function
   * depending of the type of the received message.
   * @param {Object} e  An object of the new incomming event.
   */
  function handleDataChannelMessage(e) {
    var message = JSON.parse(e.data);

    if (message && message.type === 'text') {
      Room.handleNewMessage(message);
    }
    else if (message && message.type === 'command') {
      handleCommand(message);
    }
  }

  /**
   * Called when an action is intercepted by dataChannel
   * @param {Object} e Event on the dataChannel.
   */
  function handleDataChannel(e) { e.channel.onmessage = handleDataChannelMessage; }

  /**
   * Called when the user is receiving a connection offer from a peer.
   * @param {Object} message Candidate message.
   * @param {Object} peer    Remote peer local object.
   * @param {Object} socket  Socket object.
   */
  function handleOfferSignal(message, peer, socket) {
    peer.running = true;

    initWebRTC(peer);
    peer.peerConnection.setRemoteDescription(new RTCSessionDescription(message));
    peer.peerConnection.createAnswer(function(sessionDescription) {
      peer.peerConnection.setLocalDescription(sessionDescription);
      sendSignalChannelMessage(sessionDescription, peer, socket);
    });
  }

  /**
   * Handle an ICE candidate notification from the remote client.
   * @param {Object} message Connection message from remote peer.
   * @param {Object} peer    Peer object.
   */
  function handleCandidateSignal(message, peer) {
    peer.peerConnection.addIceCandidate(new RTCIceCandidate(message));
  }

  /**
   * Handle the response to our previous connection offer.
   * @param {Object} message Response message.
   * @param {Object} peer    Peer object.
   */
  function handleAnswerSignal(message, peer) {
    peer.peerConnection.setRemoteDescription(new RTCSessionDescription(message));
  }

  return {
    /**
     * Called when receiving `signal` from the signaling server.
     * Means that some peers are trying to contact us.
     * @param {Object} message Received message.
     * @param {Object} socket  Socket object.
     */
    handleSignalReception: function(message, socket) {

      var peer = Room.getPeerById(message.sender);

      if (peer) {
        if (message.type === 'offer') {
          handleOfferSignal(message, peer, socket);
        }
        else if (message.type === 'answer') {
          handleAnswerSignal(message, peer);
        }
        else if (message.type === 'candidate' && peer.running) {
          handleCandidateSignal(message, peer);
        }
      }
    },

    /**
     * Called when receiving `init` from the signaling server.
     * Means that someone has connected.
     * @param {String} peerId The id of the user who sent an `init`.
     * @param {Object} socket Socket object.
     */
    handleInitStart: function(peerId, socket) {
      var peer = Room.getPeerById(peerId);

      if (peer) {
        peer.checking = true;
        initWebRTC(peer);

        peer.peerConnection.onicecandidate = function(e) {
          var candidate = e.candidate;

          if (candidate) {
            candidate.type = 'candidate';
            sendSignalChannelMessage(candidate, peer, socket);
          }
        };

        peer.peerConnection.createOffer(function(sessionDescription) {
          peer.peerConnection.setLocalDescription(sessionDescription);
          sendSignalChannelMessage(sessionDescription, peer, socket);
        });
      }
    }
  };
});
