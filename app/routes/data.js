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
  Hashtag  = mongoose.model('Hashtag'),
  Image  = mongoose.model('Image');

//=====PROFILES=================================================================

/**
 * Send the profile data
*/
router.get('/profiles', function(req,res) {
  Profile.find({}, 'id name username location followers hashtag tweets image', function(err,profiles) {
    if (err)
      res.json({error: err});
    else
      res.json({count:profiles.length, profiles: profiles});
  });
});

router.get('/profiles/reset', function(req,res) {
  console.log('removing profiles from database');
  var removeAll = Q.denodeify(Profile.remove.bind(Profile));

  removeAll({}).then(function(){
    res.redirect('/');
  })
  .catch(function (error) {
    console.log('error', error);
    res.redirect('/');
  });
});

router.post('/profiles/id/', function(req, res) {
  var id = req.body.id;
  if (id && id.substr(0,1) !== '@') {
    id = '@' + id;
  }
  res.redirect(id ? '/profiles/id/' + id : '/');
});

router.post('/profiles/hashtag/', function(req, res) {
  var hashtag = req.body.hashtag;
  if (hashtag && hashtag.substr(0,1) !== '@') {
    hashtag = '@' + hashtag;
  }
  res.redirect(hashtag ? '/profiles/hashtag/' + hashtag : '/');
});

router.get('/profiles/id/@:id', function(req,res) {
  var id = req.params.id;
  Profile.findOne({id:id}, function(err,profile) {
    if (err)
      res.json({error: err});
    else if (!profile)
      res.json({found: false});
    else
      res.json({found: true, profile: profile});
  });
});

router.get('/profiles/hashtag/@:hashtag', function(req,res) {
  var hashtag = req.params.hashtag;
  Profile.find({hashtag:hashtag}, 'id name username location followers hashtag tweets image', function(err,profiles) {
    if (err)
      res.json({error: err});
    else if (!profiles || !profiles.length)
      res.json({found: false});
    else
      res.json({found: true, count:profiles.length,  profiles: profiles});
  });
});

router.get('/profiles/id/:id', function(req, res) {
  res.redirect('/data/profiles/id/@' + req.params.id);
});

router.get('/profiles/hashtag/:hashtag', function(req, res) {
  res.redirect('/data/profiles/hashtag/@' + req.params.hashtag);
});

//=====USERS====================================================================

/**
 * Send the users data
*/
router.get('/users', function(req,res) {
  User.find({}, 'id name username followers tweets image updated', function(err,users) {
    if (err)
      res.json({error: err});
    else
      res.json({count:users.length, users: users});
  });
});

router.get('/users/reset', function(req,res) {
  console.log('removing users from database');
  var removeAll = Q.denodeify(User.remove.bind(User));

  removeAll({}).then(function(){
    res.redirect('/');
  })
  .catch(function (error) {
    console.log('error', error);
    res.redirect('/');
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
  User.findOne({id:id}, function(err,user) {
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
  Hashtag.find({}, 'hashtag users image', function(err,hashtags) {
    if (err)
      res.json({error: err});
    else
      res.json({count:hashtags.length, hashtags: hashtags});
  });
});

router.get('/hashtags/reset', function(req,res) {
  console.log('removing hashtags from database');
  var removeAll = Q.denodeify(Hashtag.remove.bind(Hashtag));

  removeAll({}).then(function(){
    res.redirect('/');
  })
  .catch(function (error) {
    console.log('error', error);
    res.redirect('/');
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
  Hashtag.findOne({hashtag:hashtag}, function(err,hashtag) {
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

//=====IMAGES===================================================================

/**
 * Send the hashtag data
*/
router.get('/images', function(req,res) {
  Image.find({}, function(err,images) {
    if (err)
      res.json({error: err});
    else
      res.json({count:images.length, images: images});
  });
});

router.get('/images/reset', function(req,res) {
  console.log('removing images from database');
  var removeAll = Q.denodeify(Image.remove.bind(Image));

  removeAll({}).then(function(){
    res.redirect('/');
  })
  .catch(function (error) {
    console.log('error', error);
    res.redirect('/');
  });
});

router.post('/images/add/', function(req, res) {
  var url = req.body.url;
  if (url && url.substr(0,1) !== '@') {
    url = '@' + url;
  }
  res.redirect(url ? '/images/add/' + url : '/');
});

router.get('/images/add/@:url', function(req,res) {
  var url = req.params.url,
    image = {url:url};

  // Creates a image if one does not exist with that url
  Image.checkExistence(image, function(err, returnedImage) {
    if (err)
      res.json({error: err});
    else if (returnedImage.exists)
      res.json({exists: true});
    else {
      Image.createOrUpdate(image, function(err, savedImage) {
      res.json({exists: false, url: url});
      });
    }
  });
});

router.get('/images/add/:url', function(req, res) {
  res.redirect('/data/images/add/@' + req.params.url);
});

module.exports = router;
