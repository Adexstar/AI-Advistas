import { describe, expect, it } from 'vitest';
import {
  createAdPath,
  isDraftStatus,
  isLaunchedStatus,
  matchesStatusTab,
  pauseResumePatch,
} from './campaignStatus';

describe('campaign status routing', () => {
  it('treats only the stored draft status as an unfinished ad', () => {
    expect(isDraftStatus('draft')).toBe(true);
    expect(isDraftStatus('Draft')).toBe(true);
    expect(isDraftStatus('active')).toBe(false);
    expect(isDraftStatus('running')).toBe(false);
  });

  it('keeps launched statuses on the campaign workspace', () => {
    expect(isLaunchedStatus('active')).toBe(true);
    expect(isLaunchedStatus('running')).toBe(true);
    expect(isLaunchedStatus('paused')).toBe(true);
    expect(isLaunchedStatus('completed')).toBe(true);
    expect(isLaunchedStatus('draft')).toBe(false);
    expect(isLaunchedStatus('archived')).toBe(false);
  });

  it('groups running campaigns with the active tab', () => {
    expect(matchesStatusTab('running', 'active')).toBe(true);
    expect(matchesStatusTab('active', 'active')).toBe(true);
    expect(matchesStatusTab('draft', 'active')).toBe(false);
  });

  it('remembers whether a paused campaign was running or active', () => {
    const pausedRunning = pauseResumePatch('running', { budgetType: 'daily' });
    expect(pausedRunning.status).toBe('paused');
    expect(pausedRunning.settings).toMatchObject({ budgetType: 'daily', resume_status: 'running' });
    expect(pauseResumePatch('paused', pausedRunning.settings).status).toBe('running');

    const pausedActive = pauseResumePatch('active', {});
    expect(pauseResumePatch('paused', pausedActive.settings).status).toBe('active');
    expect(pauseResumePatch('paused', {}).status).toBe('active');
  });

  it('builds the create-ad resume url', () => {
    expect(createAdPath('abc')).toBe('/create-ad?campaignId=abc&step=2');
  });
});
