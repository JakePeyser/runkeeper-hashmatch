/* Copyright IBM Corp. 2015
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

var router = require('express').Router(),
  mongoose = require('mongoose'),
  Q        = require('q'),
  Profile  = mongoose.model('Profile'),
  User     = mongoose.model('User'),
  Hashtag  = mongoose.model('Hashtag');

/**
 * Render the celebrity list
*/
router.get('/profiles', function(req,res) {
  Profile.find({}, function(err,profiles) {
    if (err)
      res.render('profiles', {error: err});
    else
      res.render('profiles', {profiles: profiles});
  });
});

/**
 * Render the users list
*/
router.get('/users', function(req,res) {
  User.find({}, function(err,users) {
    if (err)
      res.render('users', {error: err});
    else
      res.render('users', {users: users});
  });
});

/**
 * Render the hashtags list
*/
router.get('/hashtags', function(req,res) {
  Hashtag.find({}, function(err,hashtags) {
    if (err)
      res.render('hashtags', {error: err});
    else
      res.render('hashtags', {hashtags: hashtags});
  });
});

module.exports = router;
