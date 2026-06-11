import '@testing-library/jest-dom'
import { beforeEach } from 'vitest'
import { resetI18nForTests } from '@/lib/i18n/index'

// Module-level i18n store would otherwise leak language/listeners between tests.
beforeEach(() => {
  resetI18nForTests()
})
