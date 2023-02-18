class Database {
    constructor () {
        this.cars = {};
    }
    set (key, value) {
        this[key] = value;
    }
    new_user (username, guid, car_id, model) {
        this.cars[car_id] = {
            guid: guid,
            username: username,
            model: model
        }
    }
    get_car (car_id) {
        return this.cars[car_id];
    }
    remove_car (car_id) {
        this.cars[car_id] = null;
    }
    update_trackbest (car, laptime, track) {
        this.trackbest = {
            laptime: laptime,
            user_guid: car.guid
        }
    }
    update_personalbest (car, laptime, track) {
        this.personalbest[car.guid][car.model] = laptime;
    }
    get_personalbest (guid, model, track) {
        try {
            return this.personalbest[guid][model];
        } catch (e) {
            return 0;
        }
    }
    get_trackbest (model, track) {
        try {
            return this.trackbest.laptime;
        } catch (e) {
            return 0;
        }
    }
    update_username (guid, name) {}
}

module.exports = {
    DB: Database
}