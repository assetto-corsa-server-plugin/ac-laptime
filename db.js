const config = require('config');
const request = require('request');

class Database {
    init (max_cars, track) {
        this.track = track;
        this.max_cars = max_cars
        this.cars = {};
        for (var i = 0; i < max_cars; i++) {
            this.reset_car(i);
        }
        this.trackbest = {};
    }
    set (key, value) {
        this[key] = value;
    }
    reset_car (car_id) {
        this.cars[car_id] = {model: undefined, best: undefined, username: undefined, guid: undefined};
    }
    update_car (username, guid, car_id, model) {
        if (this.trackbest[model] === undefined) {
            request.get({url: config.db.host + '/trackbest', qs: {track: this.track, model: model}}, (err, res, body) => {
                this.trackbest[model] = res === undefined ? {guid: res.guid, username: res.username, laptime: res.laptime} : undefined;
            });
        }
        request.get({url: config.db.host + '/personalbest', qs: {track: this.track, model: model, guid: guid}}, (err, res, body) => {
            this.cars[car_id] = {
                guid: guid,
                username: username,
                model: model,
                best: res.laptime
            };
        });
        request.post({url: config.db.host + '/username', method: 'POST', qs: {guid: guid}, body: {username: username}}, (err, res, body) => {});
    }
    update_trackbest (car_id, laptime) {
        const car = this.get_car(car_id);
        this.trackbest[car.model] = {
            laptime: laptime,
            guid: car.guid
        };
        request.post({url: config.db.host + '/trackbest', method: 'POST', qs: {track: this.track, model: car.model, guid: guid}, body: {laptime: laptime}}, (err, res, body) => {});
    }
    update_personalbest (car_id, laptime) {
        const car = this.get_car(car_id);
        this.cars[car_id].best = laptime;
        request.post({url: config.db.host + '/personalbest', method: 'POST', qs: {track: this.track, model: car.model}, body: {laptime: laptime, guid: guid}}, (err, res, body) => {});
    }
    get_car (car_id) {
        return this.cars[String(car_id)];
    }
    get_personalbest (car_id) {
        return this.get_car(car_id).best;
    }
    get_trackbest (car_id) {
        return this.trackbest[this.get_car(car_id).model] || {guid: 0, username: '', laptime: 0};
    }
}

module.exports = {
    DB: Database
}