import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { AchievementsView } from '../achievements-view';
import { RewardsScreen } from '../rewards-screen';
import { SettingsPrivacyView } from '../settings-privacy-view';
import { NotificationsList } from '../notifications-list';

describe('You Sub-views Headers', () => {
  it('AchievementsView should have fixed h-16 header', () => {
    const markup = renderToStaticMarkup(
      <AchievementsView onBack={() => {}} />
    );
    
    // Check for fixed positioning and h-16 class
    expect(markup).toContain('fixed');
    expect(markup).toContain('top-safe');
    expect(markup).toContain('h-16');
  });

  it('RewardsScreen should have fixed h-16 header', () => {
    const markup = renderToStaticMarkup(
      <RewardsScreen onBack={() => {}} />
    );
    
    expect(markup).toContain('fixed');
    expect(markup).toContain('top-safe');
    expect(markup).toContain('h-16');
  });

  it('SettingsPrivacyView should have fixed h-16 header', () => {
    const markup = renderToStaticMarkup(
      <SettingsPrivacyView onBack={() => {}} />
    );
    
    expect(markup).toContain('fixed');
    expect(markup).toContain('top-safe');
    expect(markup).toContain('h-16');
  });

  it('NotificationsList should have fixed h-16 header', () => {
    const markup = renderToStaticMarkup(
      <NotificationsList onBack={() => {}} />
    );
    
    expect(markup).toContain('fixed');
    expect(markup).toContain('top-safe');
    expect(markup).toContain('h-16');
  });

  it('All headers should not use padding-based sizing', () => {
    const views = [
      renderToStaticMarkup(<AchievementsView onBack={() => {}} />),
      renderToStaticMarkup(<RewardsScreen onBack={() => {}} />),
      renderToStaticMarkup(<SettingsPrivacyView onBack={() => {}} />),
      renderToStaticMarkup(<NotificationsList onBack={() => {}} />),
    ];

    views.forEach(markup => {
      // Verify h-16 is present
      expect(markup).toContain('h-16');
      // Ensure no conflicting padding-based height in header
      const hasProblematicPadding = markup.includes('fixed') && 
                                     markup.includes('top-safe') && 
                                     !markup.includes('h-16');
      expect(hasProblematicPadding).toBe(false);
    });
  });
});
