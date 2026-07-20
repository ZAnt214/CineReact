const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Replace parseISO8601Duration to also return total seconds, but let's just make a helper function
code = code.replace(
  /function parseISO8601Duration/,
  `function getDurationSeconds(durationStr: string): number {
  if (!durationStr) return 0;
  const match = durationStr.match(/PT(?:(\\d+)H)?(?:(\\d+)M)?(?:(\\d+)S)?/);
  if (!match) return 0;
  const hours = match[1] ? parseInt(match[1]) : 0;
  const minutes = match[2] ? parseInt(match[2]) : 0;
  const seconds = match[3] ? parseInt(match[3]) : 0;
  return (hours * 3600) + (minutes * 60) + seconds;
}

function parseISO8601Duration`
);

// In syncChannelVideos
code = code.replace(
  /const isProcessed = video\.status\?\.uploadStatus === 'processed';\s*if \(isPublic && isEmbeddable && isProcessed\) \{/,
  `const isProcessed = video.status?.uploadStatus === 'processed';
          const durationSec = getDurationSeconds(video.contentDetails?.duration || '');
          const isNotShort = durationSec > 60; // Filter out shorts (< 60s)

          if (isPublic && isEmbeddable && isProcessed && isNotShort) {`
);

// In searchAndSaveReacts
code = code.replace(
  /const duracao = parseISO8601Duration\(contentDetails\.duration \|\| 'PT15M00S'\);/,
  `const durationSec = getDurationSeconds(contentDetails.duration || 'PT15M00S');
          if (durationSec <= 60) continue; // Filter out shorts
          
          const duracao = parseISO8601Duration(contentDetails.duration || 'PT15M00S');`
);

fs.writeFileSync('server.ts', code);
