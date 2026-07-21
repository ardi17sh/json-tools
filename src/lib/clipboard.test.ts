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

  it('should fallback to execCommand when clipboard API fails', async () => {
    vi.stubGlobal('navigator', {
      clipboard: {
        writeText: vi.fn().mockRejectedValue(new Error('Clipboard unavailable'))
      }
    });

    const mockElement = {
      select: vi.fn(),
      style: {},
    };

    vi.stubGlobal('document', {
      createElement: vi.fn().mockReturnValue(mockElement),
      body: {
        appendChild: vi.fn(),
        removeChild: vi.fn(),
      },
      execCommand: vi.fn().mockReturnValue(true),
    });
    
    const result = await copyToClipboard('test text');
    
    expect(document.execCommand).toHaveBeenCalledWith('copy');
    expect(result).toBe(true);
  });
});
