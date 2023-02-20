class Database {
    init (max_cars, track) {
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
        const best = 0; // get data from db server
        this.cars[car_id] = {
            guid: guid,
            username: username,
            model: model,
            best: best
        }
        // send the most recent username to the server
    }
    update_trackbest (car_id, laptime) {
        const user = this.cars[car_id];
        this.trackbest[user.model] = {
            laptime: laptime,
            guid: user.guid
        }
        // send data to db server 
    }
    update_personalbest (car_id, laptime) {
        this.cars[car_id].best = laptime;
        // send data to db server
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