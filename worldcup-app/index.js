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

app.get('/otherModules', function(request, response) {
	response.sendFile(path.join(__dirname, '/', 'other.html'));
})

app.use(express.static(__dirname + '/static/'));

// ----------------------------------------------------------------------------
// Simulation
app.get('/getSimulation', function(request, response) {
    var sql = getQuery(request.query.by);
	connection.query(sql,
	function (error, results, fields) {
	  if (error) throw error;
	  var by = request.query.by;
	  var randomness = request.query.randomness;
	  var numSimulations = request.query.numSimulations;
	  var simulationResults = runSimulations(by, randomness, numSimulations, results);
	  response.json(simulationResults);
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
		throw new Error("Invalid criterion: " + by);
	}

	return sql;
}

// TODO
// Run Simulations
function runSimulations(by, randomness, numSimulations, data) {
	// Create standardized countryData JSON object
	var countryData = [];
	for (var i = 0; i < data.length; i++) {
		country = data[i];
		if (by == "bElo" || by == "nElo") {
			countryData[i] = {"country": country.country, "group": country.team_group, "rating": country.elo_rating};
		} else if (by == "star") {
			countryData[i] = {"country": country.country, "group": country.team_group, "rating": country.score};
		} else if (by == "wins") {
			countryData[i] = {"country": country.country, "group": country.team_group, "rating": country.wins};
		} else if (by == "gdp") {
			countryData[i] = {"country": country.country, "group": country.team_group, "rating": country.gdp};
		} else if (by == "capita") {
			countryData[i] = {"country": country.country, "group": country.team_group, "rating": country.gdp_per_capita};
		} else {
			console.error("Invalid criterion");
			return;
		}
	}
	// Sort countryData by group
	countryData = countryData.sort(function(j1, j2) { return j1.group.localeCompare(j2.group) });
	// Create simulation data
	var simData = createSimulationJSON(countryData);

	for (var i = 0; i < numSimulations; i++) {
		runSingleSimulation(by, randomness, simData);
	}	
	return simData;
}

// Run Single Simulation
function runSingleSimulation(by, randomness, simData) {

	// Group Stage
	var groups = ["A", "B", "C", "D", "E", "F", "G", "H"];
	// Round Robin matches for each group
	for (var i = 0; i < groups.length; i++) {
		for (var j = 0; j < 3; j++) {
			for (var k = j + 1; k < 4; k++) {
				simulateMatch(by, randomness, simData[4 * i + j], simData[4 * i + k]);
			}
		}
	}

	// Group Results - Top 16
	var bracket = new Array(16).fill("0");
	for (var i = 0; i < groups.length; i++) {
		groupTeams = simData.slice(4 * i, 4 * i + 4).sort(function(c1, c2) { return c2.gamesWon - c1.gamesWon });
		bracket[i] = (i % 2 == 0) ? groupTeams[0] : groupTeams[1];
		bracket[i].top16 += 1;
		bracket[i + 8] = (i % 2 == 0) ? groupTeams[1] : groupTeams[0];
		bracket[i + 8].top16 += 1;
	}

	// Bracket Matches
	var rounds = ["top8", "top4", "top2", "titles"];
	for (var i = 0; i < rounds.length; i++) {
		var newBracket = [];
		for (var j = 0; j < bracket.length / 2; j++) {
			var matchResult = simulateMatch(by, randomness, bracket[2 * j], bracket[2 * j + 1]);
			newBracket[j] = bracket[2 * j + matchResult];
			newBracket[j][rounds[i]] += 1;
		}
		bracket = newBracket;
	}
}

// Create Simulation JSON
function createSimulationJSON(countryData) {
	var simJSON = []
	for (var i = 0; i < countryData.length; i++) {
		simJSON[i] = {"country": countryData[i].country, "rating": countryData[i].rating, "group": countryData[i].group,
					  "gamesWon": 0, "gamesPlayed": 0, "gamesLost": 0,
					  "top16": 0, "top8": 0, "top4": 0, "top2": 0, "titles": 0};
	}
	return simJSON;
}

// Simulate Match
// Updates JSON objects accordingly
// Returns 0 if c1 wins, 1 otherwise
// TODO: update
function simulateMatch(by, randomness, c1, c2) {
	c1.gamesPlayed += 1;
	c2.gamesPlayed += 1;
	var tempWinner = 0;
	if (by == "nElo") {
		// Elo rating formula
		var eloDiff = c1.rating - c2.rating;
		var winProb = 1.0 / (1 + Math.pow(10, -eloDiff / 400.0));
		console.log(winProb);
		var rand = Math.random();
		tempWinner = (rand < winProb) ? 0 : 1;
	} else {
		// If tied, flip a coin
		if (c1.rating == c2.rating) {
			var rand = Math.random();
			tempWinner = (rand < 0.5) ? 0 : 1;
		// Otherwise, pick the team with the better rating
		} else {
			tempWinner = (c1.rating > c2.rating) ? 0 : 1;
		}
	}
	// Adjust for randomness
	var randomFactor = randomness / 100.0;
	var rand = Math.random();
	if (rand < randomFactor) {
		var rand2 = Math.random();
		if (rand2 < .5) {
			winner = team1
		} else {
			winner = team 2
		}
	} else {
		winner = tempWinner;
	}
	if (winner == 0) {
		c1.gamesWon += 1;
		return 0;
	} else {
		c2.gamesWon += 1;
		return 1;
	}
	// c1.gamesPlayed += 1;
	// c2.gamesPlayed += 1;
	// if (c1.rating > c2.rating) {
	// 	c1.gamesWon += 1;
	// 	return 0;
	// } else {
	// 	c2.gamesWon += 1;
	// 	return 1;
	// }
}

/* NOTES
   - Fields to include: gamesWon, gamesPlayed, gamesLost, top16, top8, top4, top2, titles
*/
