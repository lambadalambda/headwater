import { expect, test, type Page } from '@playwright/test'

const localOrigin = 'http://127.0.0.1:9444'
const serverOrigin = 'https://social.example'

type DesktopMockOptions = {
  configured?: boolean
  selectFilename?: string | null
  restoreError?: string
  onboardingClient?: boolean
}

async function mockDesktop(page: Page, options: DesktopMockOptions = {}) {
  await page.addInitScript(
    ({ configured, selectFilename, restoreError, onboardingClient, origin }) => {
      const emptyCalls = {
        registrations: 0,
        acknowledgements: [] as string[],
        creates: [] as Array<{ displayName: string }>,
        selections: 0,
        restores: [] as string[],
      }
      let calls = emptyCalls
      try {
        const saved = JSON.parse(window.name) as typeof emptyCalls
        if (saved && typeof saved.registrations === 'number') calls = saved
      } catch {
        // The first document has no persisted desktop test calls.
      }
      const persistCalls = () => {
        window.name = JSON.stringify(calls)
      }
      const client = {
        origin,
        clientId: 'client-desktop',
        clientSecret: 'secret-desktop',
      }

      Object.defineProperty(window, '__desktopCalls', { value: calls })
      Object.defineProperty(window, 'headwaterDesktop', {
        value: {
          getStatus: async () => ({
            state: 'ready',
            origin,
            configured,
            backupRequired: false,
          }),
          getEnrollmentRevision: async () => 0,
          registerOAuthClient: async () => {
            calls.registrations += 1
            persistCalls()
            return client
          },
          acknowledgeOAuthClient: async (clientId: string) => {
            calls.acknowledgements.push(clientId)
            persistCalls()
          },
          selectBackup: async () => {
            calls.selections += 1
            persistCalls()
            return selectFilename === null
              ? null
              : { filename: selectFilename ?? 'headwater-recovery.dnbk' }
          },
          createAccount: async (input: { displayName: string }) => {
            calls.creates.push(input)
            persistCalls()
            return { origin, acct: 'alice@headwater.local', client: onboardingClient ? client : null }
          },
          restoreAccount: async (passphrase: string) => {
            calls.restores.push(passphrase)
            persistCalls()
            if (restoreError) throw new Error(restoreError)
            return { origin, acct: 'alice@headwater.local', client: onboardingClient ? client : null }
          },
          saveBackup: async () => ({ filename: 'headwater-recovery.dnbk' }),
        },
      })
    },
    {
      configured: options.configured ?? true,
      selectFilename: options.selectFilename,
      restoreError: options.restoreError,
      onboardingClient: options.onboardingClient ?? true,
      origin: localOrigin,
    },
  )
}

function desktopCalls(page: Page) {
  return page.evaluate(() => JSON.parse(window.name))
}

async function mockOAuthRegistration(page: Page) {
  await page.route('**/api/v1/apps', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'app-123',
        client_id: 'client-browser',
        client_secret: 'secret-browser',
      }),
    })
  })
}

async function blockAuthorization(page: Page) {
  await page.route('**/oauth/authorize?**', (route) => route.abort())
}

test('shows a focused browser sign-in without public navigation', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'Headwater' })).toBeVisible()
  await expect(page.getByText('Your own social node over encrypted email.')).toBeVisible()
  await expect(page.getByRole('tab', { name: 'Sign in' })).toBeVisible()
  await expect(page.getByLabel('One-time enrollment code')).toBeVisible()
  await expect(page.getByRole('link', { name: /Public feed|Design system/ })).toHaveCount(0)
  await expect(page.getByLabel('Password')).toHaveCount(0)
})

