const mysql = require('mysql');
const mysql_config = require('./mysql_config');

class Database {
    init (max_cars, track) {
        this.connection = mysql.createConnection(mysql_config);
        this.connection.connect();
        this.connection.query('CREATE TABLE IF NOT EXISTS personalbest(guid CHAR(17), laptime INT, model CHAR(15), track CHAR(30))');
        this.connection.query('CREATE TABLE IF NOT EXISTS trackbest(guid CHAR(17), laptime INT, model CHAR(15), track CHAR(30))');
        this.connection.query('CREATE TABLE IF NOT EXISTS username(guid CHAR(17), username CHAR(30))');
        this.track = track;
        this.trackbest = {};
        this.max_cars = max_cars
        this.cars = {};
        for (var i = 0; i < max_cars; i++) {
            this.reset_car(i);
        }
    }
    set (key, value) {
        this[key] = value;
    }
    reset_car (car_id) {
        this.cars[car_id] = {model: undefined, best: undefined, username: undefined, guid: undefined}
    }
    update_car (username, guid, car_id, model) {
        this.connection.query(`SELECT laptime FROM personalbest WHERE guid=${guid} AND model='${model}' AND track='${this.track}'`, (error, results) => {
            this.cars[car_id] = {
                guid: guid,
                username: username,
                model: model,
                best: results.length > 0 ? results[0].laptime : 0
            }
        })
        this.connection.query(`SELECT * FROM username WHERE guid=${guid}`, (error, results) => {
            if (results.length > 0) {
                if (results[0].username !== username) this.connection.query(`UPDATE username SET username=? WHERE guid=${guid}`, [username], (error, results) => {});
            } else {
                this.connection.query(`INSERT INTO username (username, guid) VALUES(?, ${guid})`, [username], (error, results) => {});
            }
        });
    }
    update_trackbest (car_id, laptime) {
        const car = this.get_car(car_id);
        this.trackbest[car.model] = {
            laptime: laptime,
            guid: car.guid
        }
        this.connection.query(`SELECT * FROM trackbest WHERE track='${this.track}' AND model='${car.model}'`, (error, results) => {
            if (results.length > 0) this.connection.query(`UPDATE trackbest SET guid=${car.guid} AND laptime=${laptime} WHERE track='${this.track}' AND model='${car.model}'`, (error, results) => {});
            else this.connection.query(`INSERT INTO trackbest (guid, laptime, track, model) VALUES(${car.guid}, ${laptime}, '${this.track}', '${car.model}')`, (error, results) => {});
        });
    }
    update_personalbest (car_id, laptime) {
        const car = this.get_car(car_id);
        this.cars[car_id].best = laptime;
        this.connection.query(`SELECT * FROM personalbest WHERE track=${this.track} AND model=${car.model} AND guid=${car.guid}`, (error, results) => {
            if (results.length > 0) this.connection.query(`UPDATE personalbest SET guid=${car.guid} AND laptime=${laptime} WHERE track='${this.track}' AND model='${car.model}'`, (error, results) => {});
            else this.connection.query(`INSERT INTO trackbest (guid, laptime, track, model) VALUES(${car.guid}, ${laptime}, '${this.track}', '${car.model}')`, (error, results) => {});
        });
    }
    get_car (car_id) {
        return this.cars[String(car_id)];
    }
    get_personalbest (car_id) {
        return this.get_car(car_id).best;
    }
    get_trackbest (car_id) {
        return (this.trackbest[this.get_car(car_id).model] || {laptime: 0}).laptime;
    }
}

module.exports = {
    DB: Database
}