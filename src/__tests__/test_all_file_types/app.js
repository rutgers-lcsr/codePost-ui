/**
 * Sample JavaScript file — Express-style request handler.
 */
const RATE_LIMIT_WINDOW_MS = 60_000;
const MAX_REQUESTS = 100;

class RateLimiter {
    #windows = new Map();

    check(clientId) {
        const now = Date.now();
        const record = this.#windows.get(clientId);

        if (!record || now - record.start > RATE_LIMIT_WINDOW_MS) {
            this.#windows.set(clientId, { start: now, count: 1 });
            return { allowed: true, remaining: MAX_REQUESTS - 1 };
        }

        record.count++;
        const remaining = Math.max(0, MAX_REQUESTS - record.count);
        return {
            allowed: record.count <= MAX_REQUESTS,
            remaining,
            retryAfter: record.start + RATE_LIMIT_WINDOW_MS - now,
        };
    }
}

const limiter = new RateLimiter();

async function handleRequest(req, res) {
    const clientId = req.headers['x-client-id'] || req.ip;
    const { allowed, remaining, retryAfter } = limiter.check(clientId);

    res.set('X-RateLimit-Remaining', String(remaining));

    if (!allowed) {
        res.set('Retry-After', String(Math.ceil(retryAfter / 1000)));
        return res.status(429).json({ error: 'Too many requests' });
    }

    const data = await fetchData(req.query);
    return res.json({ ok: true, data });
}

function fetchData(query) {
    return new Promise((resolve) => {
        setTimeout(() => resolve({ items: [], query }), 10);
    });
}

module.exports = { handleRequest, RateLimiter };
