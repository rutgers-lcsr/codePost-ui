// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { describe, expect, it } from 'vitest';

import type { Environment } from '../../../../../../../api-client';
import { splitRequirements, versionChange, type VersionEntry } from '../AutoDetectStatus';
import { buildLogTail, environmentStatus } from '../environmentStatus';

const env = (over: Partial<Environment>): Environment =>
  ({
    buildStatus: 2,
    imageName: 'codepost-env-1:1',
    imageOutOfDate: false,
    rebuildScheduled: false,
    buildLogs: '',
    ...over,
  }) as Environment;

describe('environmentStatus', () => {
  it('is one answer, most urgent first', () => {
    expect(environmentStatus(env({}), false)).toBe('ready');
    expect(environmentStatus(env({ imageOutOfDate: true }), false)).toBe('outOfDate');
    expect(environmentStatus(env({ buildStatus: 3, imageOutOfDate: true }), false)).toBe('failed');
    expect(environmentStatus(env({ rebuildScheduled: true, imageOutOfDate: true }), false)).toBe('queued');
    expect(environmentStatus(env({ buildStatus: 1, rebuildScheduled: true }), false)).toBe('building');
    // A build this page just started, before the server says so.
    expect(environmentStatus(env({}), true)).toBe('building');
  });

  it('tells an unbuilt environment from one waiting on auto-detect', () => {
    expect(environmentStatus(env({ buildStatus: 0, imageName: null }), false)).toBe('notBuilt');
    expect(
      environmentStatus(env({ buildStatus: 0, imageName: null, buildLogs: 'Reset for Auto-Detection...' }), false),
    ).toBe('waiting');
  });
});

describe('buildLogTail', () => {
  it('keeps the last lines without colour codes or blank lines', () => {
    const logs = 'Step 1\nStep 2\n\n\x1b[31mnpm error code E404\x1b[0m\n\nBuild failed: exit 1\n';
    expect(buildLogTail(logs, 2)).toBe('npm error code E404\nBuild failed: exit 1');
  });
});

describe('splitRequirements', () => {
  it('splits a pasted list but not one requirement written with spaces', () => {
    expect(splitRequirements('numpy pandas  scipy==1.13')).toEqual(['numpy', 'pandas', 'scipy==1.13']);
    expect(splitRequirements('numpy >= 1.26, < 3')).toEqual(['numpy >= 1.26, < 3']);
    expect(splitRequirements('  scikit-learn ')).toEqual(['scikit-learn']);
  });
});

describe('versionChange', () => {
  const version = (requirements: string): VersionEntry => ({
    version: 1,
    image_name: 'i',
    requirements,
    built_at: '2026-11-12T00:00:00Z',
    status: 'success',
  });

  it('names a version by what it changed', () => {
    expect(versionChange(version('numpy'), undefined)).toBe('first build, with numpy');
    expect(versionChange(version('numpy\ncolorama'), version('numpy'))).toBe('added colorama');
    expect(versionChange(version('pandas'), version('numpy\npandas'))).toBe('removed numpy');
    expect(versionChange(version('pandas<3'), version('pandas'))).toBe('added pandas<3; removed pandas');
    expect(versionChange(version('numpy'), version('numpy'))).toBe('same packages as the version before');
  });
});
