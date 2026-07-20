import fetch from 'node-fetch';
async function test() {
      const channelId = 'UC3GB6W8SyUw6IAhSuqULdGw'; // janela-da-rua-canal
      const uploadsPlaylistId = 'UU' + channelId.substring(2);
      const apiKey = process.env.YOUTUBE_API_KEY;
      const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&playlistId=${uploadsPlaylistId}&maxResults=50&key=${apiKey}`;
      const res = await fetch(url);
      const data = await res.json();
      console.log(data);
}
test();
