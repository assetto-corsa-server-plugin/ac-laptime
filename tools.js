const buffer = require('smart-buffer').SmartBuffer;
const fs = require('fs');
const config = require('./config');
const protocols = require('./protocols');

class byteReader {
    readString (buf, offset=0) {
        return buf.readString(buf.readUInt8() + offset);
    }
    readStringW (buf, offset=0) {
        return buf.readString(buf.readUInt8() * 4 + offset, 'UTF-16LE').replace(/\u0000/gi, '');
    }
    writeStringW (str) {
        str = ('' + str).slice(0, 255);
        const packet = buffer.fromSize((str.length * 4) + 1);
        packet.writeUInt8(str.length, 0);
        packet.writeString(str.split('').join('\u0000') + '\u0000', 1, 'UTF-16LE');
        return packet.toBuffer();
    }
}

const br = new byteReader();

module.exports = {
    msToTime: function (time) {
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
        return '0'.repeat(Number(count) - number.length) + number;
    },
    broadcastChat: function(text, client) {
        const temp = br.writeStringW(text);
        const packet = buffer.fromSize(temp.length + 1);
        packet.writeUInt8(protocols.BROADCAST_CHAT, 0);
        packet.writeBuffer(temp, 1);
        client.send(packet.toBuffer(), 12000, '127.0.0.1');
    },
    sendChat: function (car_id, text, client) {
        const temp = br.writeStringW(text);
        const packet = buffer.fromSize(temp.length + 2);
        packet.writeUInt8(protocols.SEND_CHAT, 0);
        packet.writeUInt8(car_id, 1);
        packet.writeBuffer(temp, 2);
        client.send(packet.toBuffer(), 12000, '127.0.0.1');
    },
    getContents: function (type) {
        const files = fs.readdirSync(config.contents[type]);
        var data = {};
        for (const file of files) {
            try {
                data[file] = JSON.parse(fs.readFileSync(path + '/' + file + `/ui/ui_${type}.json`, 'utf8')).name;
            } catch {
                data[file] = file[0].toUpperCase() + file.slice(1);
            }
        }
        return data;
    },
    byteReader: byteReader
}