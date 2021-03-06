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

var mongoose = require('mongoose'),
  extend = require('extend');

var UserSchema = mongoose.Schema({
  name:         String,
  username:     String,
  personality:  String,
  followers:    Number,
  tweets:       Number,
  id:           String,
  image:        String,
  updated:      { type: Date, default: Date.now }
});

// Create a new user or update the existing one
UserSchema.statics.createOrUpdate = function(profile, done){
  var User = this;

  // Search for a profile from the given auth origin
  User.findOne({username:profile.username}, function(err, user){
    if(err) return done(err);
    if(user) {
      extend(user,profile);
      user.save(function(err, user){
        if(err) return done(err);
        done(null, user);
      });
    } else {
      // New user, create
      User.create(
        extend({},profile),
        function(err, user){
          if(err) return done(err);
          done(null, user);
        }
      );
    }
  });
};

// Check if the user of a tweet exists in the DB
UserSchema.statics.checkExistence = function(inputUser, done){
  var User = this;

  // Search for a profile from the given auth origin
  User.findOne({id:inputUser.id}, 'id', function(err, user){
    if(err) return done(err);
    if(user) inputUser.exists = true;
    else inputUser.exists = false;
    return done(null, inputUser);
  });
};

module.exports = mongoose.model('User', UserSchema);

