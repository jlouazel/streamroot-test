'use strict';

describe('Service: Room', function () {

  // load the service's module
  beforeEach(module('streamrootTestApp'));

  // instantiate service
  var room;
  beforeEach(inject(function (Room) {
    room = Room;
  }));

  it('should do something', function () {
    expect(!!room).toBe(true);
  });

});
