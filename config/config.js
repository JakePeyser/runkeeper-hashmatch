/**
 * Copyright 2015 IBM Corp. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

module.exports = {
  // Mongo database url
  mongodb: process.env.MONGODB || 'mongodb://localhost/celebs',

  // Personality Insights credentials
  personality_insights: {
    url: 'https://gateway.watsonplatform.net/personality-insights/api',
    username: 'c6efc770-4ec9-48df-8058-c922b7d06b76',
    password: 'lbKxZWXdZdZI',
    version: 'v2'
  },

  // Twitter app credentials: https://apps.twitter.com/app
  twitter: process.env.TWITTER ? JSON.parse(process.env.TWITTER) : [{
    consumer_key: 'v9x2GEz9J1CcEZIeUKqmjFnKe',
    consumer_secret: 'xMC3GjBcqA34c5AjV8nEqeera2Ro30CpbVIs58XMT9epsQy53s',
    access_token_key: '37787243-iEkWc7ZEQx02ja11tJUMfMunY3xERppUYeRCRi08y',
    access_token_secret: '7t6TrOubyqLaNaa4N8ydRYVh6mAzRflA8xwlRNJz4YXb6'
  }]
};
