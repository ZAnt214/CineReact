/**
 * CSP para produção — permite mídia do YouTube e imagens externas usadas no app,
 * mantendo o restante restrito ao origin.
 */
export const CINE_REACT_CSP_DIRECTIVES = {
  defaultSrc: ["'self'"],
  baseUri: ["'self'"],
  fontSrc: ["'self'", "https:", "data:"],
  formAction: ["'self'"],
  frameAncestors: ["'self'"],
  frameSrc: [
    "'self'",
    "https://www.youtube.com",
    "https://www.youtube-nocookie.com",
  ],
  imgSrc: [
    "'self'",
    "data:",
    "blob:",
    "https://i.ytimg.com",
    "https://img.youtube.com",
    "https://yt3.ggpht.com",
    "https://yt3.googleusercontent.com",
    "https://*.googleusercontent.com",
    "https://images.unsplash.com",
    "https://image.tmdb.org",
  ],
  mediaSrc: ["'self'", "blob:", "https:"],
  objectSrc: ["'none'"],
  scriptSrc: ["'self'"],
  scriptSrcAttr: ["'none'"],
  styleSrc: ["'self'", "https:", "'unsafe-inline'"],
  connectSrc: ["'self'", "https:"],
  upgradeInsecureRequests: [] as string[],
};
