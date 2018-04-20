//Get ELO Query
app.get('/elo', function(request, response) {
    var mysql = require('mysql');
    var connection = mysql.createConnection({
      host: ' cis550project.cei97a31mv1e.us-east-2.rds.amazonaws.com',
      user: 'cis550guest',
      password: 'cis550guestpassword',
      database: 'cis550project'
    });
   
    connection.connect(function(err) {
      if (err) {
          console.error('error connecting: ' + err.stack);
          return;
        }
   
    });
    connection.query('SELECT country,team_group,elo_rating FROM country;',function(error, results, fields) {
      if(error) {
        console.error('error:' + error.stack);
        return;
      }
      response.json(results);
    });
  })

//Get Larger GDP and Larger GDP per capita
//Get GDP
app.get('/GDP', function(request, response) {
    var mysql = require('mysql');
    var connection = mysql.createConnection({
      host: ' cis550project.cei97a31mv1e.us-east-2.rds.amazonaws.com',
      user: 'cis550guest',
      password: 'cis550guestpassword',
      database: 'cis550project'
    });
   
    connection.connect(function(err) {
      if (err) {
          console.error('error connecting: ' + err.stack);
          return;
        }
   
    });
    connection.query('SELECT country,team_group,gdp FROM country;',function(error, results, fields) {
      if(error) {
        console.error('error:' + error.stack);
        return;
      }
      response.json(results);
    });
  })
//Get GDP per Capita
app.get('/GDP_per_capita', function(request, response) {
    var mysql = require('mysql');
    var connection = mysql.createConnection({
      host: ' cis550project.cei97a31mv1e.us-east-2.rds.amazonaws.com',
      user: 'cis550guest',
      password: 'cis550guestpassword',
      database: 'cis550project'
    });
   
    connection.connect(function(err) {
      if (err) {
          console.error('error connecting: ' + err.stack);
          return;
        }
   
    });
    connection.query('SELECT country,team_group,gdp_per_capita FROM country;',function(error, results, fields) {
      if(error) {
        console.error('error:' + error.stack);
        return;
      }
      response.json(results);
    });
  })
//Get Wins
app.get('/wins', function(request, response) {
    var mysql = require('mysql');
    var connection = mysql.createConnection({
      host: ' cis550project.cei97a31mv1e.us-east-2.rds.amazonaws.com',
      user: 'cis550guest',
      password: 'cis550guestpassword',
      database: 'cis550project'
    });
   
    connection.connect(function(err) {
      if (err) {
          console.error('error connecting: ' + err.stack);
          return;
        }
   
    });
    //Schema -> country,team_group, wins
    connection.query('SELECT country, team_group, count(*)-1 AS wins FROM(SELECT country,team_group FROM country UNION ALL SELECT a.winner AS country, b.team_group AS team_group FROM world_cup_outcomes a JOIN country b ON a.winner=b.country) AS temp GROUP BY country,team_group;',function(error, results, fields) {
      if(error) {
        console.error('error:' + error.stack);
        return;
      }
      response.json(results);
    });
  })
//Better Star Player
app.get('/star_player', function(request, response) {
    var mysql = require('mysql');
    var connection = mysql.createConnection({
      host: ' cis550project.cei97a31mv1e.us-east-2.rds.amazonaws.com',
      user: 'cis550guest',
      password: 'cis550guestpassword',
      database: 'cis550project'
    });
   
    connection.connect(function(err) {
      if (err) {
          console.error('error connecting: ' + err.stack);
          return;
        }
   
    });
    //Schema -> country,team_group, score
    connection.query('SELECT a.nationality as country,b.team_group as team_group, max(a.overall) as score FROM player a JOIN country b on a.nationality=b.country GROUP BY a.nationality, b.team_group;',function(error, results, fields) {
      if(error) {
        console.error('error:' + error.stack);
        return;
      }
      response.json(results);
    });
  })




