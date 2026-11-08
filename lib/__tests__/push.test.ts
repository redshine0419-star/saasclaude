import { describe, expect, it } from 'vitest';
import { deviceLabel, notifyStaff, pushConfigured } from '../push';

describe('push', () => {
  it('VAPID 키가 없으면 보내지 않고 카톡으로 넘긴다', async () => {
    delete process.env.VAPID_PUBLIC_KEY;
    delete process.env.VAPID_PRIVATE_KEY;
    expect(pushConfigured()).toBe(false);
    expect(await notifyStaff('t1', { title: 'a', body: 'b', url: '/x' })).toEqual({ pushed: 0, skipKakao: false });
  });
  it('기기 이름', () => {
    expect(deviceLabel('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit Version/17.0 Mobile Safari/604.1')).toBe('iPhone · Safari');
    expect(deviceLabel('Mozilla/5.0 (Linux; Android 14) AppleWebKit Chrome/120 Mobile Safari')).toBe('Android · Chrome');
  });
});
