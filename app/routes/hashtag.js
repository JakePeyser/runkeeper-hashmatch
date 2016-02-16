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
var pics = [];

// Declare some promises to handle database
var profileExistsInDB = Q.denodeify(Profile.checkExistence.bind(Profile)),
  saveProfileInDB = Q.denodeify(Profile.createOrUpdate.bind(Profile)),
  getProfilesFromDB = Q.denodeify(Profile.find.bind(Profile)),
  saveHashtagInDB = Q.denodeify(Hashtag.createOrUpdate.bind(Hashtag)),
  getHashtagsFromDB = Q.denodeify(Hashtag.find.bind(Hashtag));

var MAX_COUNT = 20;

/**
 * Updates an array with the profile pictures.
 */
function updateBackground() {
  getProfilesFromDB({}, 'username image').then(function(profiles) {
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
 * Gets the most recent picture associated with the #running Twitter feed
 */
var getRunningImage = function(searchTweets, cb) {
  // Build query parameters
  var params = {
    count: 100,
    lang: 'en',
    result_type: 'popular',
    filter: 'images'
  }

  // Search for recent popular tweets with #running
  searchTweets('#running', params, true)
  .then(function(tweets) {
    if (!tweets)
      return null;

    // Get existing running images to ensure no duplicates
    return getHashtagsFromDB({}, 'image')
    .then(function(hashtags) {
      // Find the first image in the returned tweets that has not been used
      var imageURL, freshImage;
      for (var i=0; i < tweets.length; i++) {
        if (tweets[i].entities && tweets[i].entities.media) {
          imageURL = tweets[i].entities.media[0].media_url_https;
          freshImage = true;
          hashtags.forEach(function(hashtag) {
            if (hashtag.image === (imageURL+':thumb'))
              freshImage = false;
          });

          // If a new image or last picture available, use the pic
          if (freshImage || i === tweets.length-1) {
            imageURL = tweets[i].entities.media[0].media_url_https;
            break;
          }
        }
      }

      // Return the thumbnail of the retrieved image
      cb(imageURL + ':thumb');
    });
  });
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
    count: 20,
    lang: 'en',
    include_entities: false
  }

  // Search for recent tweets with the input hashtag
  searchTweets('#'+hashtag, params, false)
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

router.post('/twitter/', function(req, res) {
  var hashtag = req.body.hashtag;
  if (hashtag && hashtag.substr(0,1) !== '@') {
    hashtag = '@' + hashtag;
  }
  res.redirect(hashtag ? '/analyze/twitter/' + hashtag : '/');
});

router.post('/personality/', function(req, res) {
  var hashtag = req.body.hashtag;
  if (hashtag && hashtag.substr(0,1) !== '@') {
    hashtag = '@' + hashtag;
  }
  res.redirect(hashtag ? '/analyze/personality/' + hashtag : '/');
});

/**
 * Find 20 users who recently used the input hashtag and get their tweets
*/
router.get('/twitter/@:hashtag', function (req, res) {
  var hashtag = req.params.hashtag;
  if (!hashtag)
    return res.render('index', {info:'You need to provide a hashtag.'});

  // Declare some promises to handle twitter and personality_insights req
  var searchTweets   = Q.denodeify(req.twit.searchTweets.bind(req.twit)),
    getTweets  = Q.denodeify(req.twit.getTweets.bind(req.twit)),
    getProfile = Q.denodeify(req.personality_insights.profile.bind(req.personality_insights));

  // Retrieve unique users who have recently tweeted with the input hashtag
  getUniqueUsers(searchTweets, hashtag, function(userMap) {
    if (!userMap)
      return res.render('index', {error: 'Error getting users for #' + hashtag, pics:pics});
    else if (!userMap.count())
      return res.render('index', {info: 'No new users found for #' + hashtag, pics:pics});

    var usersArray = userMap.values();
    var promises = [];
    for (var i=0; i < usersArray.length; i++) {
      promises.push(getTweets({screen_name:usersArray[i].username, limit:200}));
    }

    // Retrieve each user's tweet history
    Q.all(promises)
    .then(function(userTweets) {
      if (!userTweets)
        return res.render('index', {error: 'Error getting tweets for #' + hashtag + ' users', pics:pics});

      promises = [];
      var user,
        hashPic,
        hashTweets = [],
        saveProfilePromises = [];

      // Grab each users tweets and associate with user object
      userTweets.forEach(function(tweets) {
        user = userMap.get(tweets[0].userid.toString())
        console.log(user.username, 'has', tweets.length, 'tweets');

        // Grab additional fields and store in future promise
        user.hashtag = hashtag;
        user.tweetlog = JSON.stringify(tweets);
        promises.push(saveProfileInDB(user));
      });

      // Remove items from hashmap to avoid memory loss
      userMap.clear();

      // Retrieve each user's tweet history and
      Q.all(promises)
      .then(function(users) {
        if (!users)
          return res.render('index', {error: 'Error saving users and their tweets for #' + hashtag, pics:pics});

        console.log ('Users for #' + hashtag, 'saved to the database');
        return res.render('index', {info: 'Users for #' + hashtag + ' saved to the database', pics:pics});
      });
    });
  });
});

/**
 * Run users tweets stored in DB for hashtag through personality insights
*/
router.get('/personality/@:hashtag', function (req, res) {
  var hashtag = req.params.hashtag;
  if (!hashtag)
    return res.render('index', {info: 'You need to provide a hashtag.'});

  getProfilesFromDB({hashtag:hashtag}, 'tweetlog', function(err, profiles) {
    if (err) {
      console.log(err)
      console.log('Error retrieving #' + hashtag, 'users');
      return res.render('index', {error: 'Error retrieving #' + hashtag + ' users', pics:pics});
    }
    else if (!profiles || !profiles.length)
      return res.render('index', {info: 'No users for #' + hashtag + ' found in the database', pics:pics});

    // Concatenate all tweets into a single array
    var hashTweets = [];
    profiles.forEach(function(profile){
      hashTweets = hashTweets.concat(JSON.parse(profile.tweetlog));
    });

    // Make userid the same for all tweets so personality insights works
    hashTweets.forEach(function(tweet) {
      tweet.userid = 12345678;
    });

    // Declare promise to handle personality_insights req
    var getProfile = Q.denodeify(req.personality_insights.profile.bind(req.personality_insights));
    return getProfile({contentItems:hashTweets})
    .then(function(personality) {
      if (!personality)
        return res.render('index', {error: 'Error analyzing personality for #' + hashtag, pics:pics});

      console.log('#' + hashtag, 'analyzed with personality insights');

      // Get image from #running feed to associate with the new hashtag object
      var searchTweets = Q.denodeify(req.twit.searchTweets.bind(req.twit));
      getRunningImage(searchTweets, function(imageURL) {
        if (!imageURL)
          return res.render('index', {error: 'Error retrieving an image for #' + hashtag, pics:pics});

        var hashtagObject = {
          hashtag: hashtag,
          users: profiles.length,
          image: imageURL,
          personality: JSON.stringify(personality)
        }

        // Save hashtag in database with the personality
        return saveHashtagInDB(hashtagObject)
        .then(function(savedHashtag) {
          if (!savedHashtag)
            return res.render('index', {error: 'Error saving #' + hashtag + ' personality analysis to the database', pics:pics});

          console.log('#' + hashtag, 'saved to the database');
          return res.render('index', {info: 'Personality analysis for #' + hashtag + ' has been completed and stored in the database', pics:pics});
        });
      });
    });
  });
});

router.get('twitter/:hashtag', function(req, res) {
  res.redirect('/analyze/twitter/@' + req.params.hashtag);
});

router.get('personality/:hashtag', function(req, res) {
  res.redirect('/analyze/personality/@' + req.params.hashtag);
});

module.exports = router;
