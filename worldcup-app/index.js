var express = require('express')
var app = express()
var path = require('path')
var mysql = require('mysql')

var connection = mysql.createConnection({
	  host     : 'cis550project.cei97a31mv1e.us-east-2.rds.amazonaws.com',
	  user     : 'cis550group4',
	  password : 'joeyisbeta42069',
	  database : 'cis550project'
	});

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

// ----------------------------------------------------------------------------
// Simulation
app.get('/getSimulation', function(request, response) {
    var sql = getQuery(request.query.by);
	connection.query(sql,
	function (error, results, fields) {
	  if (error) throw error;
	  response.json(results);
	});
})
// ----------------------------------------------------------------------------

app.get('/getCountryData', function(request, response) {
	connection.query('select * from country;',
	function (error, results, fields) {
	  if (error) throw error;
	  response.json(results);
	});
})

app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'))
})

// ----------------------------------------------------------------------------
// Simulation Functions

// Get SQL Query
function getQuery(by) {
	var sql = 'SELECT * FROM country';
	
	if (by == "bElo" || by == "nElo") {
		sql = 'SELECT country, team_group, elo_rating\
			   FROM country;';
	} else if (by == "star") {
		sql = 'SELECT a.nationality as country, b.team_group as team_group, max(a.overall) as score\
			   FROM player a JOIN country b on a.nationality=b.country\
			   GROUP BY a.nationality, b.team_group;';
	} else if (by == "wins") {
		sql = 'SELECT country, team_group, count(*)-1 AS wins\
			   FROM (SELECT country, team_group\
					 FROM country\
					 UNION ALL\
					 SELECT a.winner AS country, b.team_group AS team_group\
					 FROM world_cup_outcomes a JOIN country b ON a.winner=b.country) AS temp\
			   GROUP BY country, team_group;';
	} else if (by == "gdp") {
		sql = 'SELECT country, team_group, gdp\
			   FROM country;'
	} else if (by == "capita") {
		sql = 'SELECT country, team_group, gdp_per_capita\
		       FROM country;'
	} else {
		console.error("Invalid criterion");
		throw error;
	}

	return sql;
}