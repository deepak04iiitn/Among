const mockConnect = jest.fn();
const mockDisconnect = jest.fn();
const mockOn = jest.fn();

jest.mock('mongoose', () => ({
  connect: mockConnect,
  disconnect: mockDisconnect,
  set: jest.fn(),
  connection: { on: mockOn },
}));

import { connectDatabase, disconnectDatabase, _resetConnectionState } from './database';

describe('connectDatabase', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    _resetConnectionState(); // reset isConnected between tests
  });

  it('calls mongoose.connect with the MONGODB_URI env var', async () => {
    mockConnect.mockResolvedValue(undefined);
    await connectDatabase();
    expect(mockConnect).toHaveBeenCalledWith(
      process.env['MONGODB_URI'],
      expect.any(Object)
    );
  });

  it('passes pooling options to mongoose.connect', async () => {
    mockConnect.mockResolvedValue(undefined);
    await connectDatabase();
    expect(mockConnect).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ maxPoolSize: expect.any(Number) })
    );
  });

  it('registers error and disconnected event handlers', async () => {
    mockConnect.mockResolvedValue(undefined);
    await connectDatabase();
    expect(mockOn).toHaveBeenCalledWith('error', expect.any(Function));
    expect(mockOn).toHaveBeenCalledWith('disconnected', expect.any(Function));
  });

  it('throws when mongoose.connect rejects', async () => {
    mockConnect.mockRejectedValue(new Error('Connection refused'));
    await expect(connectDatabase()).rejects.toThrow('Connection refused');
  });

  it('does not reconnect if already connected', async () => {
    mockConnect.mockResolvedValue(undefined);
    await connectDatabase();
    await connectDatabase(); // second call should be no-op
    expect(mockConnect).toHaveBeenCalledTimes(1);
  });
});

describe('disconnectDatabase', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    _resetConnectionState();
  });

  it('calls mongoose.disconnect after connecting', async () => {
    mockConnect.mockResolvedValue(undefined);
    mockDisconnect.mockResolvedValue(undefined);
    await connectDatabase();
    await disconnectDatabase();
    expect(mockDisconnect).toHaveBeenCalled();
  });

  it('does nothing if not connected', async () => {
    mockDisconnect.mockResolvedValue(undefined);
    await disconnectDatabase();
    expect(mockDisconnect).not.toHaveBeenCalled();
  });
});
