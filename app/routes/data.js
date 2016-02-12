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

//=====CELEBS===================================================================

/**
 * Send the celebrity data
*/
router.get('/celebs', function(req,res) {
  Profile.find({},function(err,profiles){
    if (err)
      res.json({error: err});
    else
      res.json({profiles: profiles});
  });
});

router.post('/celebs/id/', function(req, res) {
  var id = req.body.id;
  if (id && id.substr(0,1) !== '@') {
    id = '@' + id;
  }
  res.redirect(id ? '/celebs/id/' + id : '/');
});

router.post('/celebs/hashtag/', function(req, res) {
  var hashtag = req.body.hashtag;
  if (hashtag && hashtag.substr(0,1) !== '@') {
    hashtag = '@' + hashtag;
  }
  res.redirect(hashtag ? '/celebs/hashtag/' + hashtag : '/');
});

router.get('/celebs/id/@:id', function(req,res) {
  var id = req.params.id;
  Profile.findOne({id:id},function(err,profile){
    if (err)
      res.json({error: err});
    else if (!profile)
      res.json({found: false});
    else
      res.json({found: true, profile: profile});
  });
});

router.get('/celebs/hashtag/@:hashtag', function(req,res) {
  var hashtag = req.params.hashtag;
  Profile.find({hashtag:hashtag},function(err,profiles){
    if (err)
      res.json({error: err});
    else if (!profiles || !profiles.length)
      res.json({found: false});
    else
      res.json({found: true, profiles: profiles});
  });
});

router.get('/celebs/id/:id', function(req, res) {
  res.redirect('/data/celebs/id/@' + req.params.id);
});

router.get('/celebs/hashtag/:hashtag', function(req, res) {
  res.redirect('/data/celebs/hashtag/@' + req.params.hashtag);
});

//=====USERS====================================================================

/**
 * Send the users data
*/
router.get('/users', function(req,res) {
  User.find({},function(err,users){
    if (err)
      res.json({error: err});
    else
      res.json({users: users});
  });
});

router.post('/users/id/', function(req, res) {
  var id = req.body.id;
  if (id && id.substr(0,1) !== '@') {
    id = '@' + id;
  }
  res.redirect(id ? '/users/id/' + id : '/');
});

router.get('/users/id/@:id', function(req,res) {
  var id = req.params.id;
  User.findOne({id:id},function(err,user){
    if (err)
      res.json({error: err});
    else if (!user)
      res.json({found: false});
    else
      res.json({found: true, user: user});
  });
});

router.get('/users/id/:id', function(req, res) {
  res.redirect('/data/users/id/@' + req.params.id);
});

//=====HASHTAGS=================================================================

/**
 * Send the hashtag data
*/
router.get('/hashtags', function(req,res) {
  Hashtag.find({},function(err,hashtags){
    if (err)
      res.json({error: err});
    else
      res.json({hashtags: hashtags});
  });
});

router.post('/hashtags/hashtag/', function(req, res) {
  var hashtag = req.body.hashtag;
  if (hashtag && hashtag.substr(0,1) !== '@') {
    hashtag = '@' + hashtag;
  }
  res.redirect(hashtag ? '/hashtags/hashtag/' + hashtag : '/');
});

router.get('/hashtags/hashtag/@:hashtag', function(req,res) {
  var hashtag = req.params.hashtag;
  Hashtag.findOne({hashtag:hashtag},function(err,hashtag){
    if (err)
      res.json({error: err});
    else if (!hashtag)
      res.json({found: false});
    else
      res.json({found: true, hashtag: hashtag});
  });
});

router.get('/hashtags/hashtag/:hashtag', function(req, res) {
  res.redirect('/data/hashtags/hashtag/@' + req.params.hashtag);
});

module.exports = router;
