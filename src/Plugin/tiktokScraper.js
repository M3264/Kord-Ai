const axios = require('axios');

async function tiktokDl(url) {
    try {
        // Helper functions
        function formatNumber(integer) {
            let numb = parseInt(integer, 10);
            return Number(numb).toLocaleString().replace(/,/g, '.');
        }

        function formatDate(timestamp) {
            let date = new Date(timestamp * 1000);
            return date.toLocaleDateString('en', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: 'numeric',
                minute: 'numeric',
                second: 'numeric'
            });
        }

        // API request to get TikTok video info
        const response = await axios.post('https://www.tikwm.com/api/', {}, {
            headers: {
                'Accept': 'application/json, text/javascript, */*; q=0.01',
                'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'Origin': 'https://www.tikwm.com',
                'Referer': 'https://www.tikwm.com/',
                'Sec-Ch-Ua': '"Not)A;Brand" ;v="24" , "Chromium" ;v="116"',
                'Sec-Ch-Ua-Mobile': '?1',
                'Sec-Ch-Ua-Platform': 'Android',
                'Sec-Fetch-Dest': 'empty',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Site': 'same-origin',
                'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36',
                'X-Requested-With': 'XMLHttpRequest'
            },
            params: {
                url: url,
                count: 12,
                cursor: 0,
                web: 1,
                hd: 1
            }
        });

        const res = response.data.data;
        if (!res) {
            throw new Error("No response data received.");
        }

        // Prepare JSON data
        let json = {
            status: true,
            title: res.title || "Unknown Title",
            taken_at: formatDate(res.create_time),
            region: res.region || "Unknown Region",
            id: res.id || "Unknown ID",
            duration: res.duration || "Unknown Duration",
            cover: 'https://www.tikwm.com' + (res.cover || ""),
            size_wm: res.wm_size || "Unknown Size",
            size_nowm: res.size || "Unknown Size",
            size_nowm_hd: res.hd_size || "Unknown Size",
            data: res.images || [],
            music_info: {
                id: res.music_info?.id || "Unknown ID",
                title: res.music_info?.title || "Unknown Title",
                author: res.music_info?.author || "Unknown Author",
                album: res.music_info?.album || null,
                url: 'https://www.tikwm.com' + (res.music || res.music_info?.play || "")
            },
            stats: {
                views: formatNumber(res.play_count || 0),
                likes: formatNumber(res.digg_count || 0),
                comment: formatNumber(res.comment_count || 0),
                share: formatNumber(res.share_count || 0),
                download: formatNumber(res.download_count || 0)
            },
            author: {
                id: res.author?.id || "Unknown ID",
                fullname: res.author?.unique_id || "Unknown",
                nickname: res.author?.nickname || "Unknown",
                avatar: 'https://www.tikwm.com' + (res.author?.avatar || "")
            }
        };

        return json;
    } catch (e) {
        console.error('Error in tiktokDl function:', e.message);
        throw e;
    }
}

module.exports = { tiktokDl };