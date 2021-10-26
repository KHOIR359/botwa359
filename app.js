const qrcode = require('qrcode-terminal');
const helper = require('./helper')
const base64ToImage = require('base64-to-image');
const fs = require('fs');
const { Client, MessageMedia } = require('whatsapp-web.js');
// Path where the session data will be stored
const SESSION_FILE_PATH = './session.json';
const puppeteer = require('puppeteer');


const opn = require('opn');
// opens the url in the default browser 
// Load the session data if it has been previously saved
let sessionData;
if (fs.existsSync(SESSION_FILE_PATH)) {
    sessionData = require(SESSION_FILE_PATH);
}

// Use the saved values
const client = new Client({
    // puppeteer: { headless: false },
    session: sessionData
});

// Save session values to the file upon successful auth
client.on('authenticated', (session) => {
    sessionData = session;
    fs.writeFile(SESSION_FILE_PATH, JSON.stringify(session), (err) => {
        if (err) {
            console.error(err);
        }
    });
});

client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
});


let gformBrowser = {}

let pdfStatus = {};
client.on('message', async message => {
    // console.log(message.links[0].link);

    if (message.links[0] && message.links[0].link.includes('form') && message.body.toLowerCase().includes('absensi')) {
        const img = await helper.fillGform(message);
        message.reply(MessageMedia.fromFilePath(img))
        client.sendMessage(id, 'Form telah terisi')
    }

    const msg = message.body.split(' ')
    const cmd = msg[0]
    const links = message.links
    const id = message.id.remote;

    console.log('\n\npesan: ', message.body);
    console.log('cmd: ', cmd);
    console.log('from: ', message.from);
    console.log('time: ', new Date(message.timestamp * 1000));
    fs.appendFileSync('./log.txt', JSON.stringify(message) + '\n');

    if (cmd === '/open' && links[0]) {
        console.log('opening', links[0].link)
        opn(links[0].link);
    }

    if (cmd == '/pdf' && msg[1] == 'start') {
        pdfStatus[id] = 0;
        message.reply('Kirimkan gambar untuk dikonversikan ke pdf')
    }
    if (cmd == '/pdf' && msg[1] == 'reset') {
        helper.createFolder('./pdf/unconverted/' + id)
        helper.createFolder('./pdf/converted/' + id)

        helper.deleteAllFilesInFolder('./pdf/unconverted/' + id)
        if (id == '6288216783065@c.us') {
            helper.deleteAllFilesInFolder('./pdf/converted/' + id)
        }
        message.reply(`folder ${id} telah direset`)
    }
    if (cmd == '/pdf' && msg[1] == 'finish' && msg[2]) {
        pdfStatus[id] = false;
        helper.finishPdf(id, msg[2])
        message.reply(MessageMedia.fromFilePath('./pdf/converted/' + id + '/' + msg[2] + '.pdf', { caption: 'Finished' }))
    }


    //  /gform command


    async function screenshot(submit = false) {
        const { page, i } = gformBrowser[id];
        if (!submit) {
            await page.waitForSelector(`.freebirdFormviewerViewNumberedItemContainer:nth-child(${i})`)
            await page.evaluate(i => {
                const scrollableSection = document.querySelector(`.freebirdFormviewerViewNumberedItemContainer:nth-child(${i})`);
                window.scrollTo(0, scrollableSection.offsetTop);
            }, i)
        }
        await page.screenshot({
            path: `./screenshot/gformlive/${id}.jpg`,
            type: 'jpeg',
            quality: 70
        });
        message.reply(MessageMedia.fromFilePath(`./screenshot/gformlive/${id}.jpg`));
    }

    if (cmd == '/gform' && msg[1] == 'start' && msg[2]) {
        gformBrowser[id] = {}
        gformBrowser[id].page = await helper.googleForm(message);
        gformBrowser[id].i = 1;

        screenshot()
    }

    async function getPrefill() {
        let { page, i } = gformBrowser[id];

        const prefill = await page.evaluate(_ => {

            let param = '?'
            let paramData = []
            let loaddata = JSON.parse(document.body.querySelector('script').innerHTML.replace('var FB_PUBLIC_LOAD_DATA_ = ', '').replace(';', ''))
            let entries = loaddata[1][1]
            for (const entry of entries) {
                if (entry[4]) {

                    name = 'entry.' + entry[4][0][0];
                    first_value = 'value'
                    if (entry[4][0][1]) {
                        first_value = entry[4][0][1][0][0];
                    }
                    newData = {
                        name: name,
                        value: first_value.replace(/\s/gi, '+')
                    }
                    paramData.push(newData)
                }
            }
            paramData.forEach((e, i) => {
                param += e.name + '=' + e.value
                if (i < paramData.length - 1) {
                    param += '&'
                }
            })
            id = window.location.pathname.split('/')[4];
            let url = `https://docs.google.com/forms/d/e/${id}/viewform${param}`;

            return url
        })
    }
    async function nextQuestion(ss = false) {
        let { page, i } = gformBrowser[id];

        const maxPage = await page.evaluate(_ => {
            return document.querySelectorAll(`.freebirdFormviewerComponentsQuestionBaseRoot`).length;
        })
        console.log(maxPage)
        if (gformBrowser[id].i > maxPage) {
            message.reply(`Cannot go to next question`)
        } else {
            ++gformBrowser[id].i;
            if (ss) {
                screenshot()
            }
        }
    }

    function previousQuestion(ss = false) {
        if (gformBrowser[id].i < 1) {
            message.reply(`Cannot go to previous question`)
        } else {
            --gformBrowser[id].i;
            if (ss) {
                screenshot()
            }
        }
    }

    async function gotoQuestion(qNo) {
        let { page, i } = gformBrowser[id];

        const maxPage = await page.evaluate(_ => {
            return document.querySelectorAll(`.freebirdFormviewerComponentsQuestionBaseRoot`).length;
        })
        if (qNo < maxPage) {
            message.reply(`there are only ${maxPage} questions`)
        } else if (qNo > 1) {
            message.reply(`there are only ${maxPage} questions`)
        } else {
            gformBrowser[id].i = qNo;
        }
    }
    if (cmd == '/gform' && msg[1] == 'quiz' && msg[2]) {
        switch (msg[2]) {
            case 'previous':
                previousQuestion(true)
                break;
            case 'next':
                nextQuestion(true)
                break;
            default:
                gotoQuestion(msg[2])
                break;
        }
    }

    async function nextPage() {
        let { page, i } = gformBrowser[id];
        await page.click('.freebirdFormviewerViewNavigationNoSubmitButton')
        gformBrowser[id].i = 1;
        screenshot()
    }

    async function submitGform() {
        let { page, i } = gformBrowser[id];
        await page.click('.freebirdFormviewerViewNavigationSubmitButton')
        screenshot(true)

    }

    if (cmd == '/gform' && msg[1] == 'page' && msg[2]) {
        switch (msg[2]) {
            case 'submit':
                submitGform()
                break;
            case 'next':
                nextPage()
                break;
            default:
                gotoQuestion(msg[2])
                break;
        }
    }

    if (cmd == '/gform' && msg[1] == 'answer' && msg[2]) {
        let { page, i } = gformBrowser[id];
        await page.focus(`.freebirdFormviewerViewNumberedItemContainer:nth-child(${i}) input, .freebirdFormviewerViewNumberedItemContainer:nth-child(${i}) .quantumWizMenuPaperselectOption `)
        await page.type(`.freebirdFormviewerViewNumberedItemContainer:nth-child(${i}) input, .freebirdFormviewerViewNumberedItemContainer:nth-child(${i}) .quantumWizMenuPaperselectOption `, message.body.replace('/gform answer ', ''))
        screenshot()
        nextQuestion()
    }

    if (cmd == '/gform' && msg[1] == 'choice' && msg[2]) {
        let { page, i } = gformBrowser[id];
        let choice = 0;
        switch (msg[2].toLowerCase()) {
            case 'a':
                choice = 1
                break;
            case 'b':
                choice = 2
                break;
            case 'c':
                choice = 3
                break;
            case 'd':
                choice = 4
                break;
            case 'e':
                choice = 5
                break;
        }
        const questions = await page.$$(`.freebirdFormviewerComponentsQuestionBaseRoot .freebirdFormviewerComponentsQuestionRadioChoice:nth-child(${choice}) > label `)
        await questions[i - 1].click()
            // await page.click(`.freebirdFormviewerViewNumberedItemContainer:nth-child(${i}) .freebirdFormviewerComponentsQuestionBaseRoot .freebirdFormviewerComponentsQuestionRadioChoice:nth-child(${choice}) > label `)
        screenshot()
        nextQuestion()
    }



    if ((pdfStatus[id]) > -1 && message.hasMedia && message.type == 'image') {
        const media = await message.downloadMedia();
        const dataurl = 'data:image/png;base64, ' + media.data;
        const path = './pdf/unconverted/' + id + '/';
        helper.createFolder(path)

        let optionalObj = { 'fileName': pdfStatus[id], 'type': 'png' };
        let result = base64ToImage(dataurl, path, optionalObj)

        console.log(result)

        message.reply(pdfStatus[id] + '.png telah masuk')
        pdfStatus[id]++
    }

    // message.reply('')
    // client.sendMessage(message.id.remote, '')
});

client.on('ready', async() => {
    console.log('Client is ready!');
});

client.initialize();