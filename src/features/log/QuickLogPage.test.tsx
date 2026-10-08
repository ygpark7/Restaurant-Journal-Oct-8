import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes, useParams } from 'react-router';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/renderWithProviders';
import { QuickLogPage } from './QuickLogPage';

function DetailStub() {
  return <p>Detail page for {useParams().id}</p>;
}

function renderLog(
  route: string,
  options: Parameters<typeof renderWithProviders>[1] = {},
) {
  return renderWithProviders(
    <Routes>
      <Route path="/log" element={<QuickLogPage />} />
      <Route path="/restaurants/:id" element={<DetailStub />} />
    </Routes>,
    { route, ...options },
  );
}

describe('Quick log', () => {
  it('logs a visit from a pre-selected restaurant in a handful of taps', async () => {
    const user = userEvent.setup();
    const { repositories } = renderLog('/log?restaurant=r-little-sprout');

    expect(await screen.findByText('Little Sprout Pizzeria')).toBeInTheDocument();

    await user.click(screen.getByRole('radio', { name: /tasty/i }));
    await user.click(screen.getByRole('radio', { name: /totally relaxed/i }));
    await user.click(screen.getByRole('button', { name: /everything matches/i }));
    await user.type(
      screen.getByLabelText(/note for other parents/i),
      'Crayons at every table.',
    );
    await user.click(screen.getByRole('button', { name: 'Save visit' }));

    expect(
      await screen.findByText('Detail page for r-little-sprout'),
    ).toBeInTheDocument();

    const [visit] = await repositories.visits.listMine();
    expect(visit).toMatchObject({
      restaurantId: 'r-little-sprout',
      foodRating: 4,
      stressLevel: 1,
      note: 'Crayons at every table.',
    });
    // "Everything matches" confirmed the listed values.
    expect(visit?.confirmedAttributes).toMatchObject({
      kidsMenu: true,
      noiseLevel: 'lively',
    });

    // Logging a visit also puts the place under "Been there".
    expect((await repositories.savedPlaces.get('r-little-sprout'))?.status).toBe(
      'been_there',
    );
  });

  it('asks for what is missing instead of saving', async () => {
    const user = userEvent.setup();
    const { repositories } = renderLog('/log');

    await user.click(await screen.findByRole('button', { name: 'Save visit' }));

    const alerts = (await screen.findAllByRole('alert')).map((a) => a.textContent);
    expect(alerts).toEqual(
      expect.arrayContaining([
        'Pick the restaurant you visited.',
        'How was the food?',
        'How stressful was it?',
      ]),
    );
    expect(await repositories.visits.listMine()).toEqual([]);
  });

  it('lets you search for and pick a restaurant', async () => {
    const user = userEvent.setup();
    const { repositories } = renderLog('/log');

    await user.type(await screen.findByLabelText('Where did you go?'), 'duane');
    await user.click(await screen.findByRole('button', { name: /Duane Dough/ }));
    expect(await screen.findByRole('button', { name: 'Change' })).toBeInTheDocument();

    await user.click(screen.getByRole('radio', { name: /amazing/i }));
    await user.click(screen.getByRole('radio', { name: /pretty calm/i }));
    await user.click(screen.getByRole('button', { name: 'Save visit' }));

    expect(await screen.findByText('Detail page for r-duane-dough')).toBeInTheDocument();
    expect((await repositories.visits.listMine())[0]).toMatchObject({
      restaurantId: 'r-duane-dough',
      foodRating: 5,
      stressLevel: 2,
    });
  });

  it('only records the confirmations the parent actually tapped', async () => {
    const user = userEvent.setup();
    const { repositories } = renderLog('/log?restaurant=r-olive-ember');
    await screen.findByText('Olive & Ember');

    const kidsMenu = screen.getByRole('group', { name: 'Kids menu' });
    await user.click(within(kidsMenu).getByRole('button', { name: 'No' }));
    await user.click(screen.getByRole('radio', { name: /okay/i }));
    await user.click(screen.getByRole('radio', { name: /manageable/i }));
    await user.click(screen.getByRole('button', { name: 'Save visit' }));

    await screen.findByText('Detail page for r-olive-ember');
    const [visit] = await repositories.visits.listMine();
    expect(visit?.confirmedAttributes).toEqual({ kidsMenu: false });

    // ...and the restaurant now shows the new value, confirmed just now.
    const updated = await repositories.restaurants.getById('r-olive-ember');
    expect(updated?.attributes.kidsMenu?.value).toBe(false);
  });

  it('keeps the answers and shows an error when saving fails', async () => {
    const user = userEvent.setup();
    // Loads fine at first, then every call fails once the form is ready.
    const { repositories } = renderLog('/log?restaurant=r-olive-ember');
    await screen.findByText('Olive & Ember');

    await user.click(screen.getByRole('radio', { name: /tasty/i }));
    await user.click(screen.getByRole('radio', { name: /pretty calm/i }));

    const original = repositories.visits.create;
    repositories.visits.create = () => Promise.reject(new Error('boom'));
    await user.click(screen.getByRole('button', { name: 'Save visit' }));

    expect(await screen.findByText(/couldn't save your visit/i)).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /tasty/i })).toBeChecked();
    repositories.visits.create = original;
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Save visit' })).toBeEnabled(),
    );
  });
});
