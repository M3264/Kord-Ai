// CJS

const axios = require('axios');
const cheerio = require('cheerio');
const https = require('https');

// User agents
const ua = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:66.0) Gecko/20100101 Firefox/66.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36 Edg/111.0.1661.62',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/111.0'
];

// Random User Agent selection
function gua() {
    return ua[Math.floor(Math.random() * ua.length)];
}

// Result class
class GS {
    constructor(url, title, description) {
        this.url = url;
        this.title = title;
        this.description = description;
    }
}

// Modified GoogleSearch class with default parameters
class GoogleSearch {
    constructor({ lang = 'id', timeout = 5000, safe = 'active', sslVerify = true } = {}) {
        this.lang = lang;
        this.timeout = timeout;
        this.safe = safe;
        this.sslVerify = sslVerify;
    }

    // Internal request function
    async _req(query, num, start, proxy, region) {
        const response = await axios.get('https://www.google.com/search', {
            headers: {
                'User-Agent': gua(),
            },
            params: {
                q: query,
                num: num + 2, // Fetch extra results
                hl: this.lang,
                start,
                safe: this.safe,
                gl: region,
            },
            httpsAgent: proxy ? new https.Agent({ rejectUnauthorized: this.sslVerify }) : null,
            timeout: this.timeout,
        });
        return response.data;
    }

    // Main search function
    async search(query, num = 10, proxy = null, sleepInterval = 0, region = null) {
        let start = 0;
        let result = [];
        let totalResults = 0;

        while (totalResults < num) {
            const html = await this._req(query, num - totalResults, start, proxy, region);
            const $ = cheerio.load(html);
            const resultBlock = $('div.g');
            let newResults = 0;

            resultBlock.each((_, element) => {
                const link = $(element).find('a').attr('href');
                const title = $(element).find('h3').text();
                const description = $(element).find('div[style="-webkit-line-clamp:2"]').text();

                if (link && title && description) {
                    result.push(new GS(link, title, description));
                    totalResults++;
                    newResults++;

                    if (totalResults >= num) {
                        return false;
                    }
                }
            });

            if (newResults === 0) {
                break;
            }

            start += 10;
            await new Promise(res => setTimeout(res, sleepInterval)); // Sleep if interval is set
        }

        return result;
    }
}

module.exports = GoogleSearch;