const protocols = require('./protocols');
const tools = require('./tools');
const buffer = require('smart-buffer').SmartBuffer;

class Listeners {
    constructor () {
        var commands = {};
        commands[protocols.NEW_CONNECTION] = {
            query: [['strw', 2], 'uint8', 'str'],
            execute: (data) => {
                this.db.update_car(...data);
            }
        }
        commands[protocols.CLIENT_LOADED] = {
            query: ['uint8'],
            execute: (data) => {
                tools.sendChat(data[0], 'Welcome!', this.client);
                tools.sendChat(data[0], `Your best laptime: ${tools.msToTime(this.db.get_personalbest(data[0]))}`, this.client);
                tools.sendChat(data[0], 'Need help? Send !help', this.client);
            }
        };
        commands[protocols.CONNECTION_CLOSED] = {
            query: [['bstrw', 2], 'uint8'],
            execute: (data) => {
                this.db.reset_car(data[0]);
            }
        }
        commands[protocols.LAP_COMPLETED] = {
            query: ['uint8', 'uint32', 'uint8'],
            execute: (data) => {
                if (data[2] !== 0) return;
                const personalBest = this.db.get_personalbest(data[0]);
                if (data[1] > personalBest || personalBest === 0) {
                    tools.sendChat(data[0], `You broke your best record!\n${tools.msToTime(data[1])}`, this.client);
                    this.db.update_personalbest(data[0], data[1]);
                }
                const car = this.db.get_car(data[0]);
                const trackBest = this.db.get_trackbest(data[0]);
                if (data[1] > trackBest || trackBest === 0) {
                    tools.sendChat(data[0], `You are the fastest with ${car.model}!\n${tools.msToTime(data[1])}`, this.client);
                    tools.broadcastChat(`${car.username} is the fastest with ${car.model}!\n${tools.msToTime(data[1])}`, this.client);
                    this.db.update_trackbest(data[0], data[1]);
                }
            }
        };
        commands[protocols.CHAT] = {
            query: ['uint8', 'strw'],
            execute: (data) => {
                if (data[1][0] !== '!') return;
                const cmd = data[1].slice(1);
                const car = this.db.get_car(data[0]);
                switch (cmd) {
                    case 'help':
                        tools.sendChat(data[0], 'Commands: !help, !mybest, !trackbest', this.client);
                        break;
                    case 'mybest':
                        const best = this.db.get_personalbest(data[0]);
                        if (best === 0) tools.sendChat(data[0], `You haven't set your record yet with ${car.model}`, this.client);
                        else tools.sendChat(data[0], `Your best laptime with ${car.model}: ${tools.msToTime()}`, this.client);
                        break;
                    case 'trackbest':
                        const trackbest = this.db.get_trackbest(data[0]);
                        if (trackbest === 0) tools.sendChat(data[0], `Anyone hasn't set a record yet with ${car.model}`);
                        else tools.sendChat(data[0], `Track best laptime with ${car.model}: ${tools.msToTime(trackbest.laptime)} by ${trackbest.username}`, this.client);
                        break;
                }
            }
        };
        commands[protocols.SESSION_INFO] = {
            query: [['Buint8', 4], 'strw'],
            execute: (data) => {
                this.db.set('server_name', data[0]);
                var packet;
                for (var i = 0; i < this.db.max_cars; i++) {
                    packet = buffer.fromSize(2)
                    packet.writeUInt8(protocols.GET_CAR_INFO);
                    packet.writeUInt8(i);
                    this.client.send(packet.toBuffer(), 12000, '127.0.0.1');
                }
            }
        };
        commands[protocols.NEW_SESSION] = {
            query: commands[protocols.SESSION_INFO].query,
            execute: commands[protocols.SESSION_INFO].execute
        };
        commands[protocols.CAR_INFO] = {
            query: [['uint8', 2], 'strw', 'Bstrw', 'strw', 'Bstrw', 'strw'],
            execute: (data) => {
                if (data[1] === 1) this.db.update_car(data[3], data[4], data[0], data[2]);
            }
        };
        this.commands = commands;
    }
    init (db, client) {
        this.db = db;
        this.client = client;
    }
    get (packet_id) {
        return this.commands[packet_id];
    }
}
module.exports = new Listeners();