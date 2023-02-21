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
        this.connection.query(`SELECT laptime FROM personalbest WHERE guid=${guid}, model=${model}, track=${this.track}`, (error, results) => {
            this.cars[car_id] = {
                guid: guid,
                username: username,
                model: model,
                best: results !== undefined ? results[0] : 0
            }
        })
        this.connection.query(`SELECT * FROM username WHERE guid=${guid}`, (error, results) => {
            if (results !== undefined) {
                if (results[0] !== username) this.connection.query(`UPDATE username SET username=? WHERE guid=${guid}`, [username], (error, results) => {});
            } else {
                this.connection.query(`INSERT INTO username (username, guid) VALUES(?, ${guid})`, [username], (error, results) => {});
            }
        });
    }
    update_trackbest (car_id, laptime) {
        const user = this.cars[car_id];
        this.trackbest[user.model] = {
            laptime: laptime,
            guid: user.guid
        }
        this.connection.query(`SELECT * FROM trackbest WHERE track=${this.track}, model=${user.model}`, (error, results) => {
            if (results !== undefined) this.connection.query(`UPDATE trackbest SET guid=${guid}, laptime=${laptime} WHERE track=${this.track}, model=${user.model}`, (error, results) => {});
            else this.connection.query(`INSERT INTO trackbest (guid, laptime, track, model) VALUES(${guid}, ${laptime}, ${this.track}, ${user.model})`, (error, results) => {});
        });
    }
    update_personalbest (car_id, laptime) {
        this.cars[car_id].best = laptime;
        this.connection.query(`SELECT * FROM personalbest WHERE track=${this.track}, model=${user.model}, guid=${guid}`, (error, results) => {
            if (results !== undefined) this.connection.query(`UPDATE personalbest SET laptime=${laptime} WHERE guid=${guid}, track=${this.track}, model=${user.model}`, (error, results) => {});
            else this.connection.query(`INSERT INTO trackbest (guid, laptime, track, model) VALUES(${guid}, ${laptime}, ${this.track}, ${user.model})`, (error, results) => {});
        });
    }
    get_car (car_id) {
        return this.cars[car_id];
    }
    get_personalbest (car_id) {
        return this.cars[car_id].best;
    }
    get_trackbest (car_id) {
        return this.trackbest[this.cars[car_id].model].laptime;
    }
}

module.exports = {
    DB: Database
}