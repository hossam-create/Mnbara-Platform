import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { LanguageProvider } from '../../context/LanguageContext';
import Footer from './Footer';

describe('Footer Component', () => {
  test('renders footer with all columns', () => {
    render(
      <BrowserRouter>
        <LanguageProvider>
          <Footer />
        </LanguageProvider>
      </BrowserRouter>
    );

    // Check if all main column headings are present
    expect(screen.getByText(/buy/i)).toBeInTheDocument();
    expect(screen.getByText(/sell.*travel/i)).toBeInTheDocument();
    expect(screen.getByText(/platform/i)).toBeInTheDocument();
    expect(screen.getByText(/company/i)).toBeInTheDocument();
    expect(screen.getByText(/help.*contact/i)).toBeInTheDocument();
  });

  test('contains links to legal pages', () => {
    render(
      <BrowserRouter>
        <LanguageProvider>
          <Footer />
        </LanguageProvider>
      </BrowserRouter>
    );

    // Check for key legal page links
    expect(screen.getByText(/user agreement/i)).toBeInTheDocument();
    expect(screen.getByText(/privacy policy/i)).toBeInTheDocument();
    expect(screen.getByText(/trust.*guarantee/i)).toBeInTheDocument();
    expect(screen.getByText(/dispute resolution/i)).toBeInTheDocument();
  });

  test('has language toggle', () => {
    render(
      <BrowserRouter>
        <LanguageProvider>
          <Footer />
        </LanguageProvider>
      </BrowserRouter>
    );

    expect(screen.getByText(/EN\/AR/i)).toBeInTheDocument();
  });

  test('has country selector', () => {
    render(
      <BrowserRouter>
        <LanguageProvider>
          <Footer />
        </LanguageProvider>
      </BrowserRouter>
    );

    expect(screen.getByText(/country/i)).toBeInTheDocument();
  });
});