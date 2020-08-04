const fs = require('fs');

let rawdata = fs.readFileSync('data.json');
let student = JSON.parse(rawdata);


const qrcode = require('qrcode-terminal');

const {
    Client
} = require('whatsapp-web.js');
const client = new Client();

client.on('qr', qr => {
    qrcode.generate(qr, {
        small: true
    });
});

client.on('ready', () => {
    console.log('Client is ready!');
});

let a = [];
let header = '';
client.on('message', msg => {
    const input = msg.body.split(' ')
    const command = input[0];
    executeCommand(command, input, msg)
});

function removeItemOnce(arr, value) {
    var index = arr.indexOf(value);
    if (index > -1) {
        arr.splice(index, 1);
    }
    return arr;
}


function addFunction(input, msg) {
    for ([i, inp] of input.entries()) {
        if (i == 0) {
            continue
        }

        a.push(inp);
    }
    console.log(a)
    printNama(msg);
}

function removeFunction(input, msg) {
    for ([i, inp] of input.entries()) {
        if (i == 0) {
            continue
        }

        a = removeItemOnce(a, inp);
    }
    console.log(a)
    printNama(msg);
}

function setHeader(input, msg) {
    header = input.join(' ');
    printNama(msg);
}

function responBot(input, msg) {
    if(input[1] == 'lemot'){
        msg.reply('samtay donc amjinc')
    }
    if(input[1] == 'baik'){
        msg.reply('ngomong doang, ngisi pulsa kagak pernah')
    }
}

const commandList = [{
    'command': 'add359',
    'f': addFunction
}, {
    'command': 'remove359',
    'f': removeFunction
}, {
    'command': 'header359',
    'f': setHeader
}, {
    'command':'bot',
    'f':responBot
}]


function executeCommand(command, input, msg) {
    commandList.forEach((e, i) => {
        if (command == e.command) {
            e.f(input, msg)
        }
    })
}

function printNama(msg) {
    let message = `${header}\n`;
    for ([i, stud] of student.entries()) {
        let ada = false;
        for (const valuea of a) {
            if ((i + 1).toString() == valuea) {
             ada = true;   
            }
        }
        if (ada) {
            message += `${i+1}. ${stud['nama']} \n`;
        } else {
            message += `${i+1}. \n`;
        }
    }
    msg.reply(message)
}

client.initialize();