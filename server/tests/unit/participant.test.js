import { describe, it, expect, vi } from 'vitest';
import { Participant } from '../../src/modules/participant/index.js';

describe('Participant', () => {
  it('initializes with default properties', () => {
    const mockSocket = { readyState: 1, send: vi.fn() };
    const p = new Participant('part-1', mockSocket);

    expect(p.id).toBe('part-1');
    expect(p.socket).toBe(mockSocket);
    expect(p.roomId).toBeNull();
    expect(p.sendTransport).toBeNull();
    expect(p.recvTransport).toBeNull();
    expect(p.producers.size).toBe(0);
    expect(p.consumers.size).toBe(0);
  });

  it('sends message when socket is OPEN (1)', () => {
    const mockSocket = { readyState: 1, send: vi.fn() };
    const p = new Participant('part-1', mockSocket);

    p.send('TEST_EVENT', { foo: 'bar' });
    expect(mockSocket.send).toHaveBeenCalledWith(
      JSON.stringify({ type: 'TEST_EVENT', payload: { foo: 'bar' } })
    );
  });

  it('does not send message when socket is closed', () => {
    const mockSocket = { readyState: 3 /* CLOSED */, send: vi.fn() };
    const p = new Participant('part-1', mockSocket);

    p.send('TEST_EVENT', { foo: 'bar' });
    expect(mockSocket.send).not.toHaveBeenCalled();
  });

  it('cleans up all producers, consumers, and transports on close', () => {
    const mockSocket = { readyState: 1, send: vi.fn() };
    const p = new Participant('part-1', mockSocket);

    const closeProducer = vi.fn();
    const closeConsumer = vi.fn();
    const closeSendTransport = vi.fn();
    const closeRecvTransport = vi.fn();

    p.producers.set('prod-1', { close: closeProducer });
    p.consumers.set('cons-1', { close: closeConsumer });
    p.sendTransport = { close: closeSendTransport };
    p.recvTransport = { close: closeRecvTransport };

    p.close();

    expect(closeProducer).toHaveBeenCalled();
    expect(closeConsumer).toHaveBeenCalled();
    expect(closeSendTransport).toHaveBeenCalled();
    expect(closeRecvTransport).toHaveBeenCalled();
    expect(p.producers.size).toBe(0);
    expect(p.consumers.size).toBe(0);
  });
});
