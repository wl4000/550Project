var express = require('express')
var app = express()
var path = require('path')
var mysql = require('mysql')
var MongoClient = require('mongodb').MongoClient;
var mongodb;

var mongoURL = "mongodb://cis550group4:joeyisbeta42069@ds135680.mlab.com:35680/cis550project";
MongoClient.connect(mongoURL, function(err, db) {
    if (err) throw err;
    mongodb = db.db("cis550project");
});

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

app.get('/getCountryFlags', function(request, response) {
	mongodb.collection("countryFlags").find().toArray(function(err, result) {
		if (err) throw err;
		response.json(result);
	});
})

app.get('/getDepthChartPhotos', function(request, response) {
	var player_ids = request.query.player_ids;
	for (var i = 0; i < player_ids.length; i++) {
		player_ids[i] = parseInt(player_ids[i]);
	}
	mongodb.collection("countryPlayers").aggregate([
		{$match: {country: request.query.country}},
		{$project: {_id: 0, players: 1}},
		{$unwind: "$players"},
		{$project: {"players.player_id": 1, "players.photo": 1}},
		{$match: {"players.player_id": {$in: player_ids}}}
	]).toArray(function(err, result) {
		if (err) throw err;
		response.json(result);
	});
})

app.get('/getCountryData', function(request, response) {
	connection.query('select country.country country, country.team_group team_group, country.elo_rating elo, country.gdp, country.gdp_per_capita, max(player.overall) player_max, c.wins, IFNULL(d.num_appearances,0) num_appearances from country join player on player.nationality=country.country join (SELECT country, count(*)-1 AS wins FROM (SELECT country, team_group FROM country UNION ALL SELECT a.winner AS country, b.team_group AS team_group FROM world_cup_outcomes a JOIN country b ON a.winner=b.country) AS temp GROUP BY country, team_group) c on c.country=country.country left join (select count(*) num_appearances, country from participated_in group by country) d on d.country = country.country group by country;',
	function (error, results, fields) {
	  if (error) throw error;
	  response.json(results);
	});
})

app.get('/getCorrelation', function(request, response) {
    var criterion1 = request.query.criterion1;
    var criterion1query = "";
    if (criterion1 == 1) {
    	criterion1query = "country.elo_rating elo";
    } else if (criterion1 == 2) {
    	criterion1query = "country.gdp gdp";
    } else if (criterion1 == 3) {
    	criterion1query = "country.gdp_per_capita capita";
    } else if (criterion1 == 4) {
    	criterion1query = "country.interest_rate interest_rate";
    } else if (criterion1 == 5) {
    	criterion1query = "country.unemployment_rate unemployment_rate";
    } else if (criterion1 == 6) {
    	criterion1query = "IFNULL(d.num_appearances,0) num_appearances";
    } else if (criterion1 == 7) {
    	criterion1query = "c.wins wins";
    } else {
    	criterion1query = "max(player.overall) player_max";
    }
    var criterion2 = request.query.criterion2;
    var criterion2query = "";
    if (criterion2 == 1) {
    	criterion2query = "country.elo_rating elo";
    } else if (criterion2 == 2) {
    	criterion2query = "country.gdp gdp";
    } else if (criterion2 == 3) {
    	criterion2query = "country.gdp_per_capita capita";
    } else if (criterion2 == 4) {
    	criterion2query = "country.interest_rate interest_rate";
    } else if (criterion2 == 5) {
    	criterion2query = "country.unemployment_rate unemployment_rate";
    } else if (criterion2 == 6) {
    	criterion2query = "IFNULL(d.num_appearances,0) num_appearances";
    } else if (criterion2 == 7) {
    	criterion2query = "c.wins wins";
    } else {
    	criterion2query = "max(player.overall) player_max";
	}
	if(criterion1==criterion2){
		response.json({"correlation":1});
	}
	else{
		connection.query('select country.country country,' + criterion1query + ', ' + criterion2query + ' from country join player on player.nationality=country.country join (SELECT country, count(*)-1 AS wins FROM (SELECT country, team_group FROM country UNION ALL SELECT a.winner AS country, b.team_group AS team_group FROM world_cup_outcomes a JOIN country b ON a.winner=b.country) AS temp GROUP BY country, team_group) c on c.country=country.country left join (select count(*) num_appearances, country from participated_in group by country) d on d.country = country.country group by country;',
		function (error, results, fields) {
	  		if (error) throw error;
	  		corr=runCorrelation(criterion1,criterion2,results);
	  		response.json({"correlation":corr});
		});
	}
})
// Run Simulations
function runCorrelation(criterion1, criterion2, data) {
	// Create standardized countryData JSON object
	var x = [];
	var y = [];
	if(criterion1==criterion2){
		return 1;
	}
	for (var i = 0; i < data.length; i++) {
		var country = data[i];
		if (criterion1 == 1) {
			x.push(country.elo);
		} else if (criterion1 == 2) {
			x.push(country.gdp);
		} else if (criterion1 == 3) {
			x.push(country.capita);
		} else if (criterion1 == 4) {
			x.push(country.interest_rate);
		} else if (criterion1 == 5) {
			x.push(country.unemployment_rate);
		} else if (criterion1 == 6) {
			x.push(country.num_appearances);
		} else if (criterion1 == 7) {
			x.push(country.wins);
		} else {
			x.push(country.player_max);
		}

		if (criterion2 == 1) {
			y.push(country.elo);
		} else if (criterion2 == 2) {
			y.push(country.gdp);
		} else if (criterion2 == 3) {
			y.push(country.capita);
		} else if (criterion2 == 4) {
			y.push(country.interest_rate);
		} else if (criterion2 == 5) {
			y.push(country.unemployment_rate);
		} else if (criterion2 == 6) {
			y.push(country.num_appearances);
		} else if (criterion2 == 7) {
			y.push(country.wins);
		} else {
			y.push(country.player_max);
		}
	}

	return getPearsonCorrelation(x,y);
}