test('registers a browser client with an enrollment code', async ({ page }) => {
  await mockOAuthRegistration(page)
  await page.goto('/')
  await page.getByLabel('One-time enrollment code').fill('browser-enrollment-code-1234')
  await page.getByRole('button', { name: 'Use a different node' }).click()
  await page.getByLabel('Your home server').fill(serverOrigin)

  const registrationPromise = page.waitForRequest(`${serverOrigin}/api/v1/apps`)
  await page.getByRole('button', { name: 'Continue' }).click()
  const registration = await registrationPromise

  expect(registration.method()).toBe('POST')
  expect(registration.postData()).toContain('enrollment_code=browser-enrollment-code-1234')
  await expect(page.getByRole('heading', { name: `Continue to ${serverOrigin}` })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Authorize Headwater' })).toHaveAttribute(
    'href',
    /https:\/\/social\.example\/oauth\/authorize\?/
  )
})

test('opens a configured desktop account through the native OAuth bridge', async ({ page }) => {
  await mockDesktop(page, { configured: true })
  await blockAuthorization(page)
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible()
  const authorizationPromise = page.waitForRequest(`${localOrigin}/oauth/authorize?**`)
  await page.getByRole('button', { name: 'Open this account' }).click()
  await authorizationPromise

  await expect.poll(() => desktopCalls(page)).toMatchObject({
    registrations: 1,
    acknowledgements: ['client-desktop'],
  })
})

test('shows only Create and Restore choices on an unconfigured desktop', async ({ page }) => {
  await mockDesktop(page, { configured: false })
  await page.goto('/')

  await expect(page.getByText('Create a new identity or restore an existing one.')).toBeVisible()
  await expect(page.getByRole('tab', { name: 'Create account' })).toBeVisible()
  await expect(page.getByRole('tab', { name: 'Restore backup' })).toBeVisible()
  await expect(page.getByLabel('Display name')).toBeVisible()
  await expect(page.getByLabel('One-time enrollment code')).toHaveCount(0)
  await expect(page.getByRole('button', { name: /different node|settings/i })).toHaveCount(0)
})

test('creates a desktop account through the native bridge', async ({ page }) => {
  await mockDesktop(page, { configured: false })
  await blockAuthorization(page)
  await page.goto('/')

  await page.getByLabel('Display name').fill('Alice')
  const authorizationPromise = page.waitForRequest(`${localOrigin}/oauth/authorize?**`)
  await page.getByRole('button', { name: 'Create account' }).click()
  await authorizationPromise

  await expect.poll(() => desktopCalls(page)).toMatchObject({
    creates: [{ displayName: 'Alice' }],
    acknowledgements: ['client-desktop'],
  })
})

test('offers immediate sign-in retry after committed desktop creation loses OAuth registration', async ({ page }) => {
  await mockDesktop(page, { configured: false, onboardingClient: false })
  await page.goto('/')

  await page.getByLabel('Display name').fill('Alice')
  await page.getByRole('button', { name: 'Create account' }).click()

  await expect(page.getByRole('heading', { name: 'Account created' })).toBeVisible()
  await expect(page.getByText('could not finish local sign-in')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Try sign-in again' })).toBeVisible()
})

test('creates a browser account and asks for a new enrollment code', async ({ page }) => {
  await page.route('**/api/headwater/signup', async (route) => {
    expect(route.request().postDataJSON()).toMatchObject({ display_name: 'Alice' })
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({ account: { acct: 'alice@headwater.local' } }),
    })
  })

  await page.goto('/')
  await page.getByRole('tab', { name: 'Create account' }).click()
  await page.getByLabel('Display name').fill('Alice')
  await page.getByRole('button', { name: 'Create account' }).click()

  await expect(page.getByRole('heading', { name: 'Account created' })).toBeVisible()
  await expect(page.getByText('alice@headwater.local')).toBeVisible()
  await expect(page.getByLabel('One-time enrollment code')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Continue to sign in' })).toBeDisabled()
})

