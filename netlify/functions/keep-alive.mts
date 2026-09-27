/**
 * Keeps the Render backend and the Neon database awake during opening hours.
 *
 * This replaces a GitHub Actions cron that looked fine but was not: measured
 * over 12 days in production it fired 40 times against ~980 scheduled — 5% —
 * with a median gap of 5.4 hours between pings. Every run succeeded; GitHub
 * simply never started the rest. Render sleeps after 15 minutes idle, so the
 * service was asleep nearly all day and every visit paid a 30-60s cold start.
 *
 * Netlify runs this on its own scheduler, on the same account already serving
 * the site, so there is no third-party service to sign up for or watch.
 *
 * The target is /api/health, which runs a real SELECT 1 rather than returning
 * a constant — so one ping keeps both the web service and the Neon compute
 * awake, not just the web service.
 */

const DEFAULT_HEALTH_URL = "https://bavas-carwash-backend.onrender.com/api/health";

// A genuinely cold Render instance can take up to a minute to answer, so the
// first attempt is given room rather than being treated as a failure.
const ATTEMPT_TIMEOUT_MS = 90_000;
const ATTEMPTS = 3;
const RETRY_DELAY_MS = 15_000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function ping(url: string, attempt: number) {
  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ATTEMPT_TIMEOUT_MS);
  try {
    const response = await fetch(url, { signal: controller.signal });
    const body = await response.text();
    const seconds = ((Date.now() - started) / 1000).toFixed(1);
    console.log(`attempt ${attempt}: HTTP ${response.status} in ${seconds}s — ${body.slice(0, 120)}`);
    return response.ok;
  } catch (error) {
    const seconds = ((Date.now() - started) / 1000).toFixed(1);
    console.log(`attempt ${attempt}: failed after ${seconds}s — ${(error as Error).message}`);
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export default async () => {
  const url = process.env.HEALTH_URL ?? DEFAULT_HEALTH_URL;

  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    if (await ping(url, attempt)) {
      return new Response("awake", { status: 200 });
    }
    if (attempt < ATTEMPTS) await sleep(RETRY_DELAY_MS);
  }

  // Returning 500 makes a genuine outage visible in the Netlify function log
  // rather than silently passing, which is how the old cron hid its failure.
  console.error(`health check failed ${ATTEMPTS} times against ${url}`);
  return new Response("backend unreachable", { status: 500 });
};

/**
 * Every 10 minutes between 02:00 and 15:59 UTC.
 *
 * Netlify schedules in UTC and India is UTC+5:30, so that window is 07:30 to
 * 21:29 IST — a shade wider than the 08:00-21:00 working day, so the app is
 * already warm when the shop opens. Roughly 84 pings a day keeps the service
 * up about 14 hours daily, well inside Render's 750 free instance-hours a
 * month; pinging around the clock would use ~720 and leave no headroom.
 */
export const config = { schedule: "*/10 2-15 * * *" };
