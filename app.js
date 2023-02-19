const udp = require('dgram');
const buffer = require('smart-buffer').SmartBuffer;
const tool = require('./tools');
const listeners = require('./listeners');
var db = require('./db').DB;
const protocols = require('./protocols');

const br = new tool.byteReader();
const client = udp.createSocket('udp4');

var db = new db();

listeners.init(db, client);


client.on('message', (msg, info) => {
    const buf = buffer.fromBuffer(msg);
    const command = listeners.get(buf.readUInt8());
    if (command === undefined) return;
    console.log(buf)
    const query = command.query;
    var data = [];
    var save;
    var temp;
    for (var q of query) {
        save = true;
        if (typeof q === 'string') {
            q = [q, 1]
        }
        if (q[0][0] !== 'B') {
            save = false;
        }
        for (var i = 0; i < repeat; i++) {
            switch (save ? q[0] : q[0].slice(1)) {
                case 'fle':
                    temp = buffer.readFloatLE();
                    break;
                case 'uint32':
                    temp = buffer.readUInt32LE();
                    break;
                case 'uint16':
                    temp = buffer.readUInt16();
                    break;
                case 'uint8':
                    temp = buffer.readUInt8();
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

for (var i = 0; i < 32; i++) {
    packet = buffer.fromSize(2)
    packet.writeUInt8(protocols.GET_CAR_INFO);
    packet.writeUInt8(i);
    client.send(packet.toBuffer(), 12000, '127.0.0.1');
}