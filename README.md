# runkeeper-hashmatch Overview

Runkeeper Hashmatch uses the IBM Watson [Personality Insights service][pi_docs] and [Twitter][twitter_url] to match you with the specific running hashtags. After inputting your Twitter handle, your tweets are sent to Personality Insights to analyze the text and output a personality profile. That profile is compared against the profiles of popular running hashtags, giving us a visualization of what hashtag you most align with. For more information on how the hashtag profiles are compiled, check out the [Analyzing Hashtag Data section][github_analyze_section_url] below.
  
[![Deploy to Bluemix](https://bluemix.net/deploy/button.png)](https://bluemix.net/deploy)

![Bluemix Deployments](https://deployment-tracker.mybluemix.net/stats/ecea8bc6b398900fdf67be67d8c4c7db/badge.svg)

**Note**: If you deploy the application in Bluemix using the above button, you will need to complete steps 9-14 below to finish the setup process.

## Running the app on Bluemix

1. If you do not already have a Bluemix account, [sign up here][bluemix_signup_url]

2. Download and install the [Cloud Foundry CLI][cloud_foundry_url] tool

3. Clone the app to your local environment from your terminal using the following command:

  ```
  $ git clone https://github.com/JakePeyser/runkeeper-hashmatch.git
  ```

4. `cd` into this newly created directory

5. Open the `manifest.yml` file and change the `host` value to something unique

  The host you choose will determinate the subdomain of your application's URL: `<host>.mybluemix.net`

6. Connect to Bluemix in the command line tool and follow the prompts to log in:

  ```
  $ cf api https://api.ng.bluemix.net
  $ cf login
  ```

7. Create the Personality Insights service in Bluemix:

  ```
  $ cf create-service personality_insights tiered runkeeper-personality-insights
  ```

8. Push your app to Bluemix. We need to perform additional steps once it is deployed, so we will add the `--no-start` option:

  ```
  $ cf push --no-start
  ```

9. [Create a Twitter app][github_create_twitter_app_url]

10. Create a user-provided service to represent your Twitter app, taking the corresponding credentials from your Twitter app's `Keys and Access Tokens` page:

	```
	$ cf cups runkeeper-twitter -p '{"access_token_key":"KEY","access_token_secret":"SECRET","consumer_key":"KEY","consumer_secret":"SECRET"}'
	```

11. Bind this Twitter service to your app:

	```
	$ cf bind-service runkeeper-hashmatch runkeeper-twitter
	```

12. Create a managed MongoDB instance on [Compose.io][compose_url]
	* [Sign up for a Compose.io free trial][compose_signup_url] and select MongoDB or use your existing account and [create a new MongoDB deployment][compose_new_mongo_url]
	* Once your Mongo deployment has been provisioned, create a DB called `runkeeperDB`
	* Navigate to the Users tab of your new DB and select Add User. Assign your username and password as `rk-admin` and `rk-key`, respectively
	* Navigate to the `Admin` tab and note the host (e.g. `horace.1.mongolayer.com`) and port of your primary replica set

13. Go to the [MongoDB by Compose service][mongo_service_url] in the Bluemix catalog
	* Bind the service to `runkeeper-hashmatch`
	* Name the service `runkeeper-mongo-db`
	* Fill out your credentials with the info from the previous steps
	* Click `Create`

14. Restage your application, either by accepting the prompt after the last step or executing the following command:

	```
	$ cf restage runkeeper-hashmatch
	```

And voila! You now have your very own instance of Runkeeper Hashmatch running on Bluemix. Now all that is left is to populate your DB with hashtag pesonality data for comparisons. Check out the [Analyzing Hashtag Data section][github_analyze_section_url] for instructions on this process.

## Running the app locally

1. If you do not already have a Bluemix account, [sign up here][bluemix_signup_url]

2. If you have not already, [download node.js][download_node_url] and install it on your local machine

3. Clone the app to your local environment from your terminal using the following command

  ```
  $ git clone https://github.com/JakePeyser/runkeeper-hashmatch.git
  ```

4. cd into this newly created directory

5. Create a [Personality Insights service][pi_service_url] using your Bluemix account and replace the corresponding credentials in your `vcap-local.json` file

6. [Create a Twitter app][github_create_twitter_app_url] and copy the credentials over to your `vcap-local.json` file

7. Install [mongodb][mongodb_url]

8. Install the required npm packages using the following command:

  ```
  $ npm install
  ```

9. Start mongodb in a separate terminal window:

  ```
  $ mongod
  ```

10. Start the app in your original terminal window:

  ```
  $ npm start
  ```

Your app will be automatically assigned to a port which will be logged to your terminal. To access the app, go to `localhost:PORT` in your browser. Now all that is left is to populate your DB with hashtag pesonality data for comparisons. Check out the [Analyzing Hashtag Data section][github_analyze_section_url] for instructions on this process. Happy developing!

## Additional Setup

### Creating a Twitter App

1. [Sign up for Twitter][twitter_signup_url] or use your existing account to [create a new Twitter app][twitter_app_url]
	* Name it `runkeeper-hashmatch-ID`, substituting your GitHub username for `ID`
	* Give it a description
	* Use [this project's GitHub repo][github_repo_url] or the URL of your fork as the website

2. Create your Twitter app access token
	* Navigate to the `Keys and Access Tokens` tab
	* Click the button labeled `Create my access token`

### Analyzing Hashtag Data

**`/analyze/twitter/@hashtag`:** Finds users who have recently tweeted using #hashtag, collects their tweets, and stores them in the `profiles` collection in the database.

**`/analyze/personality/@hashtag`:** Aggregates users' tweets for the input hashtag and runs them through the Personality Insights API, saving the results in the `hashtags` collection in the database. If analysis for the hashtag already exists, it is overwritten with the new results

**Note:** Keep the [Twitter API rate limiting policy][twitter_rate_limit_url] in mind, as the first route hits the API an average of 25 times per call.

## Routes

**`/like/@handle`:** Runs the Runkeeper Hashmatch algorithm on the input Twitter handle.

**`/lists/profiles`:** Lists the individuals whose tweets have been used as input for the personality analysis of the running hashtags.

**`/lists/users`:** Lists the users whose tweets have previously been analyzed by Personality Insights and compared to the aggregate personalities of the running hashtags.

**`/lists/hashtags`:** Lists the running hashtags and the number of respective users whose tweets were included as a part of their personality analysis.

**`/data/profiles`:** Sends back all profiles in the database in JSON format. Additional routes of `id/@id` and `hashtag/@hashtag` are available for returning a subset of profiles.

**`/data/users`:** Sends back all users in the database in JSON format. The additional route of `id/@id` is available for returning a unique user.

**`/data/hashtags`:** Sends back all hashtags in the database in JSON format. The additional route of `hashtag/@hashtag` is available for returning a unique hashtag.

## Troubleshooting

The primary source of debugging information for your Bluemix app is the logs. To see them, run the following command using the Cloud Foundry CLI:

  ```
  $ cf logs runkeeper-hashmatch --recent
  ```
For more detailed information on troubleshooting your application, see the [Troubleshooting section](https://www.ng.bluemix.net/docs/troubleshoot/tr.html) in the Bluemix documentation.

## Contribute
We are more than happy to accept external contributions to this project, be it in the form of issues and pull requests. If you find a bug, please report it via the [Issues section][issues_url] or even better, fork the project and submit a pull request with your fix! Pull requests will be evaulated on an individual basis based on value add to the sample application.

## Privacy Notice
The capital-weather sample web application includes code to track deployments to Bluemix and other Cloud Foundry platforms. The following information is sent to a [Deployment Tracker](https://github.com/cloudant-labs/deployment-tracker) service on each deployment:

* Application Name (application_name)
* Space ID (space_id)
* Application Version (application_version)
* Application URIs (application_uris)

This data is collected from the VCAP_APPLICATION environment variable in IBM Bluemix and other Cloud Foundry platforms. This data is used by IBM to track metrics around deployments of sample applications to IBM Bluemix. Only deployments of sample applications that include code to ping the Deployment Tracker service will be tracked.

### Disabling Deployment Tracking

Deployment tracking can be disabled by removing `require("cf-deployment-tracker-client").track();` from the beginning of the `app.js` file.

[github_repo_url]: https://github.com/JakePeyser/runkeeper-hashmatch
[github_create_twitter_app_url]: #user-content-creating-a-twitter-app
[github_analyze_section_url]: #user-content-analyzing-hashtag-data
[bluemix_signup_url]: https://ibm.biz/runkeeper-hashmatch-signup
[cloud_foundry_url]: https://github.com/cloudfoundry/cli
[download_node_url]: https://nodejs.org/download/
[mongodb_url]: http://docs.mongodb.org/manual/installation/
[twitter_url]: https://twitter.com/
[twitter_signup_url]: https://twitter.com/signup
[twitter_app_url]: https://apps.twitter.com/app/new
[twitter_rate_limit_url]: https://dev.twitter.com/rest/public/rate-limiting
[compose_url]: https://compose.io/
[compose_signup_url]: https://app.compose.io/signup/svelte
[compose_new_mongo_url]: https://app.compose.io/ibm-12/deployments/new
[mongo_service_url]: https://console.ng.bluemix.net/catalog/services/mongodb-by-compose/
[pi_service_url]: https://console.ng.bluemix.net/catalog/services/personality-insights/
[pi_docs]: http://www.ibm.com/smarterplanet/us/en/ibmwatson/developercloud/doc/personality-insights/
[issues_url]: https://github.com/JakePeyser/runkeeper-hashmatch/issues
