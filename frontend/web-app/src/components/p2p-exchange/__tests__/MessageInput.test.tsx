import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../../../__tests__/utils/test-utils';
import MessageInput from '../MessageInput';

describe('MessageInput', () => {
  const mockOnSend = vi.fn();

  describe('Rendering', () => {
    it('should render message input', () => {
      render(<MessageInput onSend={mockOnSend} />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('should display send button', () => {
      render(<MessageInput onSend={mockOnSend} />);
      expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
    });

    it('should display placeholder text', () => {
      render(<MessageInput onSend={mockOnSend} />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('placeholder');
    });

    it('should display character counter', () => {
      render(<MessageInput onSend={mockOnSend} maxLength={500} />);
      expect(screen.getByText(/0\/500|characters/i)).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should handle text input', async () => {
      const user = userEvent.setup();
      render(<MessageInput onSend={mockOnSend} />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'Hello');

      expect(input).toHaveValue('Hello');
    });

    it('should send message on button click', async () => {
      const user = userEvent.setup();
      render(<MessageInput onSend={mockOnSend} />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'Hello');

      const sendButton = screen.getByRole('button', { name: /send/i });
      await user.click(sendButton);

      expect(mockOnSend).toHaveBeenCalledWith('Hello');
    });

    it('should send message on Enter key', async () => {
      const user = userEvent.setup();
      render(<MessageInput onSend={mockOnSend} />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'Hello{Enter}');

      expect(mockOnSend).toHaveBeenCalledWith('Hello');
    });

    it('should clear input after sending', async () => {
      const user = userEvent.setup();
      render(<MessageInput onSend={mockOnSend} />);

      const input = screen.getByRole('textbox') as HTMLTextAreaElement;
      await user.type(input, 'Hello');

      const sendButton = screen.getByRole('button', { name: /send/i });
      await user.click(sendButton);

      expect(input.value).toBe('');
    });

    it('should not send empty message', async () => {
      const user = userEvent.setup();
      render(<MessageInput onSend={mockOnSend} />);

      const sendButton = screen.getByRole('button', { name: /send/i });
      await user.click(sendButton);

      expect(mockOnSend).not.toHaveBeenCalled();
    });

    it('should not send whitespace-only message', async () => {
      const user = userEvent.setup();
      render(<MessageInput onSend={mockOnSend} />);

      const input = screen.getByRole('textbox');
      await user.type(input, '   ');

      const sendButton = screen.getByRole('button', { name: /send/i });
      await user.click(sendButton);

      expect(mockOnSend).not.toHaveBeenCalled();
    });
  });

  describe('Validation', () => {
    it('should enforce max length', async () => {
      const user = userEvent.setup();
      render(<MessageInput onSend={mockOnSend} maxLength={10} />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'This is a very long message');

      expect(input).toHaveValue('This is a ');
    });

    it('should show character count', async () => {
      const user = userEvent.setup();
      render(<MessageInput onSend={mockOnSend} maxLength={100} />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'Hello');

      expect(screen.getByText(/5\/100|characters/i)).toBeInTheDocument();
    });

    it('should warn when approaching limit', async () => {
      const user = userEvent.setup();
      render(<MessageInput onSend={mockOnSend} maxLength={20} />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'This is a long message');

      expect(screen.getByText(/warning|limit/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper label', () => {
      render(<MessageInput onSend={mockOnSend} />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-label');
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      render(<MessageInput onSend={mockOnSend} />);

      await user.tab();
      expect(screen.getByRole('textbox')).toHaveFocus();
    });

    it('should support Shift+Enter for new line', async () => {
      const user = userEvent.setup();
      render(<MessageInput onSend={mockOnSend} multiline />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'Line 1{Shift>}{Enter}{/Shift}Line 2');

      expect(input).toHaveValue('Line 1\nLine 2');
    });

    it('should have ARIA live region for character count', () => {
      render(<MessageInput onSend={mockOnSend} maxLength={100} />);
      const counter = screen.getByText(/0\/100|characters/i);
      expect(counter).toHaveAttribute('aria-live');
    });
  });

  describe('Button States', () => {
    it('should disable send button when input is empty', () => {
      render(<MessageInput onSend={mockOnSend} />);
      const sendButton = screen.getByRole('button', { name: /send/i });
      expect(sendButton).toBeDisabled();
    });

    it('should enable send button when input has text', async () => {
      const user = userEvent.setup();
      render(<MessageInput onSend={mockOnSend} />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'Hello');

      const sendButton = screen.getByRole('button', { name: /send/i });
      expect(sendButton).not.toBeDisabled();
    });

    it('should show loading state during send', async () => {
      const user = userEvent.setup();
      render(<MessageInput onSend={mockOnSend} />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'Hello');

      const sendButton = screen.getByRole('button', { name: /send/i });
      await user.click(sendButton);

      expect(sendButton).toHaveAttribute('disabled');
    });
  });

  describe('RTL Support', () => {
    it('should render with RTL direction', () => {
      render(<MessageInput onSend={mockOnSend} />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('dir', 'rtl');
    });

    it('should support Arabic text input', async () => {
      const user = userEvent.setup();
      render(<MessageInput onSend={mockOnSend} />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'مرحبا');

      expect(input).toHaveValue('مرحبا');
    });
  });

  describe('Emoji Support', () => {
    it('should handle emoji input', async () => {
      const user = userEvent.setup();
      render(<MessageInput onSend={mockOnSend} />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'Hello 👋');

      expect(input).toHaveValue('Hello 👋');
    });

    it('should show emoji picker button', () => {
      render(<MessageInput onSend={mockOnSend} showEmojiPicker />);
      expect(screen.getByRole('button', { name: /emoji/i })).toBeInTheDocument();
    });
  });

  describe('Attachment Support', () => {
    it('should show attachment button', () => {
      render(<MessageInput onSend={mockOnSend} allowAttachments />);
      expect(screen.getByRole('button', { name: /attach|file/i })).toBeInTheDocument();
    });

    it('should handle file attachment', async () => {
      const user = userEvent.setup();
      const onAttach = vi.fn();
      render(
        <MessageInput
          onSend={mockOnSend}
          allowAttachments
          onAttach={onAttach}
        />
      );

      const attachButton = screen.getByRole('button', { name: /attach|file/i });
      await user.click(attachButton);

      expect(attachButton).toBeInTheDocument();
    });
  });

  describe('Typing Indicator', () => {
    it('should show typing indicator', () => {
      render(<MessageInput onSend={mockOnSend} isTyping />);
      expect(screen.getByText(/typing|composing/i)).toBeInTheDocument();
    });
  });
});
