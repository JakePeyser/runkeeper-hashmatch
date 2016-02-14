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

/*jshint node:true*/

'use strict';

var express     = require('express'),
  app           = express(),
  mongoose      = require('mongoose'),
  cfenv         = require('cfenv'),
  watson        = require('watson-developer-cloud'),
  TwitterHelper = require('./app/util/twitter-helper');

// Set up environment variables
// cfenv provides access to your Cloud Foundry environment
var vcapLocal = null
try {
  vcapLocal = require("./vcap-local.json")
}
catch (e) {}

var appEnvOpts = vcapLocal ? {vcap:vcapLocal} : {}
var appEnv = cfenv.getAppEnv(appEnvOpts);

// Load Mongoose Schemas
require('./app/models/profile');
require('./app/models/user');
require('./app/models/hashtag');

// Mongoose by default sets the auto_reconnect option to true.
// Recommended a 30 second connection timeout because it allows for
// plenty of time in most operating environments.
var mongoURL,
  mongoCreds = getServiceCreds(appEnv, 'runkeeper-mongo-db');
if (appEnv.isLocal)
  mongoURL = mongoCreds.uri;
else {
  mongoURL = 'mongodb://' +
    mongoCreds.user + ':' +
    mongoCreds.password + '@' +
    mongoCreds.uri + ':' +
    mongoCreds.port + '/runkeeperDB';
}

var connect = function () {
  console.log('connect-to-mongodb');
  var options = {
    server: { socketOptions: { keepAlive: 1, connectTimeoutMS: 30000 } },
    replset: { socketOptions: { keepAlive: 1, connectTimeoutMS : 30000 } }
  };
  mongoose.connect(mongoURL, options);
};
connect();

mongoose.connection.on('error', console.log.bind(console, 'mongoose-connection-error:'));
mongoose.connection.on('open', console.log.bind(console,'connect-to-mongodb'));
mongoose.connection.on('disconnected', connect);

// Bootstrap application settings
require('./config/express')(app);

// Create the twitter helper
var twitterInstances = [],
  twitterCreds = getServiceCreds(appEnv, 'runkeeper-twitter');
twitterInstances.push(twitterCreds);
var twit = new TwitterHelper(twitterInstances);

// Create the personality insights service
var piCreds = getServiceCreds(appEnv, 'runkeeper-personality-insights');
piCreds.version = 'v2';
var personality_insights = new watson.personality_insights(piCreds);

// Make the services accessible to the router
app.set('json spaces', 2);
app.use(function(req,res,next){
  req.twit = twit;
  req.personality_insights = personality_insights;
  next();
});

// Bootstrap routes
require('./app/routes/index')(app);

// Global error handler
require('./config/error-handler')(app);

// Deployment tracker
require("cf-deployment-tracker-client").track();

// Start listening for connections
app.listen(appEnv.port, function() {
  console.log("server started at", appEnv.url);
});

// Retrieves service credentials for the input service
function getServiceCreds(appEnv, serviceName) {
  var serviceCreds = appEnv.getServiceCreds(serviceName)
  if (!serviceCreds) {
    console.log("service " + serviceName + " not bound to this application");
    return null;
  }
  return serviceCreds;
}