// Library for javascript correlation function memory.psych.mun.ca/tech/js/correlation.shtml
function getPearsonCorrelation(x, y) {
    var shortestArrayLength = 0;
     
    if(x.length == y.length) {
        shortestArrayLength = x.length;
    } else if(x.length > y.length) {
        shortestArrayLength = y.length;
        console.error('x has more items in it, the last ' + (x.length - shortestArrayLength) + ' item(s) will be ignored');
    } else {
        shortestArrayLength = x.length;
        console.error('y has more items in it, the last ' + (y.length - shortestArrayLength) + ' item(s) will be ignored');
    }
  
    var xy = [];
    var x2 = [];
    var y2 = [];
  
    for(var i=0; i<shortestArrayLength; i++) {
        xy.push(x[i] * y[i]);
        x2.push(x[i] * x[i]);
        y2.push(y[i] * y[i]);
    }
  
    var sum_x = 0;
    var sum_y = 0;
    var sum_xy = 0;
    var sum_x2 = 0;
    var sum_y2 = 0;
  
    for(var i=0; i< shortestArrayLength; i++) {
        sum_x += x[i];
        sum_y += y[i];
        sum_xy += xy[i];
        sum_x2 += x2[i];
        sum_y2 += y2[i];
    }
  
    var step1 = (shortestArrayLength * sum_xy) - (sum_x * sum_y);
    var step2 = (shortestArrayLength * sum_x2) - (sum_x * sum_x);
    var step3 = (shortestArrayLength * sum_y2) - (sum_y * sum_y);
    var step4 = Math.sqrt(step2 * step3);
    var answer = step1 / step4;
  
	return answer;
}

