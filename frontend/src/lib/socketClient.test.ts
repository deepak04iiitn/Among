/**
 * Socket client tests.
 * Mocks socket.io-client and Firebase token retrieval.
 */

// ── Mock Firebase ──────────────────────────────────────────────────────────
jest.mock('./firebaseClient', () => ({
  getIdToken: jest.fn().mockResolvedValue('test_firebase_token'),
}));

// ── Mock socket.io-client ──────────────────────────────────────────────────
const mockSocketOn         = jest.fn();
const mockSocketEmit       = jest.fn();
const mockSocketDisconnect = jest.fn();
const mockSocketRemoveAll  = jest.fn();

const mockSocket = {
  on:                mockSocketOn,
  emit:              mockSocketEmit,
  disconnect:        mockSocketDisconnect,
  removeAllListeners: mockSocketRemoveAll,
  connected:         true,
};

const mockIo = jest.fn().mockReturnValue(mockSocket);

jest.mock('socket.io-client', () => ({
  io: (...args: unknown[]) => mockIo(...args),
}));

import {
  createSocket,
  destroySocket,
  getActiveSocket,
  emitSocketEvent,
} from './socketClient';
import { SOCKET_EVENT } from '../constants/socketEvents';
import { getIdToken } from './firebaseClient';

describe('socketClient', () => {
  beforeEach(() => {
    // Destroy first (may call disconnect), then clear mock counts
    destroySocket();
    jest.clearAllMocks();
    mockIo.mockReturnValue(mockSocket);
  });

  describe('createSocket', () => {
    it('creates a socket with the Firebase token in auth', async () => {
      await createSocket('conv_abc');
      expect(mockIo).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          auth: expect.objectContaining({
            token:          'test_firebase_token',
            conversationId: 'conv_abc',
          }),
        })
      );
    });

    it('returns the same socket when called twice with the same conversation', async () => {
      const socket1 = await createSocket('conv_abc');
      const socket2 = await createSocket('conv_abc');
      expect(socket1).toBe(socket2);
      expect(mockIo).toHaveBeenCalledTimes(1);
    });

    it('destroys old socket when called with a different conversation', async () => {
      await createSocket('conv_abc');
      await createSocket('conv_xyz');
      expect(mockSocketDisconnect).toHaveBeenCalledTimes(1);
      expect(mockSocketRemoveAll).toHaveBeenCalledTimes(1);
      expect(mockIo).toHaveBeenCalledTimes(2);
    });

    it('registers connect listener that emits CONVERSATION_JOIN', async () => {
      await createSocket('conv_abc');
      expect(mockSocketOn).toHaveBeenCalledWith(
        SOCKET_EVENT.CONNECT,
        expect.any(Function)
      );
    });

    it('gets the token even when forceRefresh is not needed', async () => {
      await createSocket('conv_abc');
      expect(getIdToken).toHaveBeenCalled();
    });
  });

  describe('destroySocket', () => {
    it('disconnects and cleans up the active socket', async () => {
      await createSocket('conv_abc');
      destroySocket();
      expect(mockSocketRemoveAll).toHaveBeenCalled();
      expect(mockSocketDisconnect).toHaveBeenCalled();
    });

    it('is safe to call when no socket exists', () => {
      // Should not throw
      expect(() => destroySocket()).not.toThrow();
    });

    it('sets active socket to null after destroy', async () => {
      await createSocket('conv_abc');
      destroySocket();
      expect(getActiveSocket()).toBeNull();
    });
  });

  describe('getActiveSocket', () => {
    it('returns null before any socket is created', () => {
      expect(getActiveSocket()).toBeNull();
    });

    it('returns the socket after createSocket', async () => {
      await createSocket('conv_abc');
      expect(getActiveSocket()).toBe(mockSocket);
    });
  });

  describe('emitSocketEvent', () => {
    it('emits an event on the active socket', async () => {
      await createSocket('conv_abc');
      emitSocketEvent('test_event', { data: 'hello' });
      expect(mockSocketEmit).toHaveBeenCalledWith('test_event', { data: 'hello' });
    });

    it('is a no-op when no socket is active', () => {
      emitSocketEvent('test_event', { data: 'hello' });
      expect(mockSocketEmit).not.toHaveBeenCalled();
    });
  });
});
