'use strict';

describe('Service: Peer', function () {

  // load the service's module
  beforeEach(module('streamrootTestApp'));

  // instantiate service
  var peer;
  beforeEach(inject(function (Peer) {
    peer = Peer;
  }));

  it('should do something', function () {
    expect(!!peer).toBe(true);
  });

});