app.get('/getDepthChart', function(request, response) {
	var country = request.query.country;
	connection.query('  SELECT position, name, overall, wage, player_id FROM\
	(SELECT position, name, overall, wage, player_id, @player_rank := IF(@current_position = position, @player_rank + 1, 1)\
	AS player_rank,\
	@current_position := position\
	FROM (SELECT A.position as position, A.overall as overall, B.name as name, B.wage as wage, B.player_id as player_id \
	  FROM player_by_position A JOIN player B on A.player_id=B.player_id WHERE B.nationality LIKE "'+country+'")\
	  tmp ORDER BY position, overall DESC) ranked WHERE player_rank <= 4;',
	function (error, results, fields) {
	  if (error) throw error;
	});
	connection.query('  SELECT position, name, overall, wage, player_id FROM\
	(SELECT position, name, overall, wage, player_id, @player_rank := IF(@current_position = position, @player_rank + 1, 1)\
	AS player_rank,\
	@current_position := position\
	FROM (SELECT A.position as position, A.overall as overall, B.name as name, B.wage as wage, B.player_id as player_id \
	  FROM player_by_position A JOIN player B on A.player_id=B.player_id WHERE B.nationality LIKE "'+country+'")\
	  tmp ORDER BY position, overall DESC) ranked WHERE player_rank <= 4 order by position, overall asc;',
	function (error, results, fields) {
	  if (error) throw error;
	  var o = {};
	  var key = results[(results.length - 1)].position;
	  o[key] = [];
	  for (var i = results.length - 1; i >= 0; i--) {
	  	if (key != results[i].position) {
	  		key = results[i].position;
	  		o[key] = [];
	  	}
	  	var data = {
	  		name: results[i].name,
	  		overall: results[i].overall,
			wage: results[i].wage,
			player_id: results[i].player_id
	  	}
	  	o[key].push(data);
	  }
	  response.json(o);
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

	// Create result JSON
	var simResult = {"groupAdvances": [], "countryData": []};

	// Populate simResult.groupAdvances
	var groups = ["A", "B", "C", "D", "E", "F", "G", "H"];
	for (var i = 0; i < groups.length; i++) {
		var groupData = {"group": groups[i], "countries": []}
		for (var j = 0; j < 4; j++) {
			var countryJSON = simData[4 * i + j];
			groupData.countries[j] = {"country": countryJSON.country, "rating": countryJSON.rating,
			                          "advances": countryJSON.top16};
		}
		groupData.countries = groupData.countries.sort(function(c1, c2) {
			var result = (c1.advances != c2.advances) ? c2.advances - c1.advances
					   : (c1.rating != c2.rating) ? c2.rating - c1.rating
					                              : c1.country.localeCompare(c2.country);
			return result;
		});
		simResult.groupAdvances[i] = groupData;
	}

	// Populate simResult.countryData
	var sortedSimData = simData.sort(function(c1, c2) {
		var result = (c1.titles != c2.titles) ? c2.titles - c1.titles
				   : (c1.top2 != c2.top2) ? c2.top2 - c1.top2
				   : (c1.top4 != c2.top4) ? c2.top4 - c1.top4
				   : (c1.top8 != c2.top8) ? c2.top8 - c1.top8
				   : (c1.top16 != c2.top16) ? c2.top16 - c1.top16
				   : (c1.rating != c2.rating) ? c2.rating - c1.rating
				   : (c1.group != c2.group) ? c1.group.localeCompare(c2.group)
											: c1.country.localeCompare(c2.country);
		return result;
	});
	simResult.countryData = sortedSimData;

	return simResult;
}

// Run Single Simulation
function runSingleSimulation(by, randomness, simData) {

	// Reset gamesWon and gamesPlayed
	for (var i = 0; i < simData.length; i++) {
		simData[i].gamesWon = 0;
		simData[i].gamesPlayed = 0;;
	}

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
		var groupSlice = simData.slice(4 * i, 4 * i + 4);
		// Shuffle the slice to break ties randomly
		var groupSliceShuffled = shuffle(groupSlice);
		// Sort by number of games won
		var groupTeams = groupSliceShuffled.sort(function(c1, c2) { return c2.gamesWon - c1.gamesWon });
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
					  "totalGamesWon": 0, "totalGamesPlayed": 0, "gamesWon": 0, "gamesPlayed": 0,
					  "top16": 0, "top8": 0, "top4": 0, "top2": 0, "titles": 0};
	}
	return simJSON;
}

// Simulate Match
// Updates JSON objects accordingly
// Returns 0 if c1 wins, 1 otherwise
function simulateMatch(by, randomness, c1, c2) {
	c1.gamesPlayed += 1;
	c1.totalGamesPlayed += 1;
	c2.gamesPlayed += 1;
	c2.totalGamesPlayed += 1;
	var tempWinner = 0;
	if (by == "nElo") {
		// Elo rating formula
		var eloDiff = c1.rating - c2.rating;
		var winProb = 1.0 / (1 + Math.pow(10, -eloDiff / 400.0));
		//console.log(winProb);
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
	var randomFactor = randomness / 200.0;
	var rand = Math.random();
	var winner = (rand < randomFactor) ? (1 - tempWinner) : tempWinner;

	if (winner == 0) {
		c1.gamesWon += 1;
		c1.totalGamesWon += 1;
		return 0;
	} else {
		c2.gamesWon += 1;
		c2.totalGamesWon += 1;
		return 1;
	}
}

// Shuffle an array (Fisher-Yates algorithm)
function shuffle(a) {
    var j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
    return a;
}