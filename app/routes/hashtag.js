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

var router   = require('express').Router(),
  flatten    = require('../util/flatten'),
  mongoose   = require('mongoose'),
  Q          = require('q'),
  HashMap    = require('hashmap'),
  Profile    = mongoose.model('Profile'),
  User       = mongoose.model('User'),
  Hashtag       = mongoose.model('Hashtag'),
  extend     = require('extend'),
  util       = require('../util/util');

// We're only going to hit the db once for these
var pics = [],
  celebs =[],
  hashtags =[];

  // Declare some promises to handle database
  var profileExistsInDB = Q.denodeify(Profile.checkExistence.bind(Profile)),
    saveProfileInDB = Q.denodeify(Profile.createOrUpdate.bind(Profile)),
    getCelebrityFromDB = Q.denodeify(Profile.find.bind(Profile)),
    saveHashtagInDB = Q.denodeify(Hashtag.createOrUpdate.bind(Hashtag));

var MAX_COUNT = 100;

/**
 * Updates an array with the celebrity profile pictures.
 */
function updateBackground() {
  getCelebrityFromDB({}).then(function(profiles) {
    celebs = profiles;
    var images = profiles.map(function(profile) {
      return {
        username: '@' + profile.username,
        image: profile.image
      };
    });

    // make sure we have at least 24 pictures by concatenating them.
    while(images.length > 0 && images.length < 24) {
      images = images.concat(images); // note: this grows exponentially
    }
    pics = shuffle(images);
  });
}
updateBackground();


// Shuffle an array with images and username
function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex ;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

/**
 * Gets unique users who have recently tweeted using input hashtag
 * Users must not currently exist in the DB
 */
var getUniqueUsers = function(searchTweets, hashtag, cb) {
  var user,
    promises = [],
    userMap = new HashMap();

  // Build query parameters
  var params = {
    count: MAX_COUNT,
    lang: 'en',
    include_entities: false
  }

  // Search for 100 more tweets
  searchTweets("#"+hashtag, params)
  .then(function(tweets) {
    for (var i=0; i < tweets.length; i++) {
      user = tweets[i].user;
      // If tweet user is not yet in map, add to DB lookup promises call
      if (!userMap.get(user.id)) {
        userMap.set(user.id, user);
        promises.push(profileExistsInDB(user));
      }
    }
    return Q.all(promises);
  })
  .then(function(usersArray) {
    // Do not process users who are already in the DB
    for (var i=0; i < usersArray.length; i++) {
      if (usersArray[i].exists) {
        console.log(usersArray[i].username, 'found in the database');
        userMap.remove(usersArray[i].id);
      }
      // Do not process users who are not predominantly English speakers
      else if (usersArray[i].language !== 'en') {
        console.log(usersArray[i].username, 'is not an English tweeter');
        userMap.remove(usersArray[i].id);
      }
      else {
        console.log(usersArray[i].username, 'is a new user');
      }
    }
    cb(userMap);
  });
}

router.post('/', function(req, res) {
  var hashtag = req.body.hashtag;
  if (hashtag && hashtag.substr(0,1) !== '@') {
    hashtag = '@' + hashtag;
  }
  res.redirect(hashtag ? '/analyze/' + hashtag : '/');
});

/**
 * Retrieve users who use a hashtag, retrieve their tweets,
 * and run them all through personality insights
*/
router.get('/@:hashtag', function (req, res) {
  var hashtag = req.params.hashtag;
  if (!hashtag)
    return res.render('index', {info: 'You need to provide a hashtag.'});

  // Declare some promises to handle twitter and personality_insights req
  var searchTweets   = Q.denodeify(req.twit.searchTweets.bind(req.twit)),
    getTweets  = Q.denodeify(req.twit.getTweets.bind(req.twit)),
    getProfile = Q.denodeify(req.personality_insights.profile.bind(req.personality_insights));

  // Retrieve unique users who have recently tweeted with the input hashtag
  getUniqueUsers(searchTweets, hashtag, function(userMap) {
    var usersArray = userMap.values();
    var promises = [];
    for (var i=0; i < usersArray.length; i++) {
      if (i==0 || i==1 || i==3)
        promises.push(getTweets({screen_name:usersArray[i].username,limit:200}));
    }

    // Retrieve each user's tweet history
    Q.all(promises)
    .then(function(userTweets) {
      var user,
        hashPic,
        hashTweets = [],
        saveProfilePromises = [];

      // Concatenate all retrieved tweets from users
      userTweets.forEach(function(tweets){
        user = userMap.get(tweets[0].userid.toString())
        if (!hashPic) hashPic = user.image;
        console.log(user.username, 'has', tweets.length, 'tweets');
        hashTweets = hashTweets.concat(tweets);

        // Grab additional fields and store in future promise
        user.hashtag = hashtag;
        user.tweetlog = JSON.stringify(tweets);
        saveProfilePromises.push(saveProfileInDB(user));
      });

      // Make userid the same for all tweets so personality insights works
      hashTweets.forEach(function(tweet) {
        tweet.userid = 12345678;
      });

      // Retrieves the personality profile using all tweets as input
      return getProfile({contentItems:hashTweets})
        .then(function(personality) {
          console.log(personality);
          if (!personality)
            return;
          console.log('#' + hashtag, 'analyzed with personality insights');
          var hashtagObject = {
            hashtag: hashtag,
            users: userMap.count(),
            image: hashPic,
            personality: JSON.stringify(personality)
          }

          // Save hashtag in database with the personality
          console.log('#' + hashtag, 'added to the database');
          return saveHashtagInDB(hashtagObject)
            .then(function(savedHashtag) {

              // Save profiles used for the hashtag to the database
              Q.all(saveProfilePromises)
              .then(function(savedProfiles) {
                console.log('All profiles for #' + hashtag, 'saved to the database');
              });
            });
        });
    });
  });

  updateBackground();
  res.render('index', {info: 'Analyzing #' + hashtag, pics:pics});
});

router.get('/:hashtag', function(req, res) {
  res.redirect('/analyze/@' + req.params.hashtag);
});

module.exports = router;
