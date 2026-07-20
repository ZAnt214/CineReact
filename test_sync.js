import fetch from 'node-fetch';
async function test() {
      const channelId = 'UC3GB6W8SyUw6IAhSuqULdGw'; // janela-da-rua-canal
      const apiKey = process.env.YOUTUBE_API_KEY;
      const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=id&channelId=${channelId}&maxResults=50&order=date&type=video&key=${apiKey}`;
      console.log(searchUrl);
      const searchRes = await fetch(searchUrl);
      const searchData = await searchRes.json();
      console.log(searchData);
}
test();
