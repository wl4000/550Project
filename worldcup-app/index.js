var express = require('express')
var app = express()
var path = require('path')

app.set('port', (process.env.PORT || 5000))
app.use(express.static(__dirname + '/public'))

app.get('/', function(request, response) {
	response.sendFile(path.join(__dirname, '/', 'index.html'));
})

app.get('/customSimulation', function(request, response) {
	response.sendFile(path.join(__dirname, '/', 'customSimulation.html'));
})

app.get('/countryData', function(request, response) {
	response.sendFile(path.join(__dirname, '/', 'countryData.html'));
})

app.use(express.static(__dirname + '/static/'));



/*app.get('/friends', function(request, response) {
	var mysql = require('mysql');
	var connection = mysql.createConnection({
 		host: 'fling.seas.upenn.edu',
		user: 'jpopelka',
		password: 'P3j5m4p9!',
		database: 'jpopelka'
	});
 
	connection.connect(function(err) {
		if (err) {
    		console.error('error connecting: ' + err.stack);
    		return;
  		}
 
	});
	connection.query('SELECT p.name, count(p.name) FROM Friends f, Person p WHERE f.login=p.login GROUP BY p.name;',function(error, results, fields) {
		if(error) {
			console.error('error:' + error.stack);
			return;
		}
		response.json(results);
	});
})*/

app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'))
})
