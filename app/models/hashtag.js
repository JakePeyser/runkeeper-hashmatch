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

var HashtagSchema = mongoose.Schema({
  hashtag: String,
  users: Number,
  image: String,
  personality: String
});

// Create a new hashtag or update the existing one
HashtagSchema.statics.createOrUpdate = function(hashtag, done){
  var Hashtag = this;
  // Build dynamic key query
  var query = { hashtag: hashtag.hashtag };

  // Search for a hashtag from the given auth origin
  Hashtag.findOne(query, function(err, hash){
    if(err) return done(err);
    if(hash) {
      extend(hash,hashtag);
      hash.save(function(err, hash){
        if(err) return done(err);
        done(null, hash);
      });
    } else {
      // New user, create
      Hashtag.create(
        extend({},hashtag),
        function(err, hash){
          if(err) return done(err);
          done(null, hash);
        }
      );
    }
  });
};

module.exports = mongoose.model('Hashtag', HashtagSchema);
