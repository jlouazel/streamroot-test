/**
 * Populate DB with sample data on server start
 * to disable, edit config/environment/index.js, and set `seedDB: false`
 */

'use strict';

var User = require('../api/user/user.model');

User.find({}).remove(function() {
  User.create({
    provider: 'local',
    name: 'Jean-Baptiste Louazel',
    email: 'jb.louazel@gmail.com',
    password: 'admin'
  }, function() {
      console.log('finished populating users');
    }
  );
});
