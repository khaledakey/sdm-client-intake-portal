import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const ORIGINAL_ENV = { ...process.env };

async function loadEmailModule() {
  vi.resetModules();
  return import('../email');
}

function jsonResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

describe('sendEmail via resend', () => {
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
    vi.stubEnv('NODE_ENV', 'production');
    process.env.EMAIL_PROVIDER = 'resend';
    process.env.RESEND_API_KEY = 'test-key';
    vi.restoreAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('returns sent + messageId on a 2xx response', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ id: 'msg_123' }, 200));
    vi.stubGlobal('fetch', fetchMock);

    const { sendEmail } = await loadEmailModule();
    const result = await sendEmail({ to: 'client@example.com', subject: 'Hi', html: '<p>hi</p>', text: 'hi' });

    expect(result).toEqual({ status: 'sent', messageId: 'msg_123' });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.resend.com/emails',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer test-key' }),
      })
    );
  });

  it('returns failed with a safe error message on a 4xx response', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ message: 'Invalid `to` field' }, 422));
    vi.stubGlobal('fetch', fetchMock);

    const { sendEmail } = await loadEmailModule();
    const result = await sendEmail({ to: 'bad', subject: 'Hi', html: '<p>hi</p>', text: 'hi' });

    expect(result).toEqual({ status: 'failed', error: 'Invalid `to` field' });
  });

  it('returns failed on a 5xx response', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({}, 500));
    vi.stubGlobal('fetch', fetchMock);

    const { sendEmail } = await loadEmailModule();
    const result = await sendEmail({ to: 'client@example.com', subject: 'Hi', html: '<p>hi</p>', text: 'hi' });

    expect(result.status).toBe('failed');
  });

  it('returns failed on a network timeout without throwing', async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn().mockImplementation((_url: string, opts: { signal: AbortSignal }) => {
      return new Promise((_resolve, reject) => {
        opts.signal.addEventListener('abort', () => {
          const err = new Error('aborted');
          err.name = 'AbortError';
          reject(err);
        });
      });
    });
    vi.stubGlobal('fetch', fetchMock);

    const { sendEmail } = await loadEmailModule();
    const resultPromise = sendEmail({ to: 'client@example.com', subject: 'Hi', html: '<p>hi</p>', text: 'hi' });

    await vi.advanceTimersByTimeAsync(10_000);
    const result = await resultPromise;
    vi.useRealTimers();

    expect(result.status).toBe('failed');
    if (result.status === 'failed') {
      expect(result.error).toMatch(/timed out/i);
    }
  }, 15_000);

  it('returns failed without calling fetch when RESEND_API_KEY is missing', async () => {
    delete process.env.RESEND_API_KEY;
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const { sendEmail } = await loadEmailModule();
    const result = await sendEmail({ to: 'client@example.com', subject: 'Hi', html: '<p>hi</p>', text: 'hi' });

    expect(result).toEqual({ status: 'failed', error: 'Email provider is not configured (missing RESEND_API_KEY).' });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('sendEmail production safety', () => {
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
    vi.stubEnv('NODE_ENV', 'production');
    vi.restoreAllMocks();
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('fails (does not silently succeed) when EMAIL_PROVIDER is console in production, and never logs the message body', async () => {
    process.env.EMAIL_PROVIDER = 'console';
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const { sendEmail } = await loadEmailModule();
    const result = await sendEmail({
      to: 'client@example.com',
      subject: 'Your SDM Client Portal account is ready',
      html: '<a href="https://portal.example.com/reset-password?token=SECRET_TOKEN">link</a>',
      text: 'Set your password: https://portal.example.com/reset-password?token=SECRET_TOKEN',
    });

    expect(result.status).toBe('failed');

    const allLoggedText = [...errorSpy.mock.calls, ...logSpy.mock.calls].flat().join(' ');
    expect(allLoggedText).not.toContain('SECRET_TOKEN');
  });

  it('defaults to console (and fails) when EMAIL_PROVIDER is unset in production', async () => {
    delete process.env.EMAIL_PROVIDER;
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const { sendEmail } = await loadEmailModule();
    const result = await sendEmail({ to: 'client@example.com', subject: 'Hi', html: '<p>hi</p>', text: 'hi' });

    expect(result.status).toBe('failed');
  });
});

describe('sendEmail in development', () => {
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
    vi.stubEnv('NODE_ENV', 'development');
    delete process.env.EMAIL_PROVIDER;
    vi.restoreAllMocks();
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    vi.unstubAllEnvs();
  });

  it('console provider still works locally and reports sent', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    const { sendEmail } = await loadEmailModule();
    const result = await sendEmail({ to: 'dev@example.com', subject: 'Hi', html: '<p>hi</p>', text: 'hi' });
    expect(result).toEqual({ status: 'sent' });
  });
});
