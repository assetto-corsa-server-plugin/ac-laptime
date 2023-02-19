const protocols = require('./protocols');
const tools = require('./tools');

class Listeners {
    constructor () {
        var commands = {};
        commands[protocols.NEW_CONNECTION] = {
            query: [['strw', 2], 'uint8', 'str'],
            execute: (data) => {
                this.db.new_user(...data);
                this.db.update_username(data[0], data[1]);
                tools.sendChat(data[2], 'Welcome!', this.client);
                tools.sendChat(data[2], `Your best laptime: ${tools.msToTime(this.db.get_userbest(data[1], data[3], this.db.track))}`, this.client);
                tools.sendChat(data[2], 'Need help? Send /help', this.client);
            }
        };
        commands[protocols.CONNECTION_CLOSED] = {
            query: [['strw', 2], 'uint8', 'str'],
            execute: (data) => {
                this.db.remove_car(data[2]);
            }
        };
        commands[protocols.LAP_COMPLETED] = {
            query: ['uint8', 'uint32', 'uint8'],
            execute: (data) => {
                if (data[2] !== 0) return;
                const car = this.db.get_car(data[0]);
                const personalBest = this.db.get_personalbest(car.guid, car.model, this.db.track);
                if (data[1] > personalBest) {
                    tools.sendChat(data[0], `You broke your best record!\n${tools.msToTime(data[1])}`, this.client);
                    this.db.update_personalbest(car, data[1], this.db.track);
                }
                const trackBest = this.db.get_trackbest(car.model, this.db.track);
                if (data[1] > trackBest) {
                    tools.sendChat(data[0], `You are the fastest with ${car.model}!\n${tools.msToTime(data[1])}`, this.client);
                    tools.broadcastChat(data[0], `${car.username} is the fastest with ${car.model}!\n${tools.msToTime(data[1])}`, this.client);
                    this.db.update_trackbest(car, data[1], this.db.track);
                }
            }
        };
        commands[protocols.CHAT] = {
            query: ['uint8', 'strw'],
            execute: (data) => {
                if (data[1][0] !== '/') return;
                const cmd = data[1].slice(1);
                const car = this.db.get_car(data[0]);
                switch (cmd) {
                    case 'help':
                        tools.sendChat(data[0], 'Commands: /help, /mybest, /trackbest', this.client);
                        break;
                    case 'mybest':
                        var best = tools.msToTime(this.db.get_userbest(car.guid, car.model, this.db.track));
                        tools.sendChat(data[0], `Your best laptime with ${car.model}: ${best}`, this.client);
                        break;
                    case 'trackbest':
                        var best = tools.msToTime(this.db.get_trackbest(car.model, this.db.track));
                        tools.sendChat(data[0], `Track best laptime with ${car.model}: ${best}`, this.client);
                }
            }
        }
        commands[protocols.SESSION_INFO] = {
            query: [['Buint8', 4], 'strw', 'str'],
            execute: (data) => {
                this.db.set('server_name', data[0]);
                this.db.set('track', data[1]);
            }
        };

        this.commands = commands;
    };
    init (db, client) {
        this.db = db;
        this.client = client;
    }
    get (packet_id) {
        return this.commands[packet_id];
    }
}
module.exports = new Listeners();