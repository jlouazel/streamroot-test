'use strict';

angular.module('streamrootTestApp')
.controller('MainCtrl', function ($scope, Conversation) {
  $scope.message = '';

  var servers = null,
  sendChannel,
  receiveChannel;

  var localPeerConnection = window.localPeerConnection =
  new webkitRTCPeerConnection(servers, {
    optional: [{
      RtpDataChannels: true
    }]
  });

  console.log('Created local peer connection object localPeerConnection');

  try {
    // Reliable Data Channels not yet supported in Chrome
    sendChannel = localPeerConnection.createDataChannel('sendDataChannel', {
      reliable: false
    });
    console.log('Created send data channel');
  } catch (e) {
    // alert('Failed to create data channel. ' +
    // 'You need Chrome M25 or later with RtpDataChannel enabled');
    console.log('createDataChannel() failed with exception: ' + e.message);
  }
  localPeerConnection.onicecandidate = gotLocalCandidate;
  sendChannel.onopen = handleSendChannelStateChange;
  sendChannel.onclose = handleSendChannelStateChange;

  remotePeerConnection = window.remotePeerConnection =
  new webkitRTCPeerConnection(
    servers, {
      optional: [{
        RtpDataChannels: true
      }]
    }
  );
  console.log('Created remote peer connection object remotePeerConnection');

  remotePeerConnection.onicecandidate = gotRemoteIceCandidate;
  remotePeerConnection.ondatachannel = gotReceiveChannel;

  localPeerConnection.createOffer(gotLocalDescription);


  function gotLocalCandidate(event) {
    console.log('local ice callback');
    if (event.candidate) {
      remotePeerConnection.addIceCandidate(event.candidate);
      console.log('Local ICE candidate: \n' + event.candidate.candidate);
    }
  }

  function handleSendChannelStateChange() {
    var readyState = sendChannel.readyState;
    console.log('Send channel state is: ' + readyState);
    if (readyState == "open") {
      $scope.message = '';
      // dataChannelSend.disabled = false;
      // dataChannelSend.focus();
      // dataChannelSend.placeholder = "";
      // sendButton.disabled = false;
      // closeButton.disabled = false;
    } else {
      // dataChannelSend.disabled = true;
      // sendButton.disabled = true;
      // closeButton.disabled = true;
    }
  }

  function gotRemoteIceCandidate(event) {
    console.log('remote ice callback');
    if (event.candidate) {
      localPeerConnection.addIceCandidate(event.candidate);
      console.log('Remote ICE candidate: \n ' + event.candidate.candidate);
    }
  }

  function gotReceiveChannel(event) {
    console.log('Receive Channel Callback');
    receiveChannel = event.channel;
    receiveChannel.onmessage = handleMessage;
    receiveChannel.onopen = handleReceiveChannelStateChange;
    receiveChannel.onclose = handleReceiveChannelStateChange;
  }

  function gotLocalDescription(desc) {
    localPeerConnection.setLocalDescription(desc);
    console.log('Offer from localPeerConnection \n' + desc.sdp);
    remotePeerConnection.setRemoteDescription(desc);
    remotePeerConnection.createAnswer(gotRemoteDescription);
  }
  function gotRemoteDescription(desc) {
    remotePeerConnection.setLocalDescription(desc);
    console.log('Answer from remotePeerConnection \n' + desc.sdp);
    localPeerConnection.setRemoteDescription(desc);
  }

  function handleMessage(event) {
    console.log(event);
    console.log('Received message: ' + event.data);
    // document.getElementById("dataChannelReceive").value = event.data;
  }

  $scope.sendData = function() {
    sendChannel.send($scope.message);
    console.log('Sent data: ' + $scope.message);
  }
});
