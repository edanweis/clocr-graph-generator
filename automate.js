const puppeteer = require("puppeteer-extra")
const UserPreferencesPlugin = require("puppeteer-extra-plugin-user-preferences");
const downloadImageDirectoryPath = '/media/edanweis/NewWindows/clocr';
const { executablePath } = require('puppeteer')

puppeteer.use(
    UserPreferencesPlugin({
        userPrefs: {
            download: {
                prompt_for_download: false,
                open_pdf_in_system_reader: true,
                default_directory: downloadImageDirectoryPath,
                // automatic_downloads: 1,
            },
            plugins: {
                always_open_pdf_externally: true,
            },
            // disable allow-multiple-downloads popup
            profile: {
                default_content_setting_values: {
                    automatic_downloads: 1,
                },
            },
        },
    })
);


(async () => {
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        executablePath: executablePath(),
        args: [
            '--enable-parallel-downloading'
        ]
    });
    const page = await browser.newPage();

    await page.goto('http://localhost:5173');
    await page.waitForTimeout(5000)

    // click 10 times
    for (let i = 0; i < 10000; i++) {
        await page.click('#random')
        await page.waitForTimeout(700)
        // await page.on('response', (response) => { console.log(response, response._url) })
    }
    await browser.close();
})();

