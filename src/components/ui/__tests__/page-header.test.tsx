import { describe, it, expect } from 'vitest';
import { PageHeader } from '../page-header';
import { renderToStaticMarkup } from 'react-dom/server';

describe('PageHeader', () => {
  it('should render with fixed h-16 height', () => {
    const markup = renderToStaticMarkup(
      <PageHeader title="Test Title" />
    );
    
    expect(markup).toContain('h-16');
    expect(markup).not.toContain('pt-4');
    expect(markup).not.toContain('pb-4');
  });

  it('should render with back button', () => {
    const markup = renderToStaticMarkup(
      <PageHeader title="Test Title" onBack={() => {}} />
    );
    
    expect(markup).toContain('h-16');
    expect(markup).toContain('aria-label="Back"');
  });

  it('should render with right slot content', () => {
    const markup = renderToStaticMarkup(
      <PageHeader 
        title="Test Title" 
        right={<button>Action</button>}
      />
    );
    
    expect(markup).toContain('h-16');
    expect(markup).toContain('<button>Action</button>');
  });

  it('should apply custom className while maintaining h-16', () => {
    const markup = renderToStaticMarkup(
      <PageHeader 
        title="Test Title" 
        className="custom-class"
      />
    );
    
    expect(markup).toContain('h-16');
    expect(markup).toContain('custom-class');
  });
});
