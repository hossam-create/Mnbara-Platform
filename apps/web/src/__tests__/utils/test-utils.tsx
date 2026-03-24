import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';

// Create a custom render function that includes providers
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

interface ExtendedRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
}

export function renderWithProviders(
  ui: ReactElement,
  {
    queryClient = createTestQueryClient(),
    ...renderOptions
  }: ExtendedRenderOptions = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>{children}</BrowserRouter>
        </QueryClientProvider>
      </HelmetProvider>
    );
  }

  return { ...render(ui, { wrapper: Wrapper, ...renderOptions }), queryClient };
}

// ============================================================
// HELPER FUNCTIONS FOR COMMON TEST PATTERNS
// ============================================================

import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Wait for an element to appear in the DOM
 * @param testId - The test ID to wait for
 * @param timeout - Optional timeout in milliseconds
 */
export async function waitForElement(testId: string, timeout = 3000) {
  return screen.findByTestId(testId, {}, { timeout });
}

/**
 * Wait for text to appear in the DOM
 * @param text - The text to wait for (can be regex)
 * @param timeout - Optional timeout in milliseconds
 */
export async function waitForText(text: string | RegExp, timeout = 3000) {
  return screen.findByText(text, {}, { timeout });
}

/**
 * Fill a form field by label
 * @param labelText - The label text
 * @param value - The value to type
 */
export async function fillFormField(labelText: string, value: string) {
  const input = screen.getByLabelText(labelText);
  await userEvent.type(input, value);
}

/**
 * Click a button by role and name
 * @param name - The button name (can be regex)
 */
export async function clickButton(name: string | RegExp) {
  const button = screen.getByRole('button', { name });
  await userEvent.click(button);
}

/**
 * Wait for a button to be clickable
 * @param name - The button name (can be regex)
 */
export async function waitForButton(name: string | RegExp) {
  return screen.findByRole('button', { name });
}

/**
 * Get all elements by role
 * @param role - The role to search for
 */
export function getAllByRole(role: string) {
  return screen.getAllByRole(role as any);
}

/**
 * Query for an element without throwing
 * @param testId - The test ID to query
 */
export function queryByTestId(testId: string) {
  return screen.queryByTestId(testId);
}

/**
 * Check if element exists in DOM
 * @param testId - The test ID to check
 */
export function elementExists(testId: string) {
  return screen.queryByTestId(testId) !== null;
}

/**
 * Wait for element to be removed from DOM
 * @param testId - The test ID to wait for removal
 */
export async function waitForElementRemoval(testId: string) {
  await waitFor(() => {
    expect(screen.queryByTestId(testId)).not.toBeInTheDocument();
  });
}

/**
 * Debug helper - logs the current DOM
 */
export function debugDOM() {
  screen.debug();
}

export * from '@testing-library/react';
export { renderWithProviders as render };
