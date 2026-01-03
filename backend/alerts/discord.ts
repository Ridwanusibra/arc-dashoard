import axios from 'axios';
const WEBHOOK = process.env.DISCORD_WEBHOOK!;

export async function sendAlert(message: string) {
  await axios.post(WEBHOOK, { content: message });
}