import checkPackageUpdates from './updateVersionBanner';
import { run } from './main'
import './cli'

jest.mock('./updateVersionBanner', () => ({
  default: jest.fn(),
  __esModule: true
}));
jest.mock('./main', () => ({
  run: jest.fn(),
}));

describe('cli', () => {
  it('should checkForUpdates and invoke main entrypoint', () => {
    expect(checkPackageUpdates).toHaveBeenCalled();
    expect(run).toHaveBeenCalled();
  });
});