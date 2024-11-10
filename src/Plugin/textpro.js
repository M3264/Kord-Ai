const fetch = require('node-fetch');
const FormData = require('form-data');

async function textpro(url, text) {
    // Debug logging
    const debug = true;
    const log = (...args) => debug && console.log('[Debug]', ...args);

    try {
        // Initial request
        log('Making initial request to:', url);
        const response = await fetch(url);
        const html = await response.text();
        
        // Extract token
        log('Extracting token...');
        const tokenMatch = html.match(/name="token".*?value="(.*?)"/);
        if (!tokenMatch) {
            throw new Error('Token not found');
        }
        const token = tokenMatch[1];
        log('Token found:', token);

        // Get cookies
        const cookies = response.headers.get('set-cookie');
        log('Cookies received:', cookies ? 'Yes' : 'No');

        // Create minimal form data
        log('Creating form data...');
        const form = new FormData();
        form.append('text[]', text);
        form.append('token', token);
        form.append('build_server', 'https://textpro.me');
        form.append('build_server_id', '1');
        
        log('Submitting form...');
        const submitResp = await fetch(url, {
            method: 'POST',
            headers: {
                'Cookie': cookies,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                ...form.getHeaders()
            },
            body: form
        });

        log('Form submission status:', submitResp.status);
        const submitHtml = await submitResp.text();
        
        // Extract form value
        log('Extracting form value...');
        const formValueMatch = submitHtml.match(/id="form_value">(.*?)<\/div>/);
        if (!formValueMatch) {
            log('Form HTML excerpt:', submitHtml.substring(0, 200));
            throw new Error('Form value not found');
        }

        let formValue;
        try {
            formValue = JSON.parse(formValueMatch[1]);
            log('Form value parsed successfully');
        } catch (e) {
            log('Raw form value:', formValueMatch[1]);
            throw new Error('Failed to parse form value');
        }

        // Create image
        log('Creating image...');
        const createResp = await fetch('https://textpro.me/effect/create-image', {
            method: 'POST',
            headers: {
                'Cookie': cookies,
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept': 'application/json'
            },
            body: new URLSearchParams(formValue)
        });

        log('Image creation status:', createResp.status);
        const result = await createResp.json();
        log('Server response:', JSON.stringify(result));

        if (!result.success) {
            throw new Error(result.info || 'Image creation failed');
        }

        const finalUrl = 'https://textpro.me' + result.fullsize_image;
        log('Success! Final URL:', finalUrl);
        return finalUrl;

    } catch (error) {
        log('Error occurred:', error.message);
        if (error.response) {
            log('Response data:', error.response.data);
        }
        throw error;
    }
}

// Example usage
async function test() {
    try {
        const url = 'https://textpro.me/create-neon-light-blackpink-logo-text-effect-online-710.html';
        console.log('Starting...');
        const result = await textpro(url, 'test');
        console.log('Result:', result);
    } catch (error) {
        console.error('Error:', error.message);
    }
}

module.exports = textpro;