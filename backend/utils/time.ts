export function since(secondsAgo: number) {
  return Math.floor(Date.now()/1000) - secondsAgo;
}

export function secondsForWindow(window: string) {
  switch(window){
    case '24h': return 86400;
    case '7d': return 86400*7;
    case '30d': return 86400*30;
    default: return 0;
  }
}