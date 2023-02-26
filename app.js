const udp = require('dgram');
const buffer = require('smart-buffer').SmartBuffer;
const fs = require('fs');
const ini = require('ini');
const tool = require('./tools');
const listeners = require('./listeners');
const protocols = require('./protocols');
const db = new (require('./db')).DB();

const br = new tool.byteReader();
const client = udp.createSocket('udp4');
const server_cfg = ini.parse(fs.readFileSync('../server/cfg/server_cfg.ini', 'utf-8'));

db.init(Number(server_cfg.SERVER.MAX_CLIENTS), server_cfg.SERVER.TRACK);
listeners.init(db, client);

var temp;

client.on('message', (msg, info) => {
    const buf = buffer.fromBuffer(msg);
    const command = listeners.get(buf.readUInt8());
    if (command === undefined) return;
    // console.log(buf);
    const query = command.query;
    var data = [];
    var save;
    for (var q of query) {
        save = true;
        if (typeof q === 'string') {
            q = [q, 1]
        }
        if (q[0][0] === 'B') {
            save = false;
        }
        for (var i = 0; i < q[1]; i++) {
            switch (save ? q[0] : q[0].slice(1)) {
                case 'fle':
                    temp = buf.readFloatLE();
                    break;
                case 'uint32':
                    temp = buf.readUInt32LE();
                    break;
                case 'uint16':
                    temp = buf.readUInt16();
                    break;
                case 'uint8':
                    temp = buf.readUInt8();
                    break;
                case 'strw':
                    temp = br.readStringW(buf);
                    break;
                case 'str':
                    temp = br.readString(buf);
                    break;
            }
            if (save) data.push(temp);
        }
    }
    command.execute(data);
});
client.bind(12001);

var packet = buffer.fromSize(3);
packet.writeUInt8(protocols.GET_SESSION_INFO);
packet.writeInt16LE(-1);
client.send(packet.toBuffer(), 12000, '127.0.0.1');