test('uses custom browser relay and server settings explicitly', async ({ page }) => {
  await page.route(`${serverOrigin}/api/headwater/signup`, async (route) => {
    expect(route.request().postDataJSON()).toMatchObject({
      display_name: 'Alice',
      relay: 'https://relay.example',
      enrollment_code: 'relay-enrollment-code-1234',
    })
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({ account: { acct: 'alice@headwater.local' } }),
    })
  })

  await page.goto('/')
  await page.getByRole('tab', { name: 'Create account' }).click()
  await page.getByLabel('Display name').fill('Alice')
  await page.getByRole('button', { name: 'Relay and server settings' }).click()
  await page.getByLabel('Relay').fill('https://relay.example')
  await page.getByLabel('Custom relay enrollment code').fill('relay-enrollment-code-1234')
  await page.getByLabel('Your home server').fill(serverOrigin)
  await page.getByRole('button', { name: 'Create account' }).click()

  await expect(page.getByRole('heading', { name: 'Account created' })).toBeVisible()
})

test('switches browser conflicts back to sign-in with a typed message', async ({ page }) => {
  await page.route('**/api/headwater/signup', async (route) => {
    await route.fulfill({ status: 409, contentType: 'application/json', body: '{}' })
  })

  await page.goto('/')
  await page.getByRole('tab', { name: 'Create account' }).click()
  await page.getByLabel('Display name').fill('Alice')
  await page.getByRole('button', { name: 'Create account' }).click()

  await expect(page.getByText('This node already has an account — sign in instead.')).toBeVisible()
  await expect(page.getByRole('tab', { name: 'Sign in', selected: true })).toBeVisible()
})

test('restores a browser account and asks for a new enrollment code', async ({ page }) => {
  await page.route('**/api/headwater/restore', async (route) => {
    expect(route.request().method()).toBe('POST')
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ account: { acct: 'alice@headwater.local' } }),
    })
  })

  await page.goto('/')
  await page.getByRole('tab', { name: 'Create account' }).click()
  await page.getByRole('button', { name: 'Restore a backup instead' }).click()
  await page.getByLabel('Backup file').setInputFiles({
    name: 'account.dnbk',
    mimeType: 'application/octet-stream',
    buffer: Buffer.from('encrypted-backup'),
  })
  await page.getByLabel('Backup passphrase').fill('correct horse battery staple')
  await page.getByRole('button', { name: 'Restore account' }).click()

  await expect(page.getByRole('heading', { name: 'Account restored' })).toBeVisible()
  await expect(page.getByText('alice@headwater.local')).toBeVisible()
  await expect(page.getByLabel('One-time enrollment code')).toBeVisible()
})

test('restores a desktop account through native file selection', async ({ page }) => {
  await mockDesktop(page, { configured: false, selectFilename: 'alice-backup.dnbk' })
  await blockAuthorization(page)
  await page.goto('/')

  await page.getByRole('tab', { name: 'Restore backup' }).click()
  await page.getByRole('button', { name: 'Choose backup file…' }).click()
  await expect(page.getByText('alice-backup.dnbk')).toBeVisible()
  await page.getByLabel('Backup passphrase').fill('correct horse battery staple')
  const authorizationPromise = page.waitForRequest(`${localOrigin}/oauth/authorize?**`)
  await page.getByRole('button', { name: 'Restore account' }).click()
  await authorizationPromise

  await expect.poll(() => desktopCalls(page)).toMatchObject({
    selections: 1,
    restores: ['correct horse battery staple'],
    acknowledgements: ['client-desktop'],
  })
})

test('shows desktop restore failures without exposing native paths', async ({ page }) => {
  await mockDesktop(page, {
    configured: false,
    selectFilename: 'alice-backup.dnbk',
    restoreError: 'The backup passphrase is incorrect.',
  })
  await page.goto('/')

  await page.getByRole('tab', { name: 'Restore backup' }).click()
  await page.getByRole('button', { name: 'Choose backup file…' }).click()
  await page.getByLabel('Backup passphrase').fill('wrong passphrase')
  await page.getByRole('button', { name: 'Restore account' }).click()

  await expect(page.getByText('The backup passphrase is incorrect.')).toBeVisible()
  await expect(page.locator('body')).not.toContainText('/Users/')
})

test('keeps the primary browser action visible at narrow widths', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'Headwater' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Continue' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Continue' })).toBeInViewport()
})
