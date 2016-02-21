/* Copyright IBM Corp. 2016
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

var ImageSchema = mongoose.Schema({
  url:     String
});

// Create a new image or update the existing one
ImageSchema.statics.createOrUpdate = function(inputImage, done){
  var Image = this;

  // Search for a picture for the input tweet
  Image.findOne({url:inputImage.url}, function(err, image){
    if(err) return done(err);
    if(image) {
      extend(image,inputImage);
      image.save(function(err, image){
        if(err) return done(err);
        done(null, image);
      });
    } else {
      // New image, create
      Image.create(
        extend({},inputImage),
        function(err, image){
          if(err) return done(err);
          done(null, image);
        }
      );
    }
  });
};

// Check if the image exists
ImageSchema.statics.checkExistence = function(inputImage, done){
  var Image = this;

  // Search for a profile from the given auth origin
  Image.findOne({url:inputImage.url}, function(err, image){
    if(err) return done(err);
    if(image) inputImage.exists = true;
    else inputImage.exists = false;
    return done(null, inputImage);
  });
};

module.exports = mongoose.model('Image', ImageSchema);

