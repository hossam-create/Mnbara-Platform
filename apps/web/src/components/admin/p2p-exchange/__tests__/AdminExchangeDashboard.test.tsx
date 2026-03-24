import { describe, it, expect } from 'vitest';
import { render } from '../../../../__tests__/utils/test-utils';
import { AdminExchangeDashboard } from '../AdminExchangeDashboard';

describe('AdminExchangeDashboard', () => {
  describe('Rendering', () => {
    it('should render admin dashboard', () => {
      const { container } = render(<AdminExchangeDashboard />);
      expect(container).toBeInTheDocument();
    });

    it('should render without errors', () => {
      expect(() => {
        render(<AdminExchangeDashboard />);
      }).not.toThrow();
    });
  });
});
