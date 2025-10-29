import { describe, it, expect } from 'vitest';
import { BackButton } from '../back-button';
import { renderToStaticMarkup } from 'react-dom/server';

describe('BackButton', () => {
  it('should render icon variant with h-8 w-8', () => {
    const markup = renderToStaticMarkup(
      <BackButton onClick={() => {}} variant="icon" />
    );
    
    expect(markup).toContain('h-8');
    expect(markup).toContain('w-8');
    expect(markup).toContain('aria-label="Back"');
  });

  it('should render minimal variant with h-8 w-8', () => {
    const markup = renderToStaticMarkup(
      <BackButton onClick={() => {}} variant="minimal" />
    );
    
    expect(markup).toContain('h-8');
    expect(markup).toContain('w-8');
    expect(markup).toContain('aria-label="Back"');
  });

  it('should render text variant with Back label', () => {
    const markup = renderToStaticMarkup(
      <BackButton onClick={() => {}} variant="text" />
    );
    
    expect(markup).toContain('Back');
  });

  it('should render as disabled when disabled prop is true', () => {
    const markup = renderToStaticMarkup(
      <BackButton onClick={() => {}} disabled />
    );
    
    expect(markup).toContain('disabled');
  });

  it('should default to icon variant', () => {
    const markup = renderToStaticMarkup(
      <BackButton onClick={() => {}} />
    );
    
    expect(markup).toContain('h-8');
    expect(markup).toContain('w-8');
    expect(markup).toContain('aria-label="Back"');
  });
});
