'use strict';

describe('Service: peer', function () {

  // load the service's module
  beforeEach(module('streamrootTestApp'));

  // instantiate service
  var peer;
  beforeEach(inject(function (_peer_) {
    peer = _peer_;
  }));

  it('should do something', function () {
    expect(!!peer).toBe(true);
  });

});
