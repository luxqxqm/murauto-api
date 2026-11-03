import { describe, expect, it } from 'vitest';
import { canChangeStatus } from '../../src/services/bookingStatus.js';

describe('canChangeStatus', () => {
  it.each([
    ['new', 'confirmed'],
    ['new', 'canceled'],
    ['confirmed', 'done'],
    ['confirmed', 'canceled'],
  ])('allows %s -> %s', (from, to) => {
    expect(canChangeStatus(from, to)).toBe(true);
  });

  it.each([
    ['new', 'done'],
    ['new', 'new'],
    ['confirmed', 'new'],
    ['confirmed', 'confirmed'],
  ])('forbids %s -> %s', (from, to) => {
    expect(canChangeStatus(from, to)).toBe(false);
  });

  it.each(['done', 'canceled'])('%s is final', (from) => {
    for (const to of ['new', 'confirmed', 'done', 'canceled']) {
      expect(canChangeStatus(from, to)).toBe(false);
    }
  });

  it('forbids unknown statuses', () => {
    expect(canChangeStatus('lost', 'new')).toBe(false);
    expect(canChangeStatus('new', 'lost')).toBe(false);
  });
});
