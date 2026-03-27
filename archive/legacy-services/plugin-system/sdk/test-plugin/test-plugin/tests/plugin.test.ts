import { PluginSDK } from '@mnbara/plugin-sdk';
import { main } from '../src/index';

// Mock the plugin SDK
jest.mock('@mnbara/plugin-sdk');

describe('test-plugin Plugin', () => {
  let mockPlugin: jest.Mocked<PluginSDK>;

  beforeEach(() => {
    mockPlugin = {
      initialize: jest.fn().mockResolvedValue(undefined),
      getContext: jest.fn().mockReturnValue({
        log: jest.fn(),
        metadata: {
          id: 'test-plugin',
          name: 'test-plugin',
          version: '1.0.0'
        }
      })
    } as any;

    (PluginSDK as jest.MockedClass<typeof PluginSDK>).mockImplementation(() => mockPlugin);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should initialize successfully', async () => {
    await main();
    
    expect(mockPlugin.initialize).toHaveBeenCalled();
    expect(mockPlugin.getContext).toHaveBeenCalled();
  });

  test('should log plugin startup', async () => {
    const consoleSpy = jest.spyOn(console, 'log');
    
    await main();
    
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('test-plugin plugin started'));
    
    consoleSpy.mockRestore();
  });
});