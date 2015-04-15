# Reflection

### Difficulties

The most difficult part is obviously the communication using WebRTC. I've not finish it so I decided to not put it in the production app.

### Development steps
- Create the app and its environment
- Discuss through sockets in order to make a first version
- Enhance the app (smileys in messages, embedded youtube iframe, etc...)
- Implements roooms to have multiple discussion streams
- Enable ban of one user in a stream
- **Not yet implemented**
- Change the way to communicate between peers to a full WebRTC way (keep some socket.io interaction in order to communicate with the signaling server) - ~3/4 h
- Create a real file transfer between peers (with loading bar) and add the transfered file to the chat ~ 4/5h

### How to improve the app ?
- Play sound when you receive a message
- Activate desktop notifications if possible
- Activate video/voice chat (once the basis of webrtc is in place, there is no more constraint to transfer this type of data)
