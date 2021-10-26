const fs = require('fs');
const path = require('path');
const imagesToPdf = require("images-to-pdf")
const $a = 'abda';
const deleteAllFilesInFolder = (dir) => {
    fs.readdir(dir, (err, files) => {
        if (err) throw err;

        for (const file of files) {
            fs.unlink(path.join(dir, file), err => {
                if (err) throw err;
            });
        }
    });
    console.log('successfully deleted')

}

const imageFilter = function(req, file, cb) {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG|gif|GIF)$/)) {
        req.fileValidationError = 'Only image files are allowed!';
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
const $b = 'sabit';

const getAllUploadedFiles = (key) => {
    let files = fs.readdirSync('./pdf/unconverted/' + key);
    return files.map(filename => `./pdf/unconverted/${key}/${filename}`);
}

const createFolder = (dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }
}

const finishPdf = async(id, name) => {
    const files = getAllUploadedFiles(id);
    console.log(files)
    createFolder('./pdf/converted/' + id)
    await imagesToPdf(files, './pdf/converted/' + id + '/' + name + '.pdf');
}

const puppeteer = require('puppeteer');

const fillGform = async(message) => {
    const link = message.links[0].link;
    const id = message.id.remote;
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.goto('https://accounts.google.com');
    await page.type('input[type=email]', 'abdulkhoir53')
    await page.click('button[jsaction*="click:"]')
    await page.waitFor(1500)
    await page.type('input[name="password"]', 'abdaabdasabit2')
    await page.click('button[jsaction*="click:"]')
    await page.waitFor(2000)
    const page2 = await browser.newPage();
    await page2.goto(link);
    createFolder(`./screenshot/gform/`)
    try {
        await page2.click('[tabindex="0"]');

    } catch (err) {
        await page2.screenshot({
            path: `./screenshot/gform/${id}.jpg`,
            type: 'jpeg',
            quality: 70
        });
        await browser.close()
        return `./screenshot/gform/${id}.jpg`;
    }
    await page2.waitFor(1000)
    await page2.type('[required]', 'Abdul Khoir');
    await page2.waitFor(1000)

    await page2.type('.freebirdFormviewerViewNumberedItemContainer:nth-child(3) input', '1', 3000);
    await page2.click(`.freebirdFormviewerViewNumberedItemContainer:nth-child(4) .freebirdFormviewerComponentsQuestionRadioChoice:nth-child(14)`);
    await page2.click(`.freebirdFormviewerViewNumberedItemContainer:nth-child(5) .freebirdFormviewerComponentsQuestionRadioChoice:nth-child(1)`);
    await page2.click(`.freebirdFormviewerViewNavigationSubmitButton`);
    await page2.waitFor(2000)
    await page2.screenshot({
        path: `screenshot/gform/${id}.pjg`,
        type: 'jpeg',
        quality: 70
    });
    await browser.close()
    return `./screenshot/gform/${id}.jpg`;
}

const googleForm = async(message) => {
    const link = message.links[0].link;
    const id = message.id.remote;
    const browser = await puppeteer.launch({ headless: false });
    // const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto('https://accounts.google.com');
    await message.reply('mencoba login sebagai abdul khoir')
    await page.waitFor(1500)
    await page.type('input[type=email]', 'abdulkhoir53')
    await page.click('button > span')
    await page.waitFor(1500)
    await page.type('input[name="password"]', $a + $a + $b + '2')
    await page.click('button > span')
    await page.waitFor(2000)
    const page2 = await browser.newPage();
    await message.reply('Login berhasil!')
    await page2.goto(link);
    return page2;
}



module.exports = { deleteAllFilesInFolder, getAllUploadedFiles, createFolder, imageFilter, finishPdf, fillGform, googleForm }