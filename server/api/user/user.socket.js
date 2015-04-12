/**
* Handle socket in order to pass it to user controller
*/

'use strict';

var io = null;

exports.register = function(_io) {
  io = _io;
};

exports.getIO = function() {
  return io;
};
