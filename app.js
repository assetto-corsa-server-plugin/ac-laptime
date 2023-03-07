const server = require('acserver-plugin');
const ini = require('ini');
const fs = require('fs');
const config = require('./config');
const tools = require('./tools');

const db = new (require('./db')).DB()
const app = new server.PluginApp();
const protocols = server.PROTOCOLS;

const server_cfg = ini.parse(fs.readFileSync(config.server_cfg, 'utf-8'));

db.init(Number(server_cfg.SERVER.MAX_CLIENTS), server_cfg.SERVER.TRACK);


app.on(protocols.NEW_CONNECTION, (data) => {
    db.update_car(data.name, data.guid, data.car_id, data.model); 
});
app.on(protocols.CLIENT_LOADED, (data) => {
    app.sendChat(data.car_id, 'Welcome!');
    const personalBest = db.get_personalbest(data.car_id);
    if (personalBest) app.sendChat(data.car_id, `Your best laptime: ${tools.msToTime(personalBest)}`);
    app.sendChat(data.car_id, 'Need help? Send !help');
});
app.on(protocols.CONNECTION_CLOSED, (data) => {
    db.reset_car(data.car_id);
});
app.on(protocols.LAP_COMPLETED, (data) => {
    if (data.cuts !== 0) return;
    const personalBest = db.get_personalbest(data.car_id);
    if (data.laptime > personalBest || personalBest === 0) {
        app.sendChat(data.car_id, `You broke your best record!\n${tools.msToTime(data.laptime)}`);
        db.update_personalbest(data.car_id, data.laptime);
    }
    const trackBest = db.get_trackbest(data.car_id);
    if (data.laptime > trackBest.laptime || trackBest.laptime === 0) {
        const car = db.get_car(data.car_id);
        app.sendChat(data.car_id, `You are the fastest with ${db.carnames[car.model]}!\n${tools.msToTime(data.laptime)}`);
        app.broadcastChat(`${car.username} is the fastest with ${db.carnames[car.model]}!\n${tools.msToTime(data.laptime)}`);
        db.update_trackbest(data.car_id, data.laptime);
    }
});

app.on(protocols.CHAT, (data) => {
    if (data.message[0] !== '!') return;
    const cmd = data.message.slice(1);
    const car = db.get_car(data.car_id);
    switch(cmd) {
        case 'help':
            app.sendChat(data.car_id, 'Commands: !help, !mybest, !trackbest');
            break;
        case 'mybest':
            const personalbest = db.get_personalbest(data.car_id);
            if (personalbest === 0) app.sendChat(data.car_id, `You haven't set your record yet with ${db.carnames[car.model]}`);
            else app.sendChat(data.car_id, `Your best laptime with ${db.carnames[car.model]}: ${tools.msToTime(personalbest)}`);
            break;
        case 'trackbest':
            const trackbest = db.get_trackbest(data.car_id);
            if (trackbest === 0) app.sendChat(data.car_id, `Anyone hasn't set a record yet with ${db.carnames[car.model]}`);
            else app.sendChat(data.car_id, `Track best laptime with ${db.carnames[car.model]}: ${tools.msToTime(trackbest.laptime)} by ${trackbest.username}`);
            break;
    }
    
});
app.on(protocols.SESSION_INFO, (data) => {
    db.set('server_name', data.server_name);
    for (var i = 0; i < db.max_cars; i++) app.getCarInfo(i);
});
app.on(protocols.NEW_SESSION, app.listeners[String(protocols.SESSION_INFO)]);
app.on(protocols.CAR_INFO, (data) => {
    if (!Object.keys(db.carnames).includes(data.model)) db.carnames[data.model] = tools.getCarName(data.model);
    if (data.connected) db.update_car(data.name, data.guid, data.car_id, data.model);
});

app.run();
app.getSessionInfo(-1)