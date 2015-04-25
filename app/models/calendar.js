// model for gcal interactions

var oauthClient;
var token;
var OAuth2;
var gcal;
var app;

module.exports = function(ap) {
  app = ap;
  OAuth2 = app.googleapis.auth.OAuth2;
  gcal = app.googleapis.calendar('v3');

	return app.models.calendar = (function() {
		function calendar() {}

    auth();

		calendar.add = function(body, callback) {
      checkEvents(body, callback, function(check){
        if(check)
          addEvent(body, callback);
      });
		};

		return calendar;
	})();
}

// check google calendar for existing 
// reservation in the same room
function checkEvents(body, callback, whenDone){
	var resp = true;
	var start = new Date(body.start).toISOString();
	var end = new Date(body.end).toISOString();
	
	// check for existing events
  gcal.events.list({
	    auth: oauthClient,
	    calendarId: app.env.CALID,
	    'timeMin': start,
	    'timeMax': end
	}, function(err, response){
      if(err){
        callback.error(err);
        resp = false;
      } else {
      	// no event exists if length == 0
      	if(response.items.length != 0){
      	  // go through events to check rooms
          for(var i = 0; i < response.items.length; i++){
            var evnt = response.items[i];

            // check if event is the same room as request
            if(evnt.summary.search(body.room) != -1){
              var hostName = evnt.description.substring(19);
              var lng = body.room.length;
              var hostName = evnt.summary.substring(lng + 3);
              //console.log('HOST: ' + hostName);

              var message = 'Unfortunately, the ' + body.room + ' has already been snagged by ' + hostName + ' at that time. Check the calendar above for available rooms!';

              resp = false;

              callback.exists(message);
              
              break;
            }         
          }
        }
      }

      whenDone(resp);
  });
}

// add event to google calendar
function addEvent(body, callback){
	// create correct times
  var now = app.moment(body.start);
	var later = app.moment(body.end);

	var title = body.room + ' - ' + body.company;
	var attendee = body.email;

	// insert new event
    gcal.events.insert({
        auth: oauthClient,
        calendarId: app.env.CALID,
        resource: {
          summary: title,
          description: 'Reservation made by ' + attendee,
          start: {
            dateTime: now
          },
          end: {
            dateTime: later
          },
          attendees: [{
            email: attendee
          }]
        }
    }, function(err, event){
    	if (err) {
          console.log('-- GCAL ERR-- : ' + err);
          
          // try to re-authenticate
          auth();  

          callback.error(err)
        } else {  
          callback.success(event);
        }
    }); 
}
  

// authenticate with gcal services
function auth() {
  token = new app.GoogleToken({
      iss: app.env.SERVICEACC,
      scope: 'https://www.googleapis.com/auth/calendar',
      keyFile: 'key.pem'
  }, function (err) {
      if (err) {
          console.log('--TOKEN ERR--:\n' + err);
          app.snagController.errorEmail(err);
          return console.log(err);
      }

      token.getToken(function (err, tokenn) {
          if (err) {
              console.log('-- TOKEN ERR --:\n' + err);
              app.snagController.errorEmail(err);
              return console.log(err);
          }
          else {
            // create and set authorization client and necessary credentials
            oauthClient = new OAuth2('', '', '', {}, {});
            oauthClient.setCredentials({token_type: 'Bearer', access_token: tokenn});

            console.log('Credentials Loaded');
          }
      });
  });
}
