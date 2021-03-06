// controller for Snag @ domistation.com/reservations

module.exports = function(app){
	return app.snagController = (function() {
		function snagController() {}

		// receive request to reserve a room
		snagController.room = function(req, res) {
		  var body = req.body;
		  
		  // pass callback as an object
		  app.models.calendar.add(body,{
		  	success: function(event){
		  	  // for tracking id in mongodb
		  	  body.id = event.id;

		  	  // insert into database
		  	  app.models.db.insertMember(body, {
			  	success: function(){
			  		console.log('Member Request Inserted into Mongo.');
			  	},
			  	error: function(err){
			  		console.log('-- INSERT MEMBER ERR --');
			  		console.log(err);
			  	}			  	
			  });

		  	  // insert request into mongo
		  	  app.models.db.insertRequest(body, {
			  	error: function(err){
			  		console.log('-- INSERT REQ ERR --');
			  		console.log(err);
			  	}
			  });

		  	  // send user success email
		  	  snagController.successEmail(body, event);
		  	  res.send({success: true});
		  	  res.end();	
              
		  	},
		  	exists: function(msg){
		  	  // event already exists
	          res.status(500).send({error: msg});
	          res.end();
		  	},
		  	error: function(err){
		  	  console.log('- OUTPUT OF SNAG ERR - ');
			  console.log(err);
		  	  // send user and admin error emails
              snagController.errorEmail(err, body);

              res.status(503).send(false);
              res.end();
		  	}
		  });
		  
		};

		snagController.successEmail = function(user, ev){
			// build email body message
			// then call email model to send
		
			// link to google calendar event
			var link = ev.htmlLink;
			var titleString;
			var signOff;

			var titleRand = Math.floor((Math.random() * 10) + 1);
			var signOffRand = Math.floor((Math.random() * 6) + 1);

			switch(titleRand){
			case 1:
			  titleString = "Congrats!";
			  break;
			case 2:
			  titleString = "Eureka!";
			  break;
			case 3:
			  titleString = "Voila!";
			  break;
			case 4:
			  titleString = "Yippee!";
			  break;
			case 5:
			  titleString = "Huzzah!";
			  break;
			case 6:
			  titleString = "Bravo!";
			  break;
			case 7:
			  titleString = "Jeepers!";
			  break;
			case 8:
			  titleString = "Hurrah!";
			  break;
			case 9:
			  titleString = "Egad!";
			  break;
			default:
			  titleString = "Hooray!";
			  break;
			}

			switch(signOffRand){
			case 1:
			  signOff = "If you\'re on time you\'re late!";
			  break;
			case 2:
			  signOff = "The early bird catches the worm!";
			  break;
			case 3:
			  signOff = "Done is better than perfect.";
			  break;
			case 4:
			  signOff = "Fear is the disease. Hustle is the antidote."
			  break;
			case 5:
			  signOff = "It\'s not about ideas. It\'s about making ideas happen."
			  break;
			default:
			  signOff = "Rise and shine it\'s meeting time!";
			  break;
			}

			// create event object to get date info for email
			var ev = {};
			//var options = {hour: "numeric", minute: "numeric"};
			var startDate = new Date(user.start);
			ev.month = startDate.getMonth() + 1;
			ev.day = startDate.getDay();
			ev.date = startDate.getDate();
			ev.year = startDate.getUTCFullYear();

			// get start time string for email
			var startString = app.moment({hour: startDate.getHours(), minute: startDate.getMinutes()}).format('h:mma');

			// get end time string for email
			var endDate = new Date(user.end);
			var endString = app.moment({hour: endDate.getHours(), minute: endDate.getMinutes()}).format('h:mma');

			var startToEnd = startString + " - " + endString;

			var subjectLine = "Room Snagged: " + startString + "-" + endString + " " + ev.month + "/" + ev.date;

			var domLogo = "https:\/\/www.dropbox.com\/s\/wweksdd33iruxyp\/Dom_Eyes.png?raw=1";

			var monthString = app.helpers.intToMonth(ev.month);
			var dayString = app.helpers.intToDay(ev.day);

			var msg = "<body style='color: #303030 !important;'><div><img style='max-width: 30em; max-height: 200px;' src='" + domLogo + "' /></div><h1>" + titleString + "</h1><br/><h2>" + user.room + "</h2> has been reserved for<br/><h2>" + startToEnd + "</h2> on <br/><h2>" + dayString + ", " + monthString + " " + ev.date + ", " + ev.year + "</h2><br/><br/><div style='color: #303030 !important'>" + link + "<br /><br />Checkout the calendar to make sure all your ducks are in a row! You can email my pal " + app.adminEmail + " for any problems.<br/><br/>" + signOff + "</div><br/><div style='color: #303030 !important'>-- Dom</div></body>";


			// send email
			app.models.email.snagSuccess(msg, user, subjectLine);
		};

		snagController.errorEmail = function(err, user){
			var domLogo = "https:\/\/www.dropbox.com\/s\/wweksdd33iruxyp\/Dom_Eyes.png?raw=1";

			var messageToUser = "<body style='color: #303030 !important;'><div><img style='max-width: 30em; max-height: 200px;' src='" + domLogo + "' /></div><h1 style='color: #303030 !important'>Oops! I knocked over a server rack!</h1><br/><div style='color: #303030 !important'> Unfortunately your room was not reserved. Wait a couple minutes and try again, but if you stil get this email forward it to my buddy " + app.adminEmail + "<br /><br /><br/><br/>Have a great day!</div><br/><div style='color: #303030 !important'>-- Dom</div></body>";

			app.models.email.snagError(err, user, messageToUser);
		};

		return snagController;

	})();
}