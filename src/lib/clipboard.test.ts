import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { copyToClipboard } from './clipboard';

describe('copyToClipboard', () => {
  beforeEach(() => {
    vi.stubGlobal('navigator', {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined)
      }
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should copy text using navigator.clipboard.writeText', async () => {
    const result = await copyToClipboard('test text');
    
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('test text');
    expect(result).toBe(true);
  });

  it('should return false when clipboard API fails', async () => {
    vi.stubGlobal('navigator', {
      clipboard: {
        writeText: vi.fn().mockRejectedValue(new Error('Clipboard unavailable'))
      }
    });

    const result = await copyToClipboard('test text');

    expect(result).toBe(false);
  });
});
