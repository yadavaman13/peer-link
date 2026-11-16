import { describe, it, expect } from 'vitest';
import { validateMessage } from '../../src/signaling/message.validator.js';
import { AppError } from '../../src/shared/AppError.js';

describe('validateMessage', () => {
  it('throws on unknown event type', () => {
    expect(() => validateMessage('UNKNOWN_TYPE', {})).toThrow(AppError);
  });

  it('validates CREATE_TRANSPORT direction', () => {
    expect(() => validateMessage('CREATE_TRANSPORT', { direction: 'send' })).not.toThrow();
    expect(() => validateMessage('CREATE_TRANSPORT', { direction: 'recv' })).not.toThrow();
    expect(() => validateMessage('CREATE_TRANSPORT', { direction: 'invalid' })).toThrow(AppError);
    expect(() => validateMessage('CREATE_TRANSPORT', {})).toThrow(AppError);
  });

  it('validates CONNECT_TRANSPORT fields', () => {
    expect(() =>
      validateMessage('CONNECT_TRANSPORT', {
        transportId: 't-1',
        dtlsParameters: {},
      })
    ).not.toThrow();
    expect(() => validateMessage('CONNECT_TRANSPORT', { transportId: 't-1' })).toThrow(AppError);
    expect(() => validateMessage('CONNECT_TRANSPORT', { dtlsParameters: {} })).toThrow(AppError);
  });

  it('validates PRODUCE fields', () => {
    expect(() =>
      validateMessage('PRODUCE', {
        kind: 'audio',
        rtpParameters: {},
      })
    ).not.toThrow();
    expect(() =>
      validateMessage('PRODUCE', {
        kind: 'video',
        rtpParameters: {},
      })
    ).not.toThrow();
    expect(() =>
      validateMessage('PRODUCE', {
        kind: 'text',
        rtpParameters: {},
      })
    ).toThrow(AppError);
    expect(() => validateMessage('PRODUCE', { kind: 'audio' })).toThrow(AppError);
  });

  it('validates CONSUME fields', () => {
    expect(() =>
      validateMessage('CONSUME', {
        producerId: 'p-1',
        rtpCapabilities: {},
      })
    ).not.toThrow();
    expect(() => validateMessage('CONSUME', { producerId: 'p-1' })).toThrow(AppError);
    expect(() => validateMessage('CONSUME', { rtpCapabilities: {} })).toThrow(AppError);
  });

  it('validates CONSUMER_RESUME fields', () => {
    expect(() => validateMessage('CONSUMER_RESUME', { consumerId: 'c-1' })).not.toThrow();
    expect(() => validateMessage('CONSUMER_RESUME', {})).toThrow(AppError);
  });
});
