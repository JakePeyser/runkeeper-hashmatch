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
var currentType;

/**
 * Display a hashtag and its traits
 * @param  {Object} hashtag the object with the twitter user,
 * profile and distance
 */
function displayHashtag(hashtag) {
  $('.cel_name').text('#' + hashtag.hashtag);
  $('.cel_username').text('#' + hashtag.hashtag);
  $('.cel_username').attr('href', 'https://twitter.com/search?q=%23' + hashtag.hashtag);
  $('.cel_distance').text(Math.round(hashtag.distance * 100) + '%');
  $('.cel_image').attr('src', hashtag.image.replace('_normal', '_400x400'));

  // Update traits
  var idType;
  if (currentType === 0) idType = '#personality_trait_';
  else if (currentType === 1) idType = '#needs_trait_';
  else if (currentType === 2) idType = '#values_trait_';
  hashtag.profile.forEach(function(trait, i) {
    $(idType + i).css('left', 'calc(' + (trait.value * 100) + '%)');
  });
}

/**
 * Makes updates for a profile type switch
 */
function switchTypeUpdates(type, newHashtag, showClass, hideClass1, hideClass2, showSwitch, hideSwitch1, hideSwitch2) {
  if (currentType === type)
    return;
  currentType = type;
  displayHashtag(newHashtag, type);

  // Make DOM class updates
  $(showClass).removeClass('hide-traits');
  $(hideClass1).addClass('hide-traits');
  $(hideClass2).addClass('hide-traits');
  $(showSwitch).addClass('switch-button-active');
  $(showSwitch).removeClass('switch-button-disabled');
  $(hideSwitch1).addClass('switch-button-disabled');
  $(hideSwitch1).removeClass('switch-button-active');
  $(hideSwitch2).addClass('switch-button-disabled');
  $(hideSwitch2).removeClass('switch-button-active');
}

/**
 * On click handlers for changing comparison views
 * Get the hashtag id and call displayHashtag if it exists
 * @param  {Object} e event
 */
$(document).on('click', '.personality-switch', function() {
  switchTypeUpdates(0, similar_personality_hashtags[0], '.personality', '.needs', '.values', '.personality-switch', '.needs-switch', '.values-switch');
});
$(document).on('click', '.needs-switch', function() {
  switchTypeUpdates(1, similar_needs_hashtags[0], '.needs', '.personality', '.values', '.needs-switch', '.personality-switch', '.values-switch');
});
$(document).on('click', '.values-switch', function() {
  switchTypeUpdates(2, similar_values_hashtags[0], '.values', '.needs', '.personality', '.values-switch', '.needs-switch', '.personality-switch');
});

/**
 * On click handler for hashtag images.
 * Get the hashtag id and call displayHashtag if it exists
 * @param  {Object} e event
 */
$('.avatar-small').click(function(e) {
  var hashtag;
  var id = $(this).find('img').prop('id');
  var hashtags;
  if (currentType === 0) hashtags = similar_personality_hashtags;
  else if (currentType === 1) hashtags = similar_needs_hashtags;
  else if (currentType === 2) hashtags = similar_values_hashtags;
  if (id.match('^s_')) {
    if (currentType === 0) hashtag = similar_personality_hashtags[id.slice(2)];
    else if (currentType === 1) hashtag = similar_needs_hashtags[id.slice(2)];
    else if (currentType === 2) hashtag = similar_values_hashtags[id.slice(2)];
  }
  else {
    if (currentType === 0) hashtag = different_personality_hashtags[id.slice(2)];
    else if (currentType === 1) hashtag = different_needs_hashtags[id.slice(2)];
    else if (currentType === 2) hashtag = different_values_hashtags[id.slice(2)];
  }

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
  currentType = 0;
  displayHashtag(similar_personality_hashtags[0]);
});
