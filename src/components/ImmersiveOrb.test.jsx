import { render } from '@testing-library/react';
import { expect, test } from 'vitest';
import ImmersiveOrb from './ImmersiveOrb';

test('renders orb with active state', () => {
  const { container } = render(<ImmersiveOrb isSpeaking={true} volume={0.5} />);
  const orb = container.querySelector('.orb-container');
  expect(orb).not.toBeNull();
  expect(orb.className).toContain('active');
});
