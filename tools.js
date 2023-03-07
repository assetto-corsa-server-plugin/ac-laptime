const fs = require('fs');
const config = require('./config');
const http = require('http');

module.exports = {
    msToTime: function (time) {
        time = time || 0;
        const ms = time % 1000;
        time -= ms
        time /= 1000;
        const s = time % 60;
        time -= s;
        time /= 60;
        return `${time}:${this.addZero(s, 2)}.${this.addZero(ms, 3)}`;
    },
    addZero: function (number, count) {
        number = String(number);
        return (number.length !== 0 ? '0'.repeat(Number(count) - number.length) : '') + number;
    },
    getCarName: function (car) {
        try {
            return JSON.parse(fs.readFileSync(config.contents.car + '/' + car + `/ui/ui_car.json`, 'utf8').replace(/[^ !-~]+/g,'').replace(/\s+/g, ' ')).name;
        } catch {
            return car
        }
    },
    getTrackName: function (track) {
        try {
            return JSON.parse(fs.readFileSync(config.contents.track + '/' + track + `/ui/ui_track.json`, 'utf8').replace(/[^ !-~]+/g,'').replace(/\s+/g, ' ')).name;
        } catch {
            return track
        }
    },
    httpRequest: {
        post: (url, data) => {
            var options = {}
            const postData = JSON.stringify(data);
            options.hostname = config.db.host;
            options.port = config.db.port;
            options.path = url;
            options.method = 'POST';
            options.headers = {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData),
            };
            const req = http.request(options, (res) => {});
            req.write(postData);
            req.end();
        },
        get: (url, callback) => {
            var options = {}
            options.hostname = config.db.host;
            options.port = config.db.port;
            options.path = url;
            options.method = 'GET';
            options.headers = {
                'Content-Type': 'application/json'
            };
            http.get(options, (res) => {
                const chunks = [];
                res.on('data', (data) => chunks.push(data));
                res.on('end', () => {
                    const jsondata = Buffer.concat(chunks).toString();
                    const data = JSON.parse(jsondata === '' ? '{}' : jsondata);
                    callback(data);
                })
            });
        },
    },
    getContents: function (type) {
        const files = fs.readdirSync(config.contents[type]);
        var data = {};
        for (const file of files) {
            try {
                data[file] = JSON.parse(fs.readFileSync(config.contents[type] + '/' + file + `/ui/ui_${type}.json`, 'utf8').replace(/[^ !-~]+/g,'').replace(/\s+/g, ' ')).name;
            } catch {
                data[file] = file[0].toUpperCase() + file.slice(1);
            }
        }
        return data;
    },
}