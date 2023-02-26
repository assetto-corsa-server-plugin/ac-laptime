const config = require('./config');
const httpRequest = require('./tools').httpRequest;

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
    update_trackbest_var (model, data) {
        this.trackbest[model] = data;
    }
    update_car_var (car_id, guid, username, model, res) {
        this.cars[car_id] = {
            guid: guid,
            username: username,
            model: model,
            best: res !== undefined ? res.laptime : 0
        };
    }
    update_car (username, guid, car_id, model) {
        httpRequest.post(`/username?guid=${guid}`, {username: username});
        if (this.trackbest[model] === undefined) {
            httpRequest.get(`/trackbest?track=${this.track}&model=${model}`, (res) => {
                this.update_trackbest_var(model, res !== undefined ? {guid: res.guid, username: res.username, laptime: res.laptime} : undefined);
            })
        }
        httpRequest.get(`/personalbest?track=${this.track}&model=${model}&guid=${guid}`, (res) => {
            this.update_car_var(car_id, guid, username, model, res);
        });
    }
    update_trackbest (car_id, laptime) {
        const car = this.get_car(car_id);
        this.trackbest[car.model] = {
            laptime: laptime,
            guid: car.guid
        };
        httpRequest.post(`/trackbest?track=${this.track}&model=${model}&guid=${guid}`, {laptime: laptime});
    }
    update_personalbest (car_id, laptime) {
        const car = this.get_car(car_id);
        this.cars[car_id].best = laptime;
        httpRequest.post(`/personalbest?track=${this.track}&model=${car.model}`, {laptime: laptime, guid: car.guid});
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