const puppeteer = require('puppeteer');

(async() => {
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
    await page2.goto('https://forms.gle/4LuaPs9HXm2HxpWQ6');
    await page2.click('[tabindex="0"]');
    await page2.waitFor(1000)
    await page2.waitFor(1000)

    await page2.type('.freebirdFormviewerViewNumberedItemContainer:nth-child(2) input', 'Abdul Khoir', 3000);
    await page2.type('.freebirdFormviewerViewNumberedItemContainer:nth-child(3) input', '1', 3000);
    await page2.click(`.freebirdFormviewerViewNumberedItemContainer:nth-child(4) .freebirdFormviewerComponentsQuestionRadioChoice:nth-child(14)`);
    await page2.click(`.freebirdFormviewerViewNumberedItemContainer:nth-child(5) .freebirdFormviewerComponentsQuestionRadioChoice:nth-child(1)`);
    await page2.click(`.freebirdFormviewerViewNavigationSubmitButton`);

})();