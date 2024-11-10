const axios = require('axios');
const FormData = require('form-data');
const { queryString } = require('object-query-string');

class PhotoOxyClient {
  constructor() {
    this.userAgent = 'Mozilla/5.0 (Linux; Android 9; Redmi 7A) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.99 Mobile Safari/537.36';
  }

  async #extractFormData(html) {
    const tokenMatch = /<input type="hidden" name="token" value="(.*?)" id="token">/.exec(html);
    const buildServerMatch = /<input type="hidden" name="build_server" value="(.*?)" id="build_server">/.exec(html);
    const buildServerIdMatch = /<input type="hidden" name="build_server_id" value="(.*?)" id="build_server_id">/.exec(html);

    if (!tokenMatch || !buildServerMatch || !buildServerIdMatch) {
      throw new Error('Failed to extract required form data from HTML');
    }

    return {
      token: tokenMatch[1],
      buildServer: buildServerMatch[1],
      buildServerId: buildServerIdMatch[1]
    };
  }

  async #getImageUrl(url, formData, cookie) {
    const response = await axios({
      method: 'POST',
      url,
      data: formData,
      headers: {
        'user-agent': this.userAgent,
        'cookie': cookie,
        ...formData.getHeaders()
      }
    });

    const formValueMatch = /<div.*?id = "form_value".+>(.*?)<\/div>/.exec(response.data);
    if (!formValueMatch) {
      throw new Error('Failed to extract form value from response');
    }

    const imageResponse = await axios({
      method: 'GET',
      url: 'https://photooxy.com/effect/create-image?' + queryString(JSON.parse(formValueMatch[1])),
      headers: {
        'user-agent': this.userAgent,
        'cookie': cookie
      }
    });

    return imageResponse.data.image;
  }

  async createEffect(url, text, options = {}) {
    try {
      // Initial request to get form data
      const initialResponse = await axios({
        method: 'GET',
        url,
        headers: {
          'user-agent': this.userAgent
        }
      });

      const { token, buildServer, buildServerId } = await this.#extractFormData(initialResponse.data);
      const cookie = initialResponse.headers['set-cookie']?.[0];

      if (!cookie) {
        throw new Error('No cookie received from server');
      }

      // Prepare form data
      const formData = new FormData();
      const texts = Array.isArray(text) ? text : [text];
      texts.forEach(t => formData.append('text[]', t));
      
      formData.append('submit', 'GO');
      formData.append('token', token);
      formData.append('build_server', buildServer);
      formData.append('build_server_id', buildServerId);

      // Add radio option if provided
      if (options.radio) {
        formData.append('radio0[radio]', options.radio);
      }

      // Get final image URL
      const imageUrl = await this.#getImageUrl(url, formData, cookie);
      return buildServer + imageUrl;

    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      throw new Error(`PhotoOxy API Error: ${errorMessage}`);
    }
  }
}

// Create convenience methods that match the original API
const client = new PhotoOxyClient();

const photoOxy = (url, text) => client.createEffect(url, text);
const photoOxyRadio = (url, text, radio) => client.createEffect(url, text, { radio });

module.exports = {
  PhotoOxyClient,
  photoOxy,
  photoOxyRadio
};