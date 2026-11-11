import { describe, it, expect, afterEach } from 'vitest';
import { classifyPath, ga4MeasurementId } from '../index';

describe('classifyPath', () => {
  it('서비스 사이트는 service', () => {
    for (const p of ['/', '/service', '/pricing', '/consult', '/start', '/demo', '/terms', '/privacy']) expect(classifyPath(p)).toEqual({ group: 'service' });
  });
  it('블로그는 blog', () => {
    expect(classifyPath('/blog')).toEqual({ group: 'blog' });
    expect(classifyPath('/blog/tuition-change')).toEqual({ group: 'blog' });
  });
  it('학원 홈페이지는 academy + slug, 데모는 demo', () => {
    expect(classifyPath('/hanul-math')).toEqual({ group: 'academy', slug: 'hanul-math' });
    expect(classifyPath('/hanul-math/consult')).toEqual({ group: 'academy', slug: 'hanul-math' });
    expect(classifyPath('/demo-warm/classes')).toEqual({ group: 'demo', slug: 'demo-warm' });
  });
  it('관리자·로그인·비밀 링크는 보내지 않는다', () => {
    for (const p of ['/platform', '/platform/hidden', '/auth/signin', '/account', '/signup', '/r/abc', '/hanul-math/admin', '/hanul-math/admin/leads', '/hanul-math/test/tok', '/hanul-math/join/tok', '/consult/result/abc', '/demo-warm/admin'])
      expect(classifyPath(p), p).toBeNull();
    expect(classifyPath('/hanul-math/resources/x', '?k=secret')).toBeNull();
    expect(classifyPath('/auth/accept-invite', '?token=x')).toBeNull();
  });
});

describe('ga4MeasurementId', () => {
  const orig = process.env.GA4_MEASUREMENT_ID;
  afterEach(() => { process.env.GA4_MEASUREMENT_ID = orig; });
  it('G- 형식만 받는다', () => {
    process.env.GA4_MEASUREMENT_ID = 'G-ABC123XYZ';
    expect(ga4MeasurementId()).toBe('G-ABC123XYZ');
    for (const bad of ['538101783', "G-1'); alert(1); ('", 'UA-1234', '']) {
      process.env.GA4_MEASUREMENT_ID = bad;
      expect(ga4MeasurementId()).toBeNull();
    }
  });
});
