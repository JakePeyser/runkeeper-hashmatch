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
/*global $:false */

'use strict';

/**
 * Display a hashtag and its traits
 * @param  {Object} hashtag the object with the twitter user,
 * profile and distance
 */
function displayHashtag(hashtag) {
  $('.cel_name').text('#' + hashtag.hash.hashtag);
  $('.cel_username').text('#' + hashtag.hash.hashtag);
  $('.cel_username').attr('href', 'https://twitter.com/search?q=%23' + hashtag.hash.hashtag);
  $('.cel_distance').text(Math.round(hashtag.distance * 100) + '%');
  $('.cel_image').attr('src', hashtag.hash.image.replace('_normal', '_400x400'));

  // Big 5
  hashtag.profile.forEach(function(trait, i) {
    $('#trait_' + i).css('left', 'calc(' + (trait.value * 100) + '%)');
  });
}

/**
 * On click handler for hashtag images.
 * Get the hashtag id and call displayHashtag if it exists
 * @param  {Object} e event
 */
$('.avatar-small').click(function(e) {
  var hashtag;
  var id = $(this).find('img').prop('id');
  if (id.match('^s_'))
    hashtag = similar_hashtags[id.slice(2)];
  else
    hashtag = different_hashtags[id.slice(2)];

  if (hashtag)
    displayHashtag(hashtag);
  else
    console.log('hashtag not found!');

});

/**
 * On click handler for unhiding .overlay-screen.how-it-worked popup overlay.
 */
$(document).on('click', '.how-it-works-link', function() {
  $('.overlay-screen.how-it-worked').fadeIn(200);
  $('#wrap').css({
    'overflow': 'hidden',
    'height': '100%'
  });
});

/**
 * On click handler for hiding .overlay-screen.how-it-worked popup overlay.
 */
$(document).on('click', '.button.back', function() {
  $('.overlay-screen.how-it-worked').fadeOut(200);
  $('#wrap').css({
    'overflow': 'none',
    'height': 'auto'
  });
});

/**
 * On hover handler for making user's points bigger and hashtag's points smaller
 */
$(document).on('mouseenter', '.avatars-row > .me', function() {
  $('.mep').addClass('bigger');
  $('.celebrityp').addClass('smaller');
});
$(document).on('mouseleave', '.avatars-row > .me', function() {
  $('.mep').removeClass('bigger');
  $('.celebrityp').removeClass('smaller');
});

/**
 * On hover handler for making hashtag's points bigger and user's points smaller
 */
$(document).on('mouseenter', '.avatars-row > .celebrity', function() {
  $('.mep').addClass('smaller');
  $('.celebrityp').addClass('bigger');
});
$(document).on('mouseleave', '.avatars-row > .celebrity', function() {
  $('.mep').removeClass('smaller');
  $('.celebrityp').removeClass('bigger');
});

/**
 * On load handler for loading images a little more gracefully
 */
$('.page-content img').on('load', function() {
  // $(this).addClass('revealed');
  $(this).addClass('revealed');
}).each(function() {
  if (this.complete) {
    $(this).load();
  }
});

$(document).ready(function() {
  displayHashtag(similar_hashtags[0]);
});
