import { expect, test } from '@playwright/test'
import { openFresh, playTurn, seedRandom, startGame } from './helpers'

test.beforeEach(async ({ page }) => {
  await seedRandom(page)
  await openFresh(page)
})

test('home shows only the logo and the main actions', async ({ page }) => {
  await expect(page.getByRole('img', { name: 'Egg Up' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'New game' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'How to play' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'History' })).toBeVisible()
})

test('four players get four pawns and play several turns', async ({ page }) => {
  await startGame(page)
  await expect(page.getByTitle('Player 1')).toHaveCount(2)
  for (let turn = 0; turn < 3; turn++) await playTurn(page)
  await page.goto('/history')
  await expect(page.getByText(/^Rolled \d \+ \d = \d+$/)).toHaveCount(3)
})

test('whole class plays with one pawn per group', async ({ page }) => {
  await startGame(page, 'Whole class')
  await expect(page.getByText('Red group').first()).toBeVisible()
  await expect(page.getByTitle('R', { exact: true })).toHaveCount(1)
  await expect(page.getByTitle('B', { exact: true })).toHaveCount(1)
  await playTurn(page)
  await expect(page.getByText(/Blue group/).first()).toBeVisible()
})

test('a right answer gives points to the team', async ({ page }) => {
  await startGame(page)
  for (let turn = 0; turn < 5; turn++) await playTurn(page)
  await page.goto('/history')
  await page.getByRole('button', { name: 'Points' }).click()
  await expect(page.getByText(/Right answer|Challenge won/).first()).toBeVisible()
})

test('the game survives a reload', async ({ page }) => {
  await startGame(page)
  await playTurn(page)
  await page.reload()
  await expect(page.getByRole('button', { name: 'Roll the dice' }).last()).toBeVisible()
  await page.goto('/')
  await expect(page.getByText('Game in progress')).toBeVisible()
})

test('pause, fix a score and end the game', async ({ page }) => {
  await startGame(page)
  await page.getByRole('button', { name: 'Pause' }).first().click()
  await expect(page.getByRole('heading', { name: 'Game paused' })).toBeVisible()
  await page.getByRole('button', { name: 'Fix a score or a pawn' }).click()
  await page.getByRole('button', { name: 'Score +' }).first().click()
  await expect(page.getByText('1', { exact: true }).first()).toBeVisible()
  await page.getByRole('button', { name: 'Back' }).click()
  await page.getByRole('button', { name: 'End the game' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'End the game' }).click()
  await expect(page).toHaveURL(/\/end$/)
})

test('resume goes back to the game', async ({ page }) => {
  await startGame(page)
  await page.getByRole('button', { name: 'Pause' }).first().click()
  await expect(page.getByRole('heading', { name: 'Game paused' })).toBeVisible()
  await page.getByRole('button', { name: 'Resume' }).click()
  await expect(page).toHaveURL(/\/game$/)
  await expect(page.getByRole('button', { name: 'Roll the dice' }).last()).toBeVisible()
})

test('french names default players joueur', async ({ page }) => {
  await page.getByRole('button', { name: 'Settings' }).click()
  await page.getByRole('button', { name: 'Français' }).click()
  await page.goto('/')
  await page.getByRole('button', { name: 'Nouvelle partie' }).click()
  await page.getByRole('radio', { name: /4 joueurs/i }).click()
  await page.getByRole('button', { name: 'Continuer' }).click()
  const lets = page.getByRole('button', { name: "C'est parti" })
  for (let i = 0; i < 12 && !(await lets.isVisible()); i++) {
    await page
      .getByRole('button', { name: /Lancer les dés/ })
      .first()
      .click()
    await page.waitForTimeout(1600)
  }
  await lets.click()
  await expect(page.getByText(/Joueur \d/).first()).toBeVisible()
  await expect(page.getByText(/Player \d/)).toHaveCount(0)
})

test('french switches the interface', async ({ page }) => {
  await page.getByRole('button', { name: 'Settings' }).click()
  await page.getByRole('button', { name: 'Français' }).click()
  await page.getByRole('button', { name: /Retour|Back/ }).click()
  await expect(page.getByRole('button', { name: 'Nouvelle partie' })).toBeVisible()
})

test('how to play has six pages', async ({ page }) => {
  await page.getByRole('button', { name: 'How to play' }).click()
  for (let i = 1; i < 6; i++) await page.getByRole('button', { name: 'Next' }).click()
  await expect(page.getByText('6 / 6')).toBeVisible()
  await page.getByRole('button', { name: 'Got it' }).click()
  await expect(page.getByRole('button', { name: 'New game' })).toBeVisible()
})

test('share page shows a QR code of the app', async ({ page }) => {
  await page.getByRole('button', { name: 'Share the app' }).click()
  await expect(page.getByRole('heading', { name: 'Scan to play' })).toBeVisible()
  await expect(page.getByRole('img', { name: /localhost:4173/ })).toBeVisible()
})

test('players choose their animal and swap when it is taken', async ({ page }) => {
  await page.getByRole('button', { name: 'New game' }).click()
  await page.getByRole('radio', { name: /4 players/i }).click()
  await page.getByRole('button', { name: 'Choose an animal for Player 1' }).first().click()
  const dialog = page.getByRole('dialog', { name: 'Player 1, choose your animal' })
  await expect(dialog.getByRole('button', { name: /Fox/ })).toHaveAttribute('aria-pressed', 'true')
  await expect(dialog.getByRole('button', { name: /Koala/ })).toContainText('Swap with Player 2')
  await dialog.getByRole('button', { name: /Koala/ }).click()
  await expect(dialog).toBeHidden()
  await page.getByRole('button', { name: 'Choose an animal for Player 1' }).first().click()
  await expect(dialog.getByRole('button', { name: /Koala/ })).toHaveAttribute('aria-pressed', 'true')
  await expect(dialog.getByRole('button', { name: /Fox/ })).toContainText('Swap with Player 2')
})

test('the app runs under strict security headers', async ({ page }) => {
  const blocked: string[] = []
  page.on('console', (msg) => {
    if (/Content Security Policy|Refused to/i.test(msg.text())) blocked.push(msg.text())
  })
  const res = await page.goto('/')
  expect(res?.headers()['content-security-policy']).toContain("frame-ancestors 'none'")
  await startGame(page)
  await playTurn(page)
  await page.goto('/board')
  await page.waitForTimeout(1500)
  await page.goto('/share')
  await expect(page.getByText('Scan to play')).toBeVisible()
  expect(blocked).toEqual([])
})
