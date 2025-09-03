import { isNavigationItemActive } from './navigation-utils'

/**
 * Test cases for navigation item active state detection
 * This helps verify that the Overview tab isn't always highlighted
 */

// Test scenarios
const testCases = [
  // Overview page tests
  {
    currentPath: '/dashboard',
    itemHref: '/dashboard',
    expected: true,
    description: 'Overview should be active on /dashboard'
  },
  {
    currentPath: '/dashboard',
    itemHref: '/dashboard/widgets',
    expected: false,
    description: 'Widgets should NOT be active on /dashboard'
  },
  
  // Widgets page tests
  {
    currentPath: '/dashboard/widgets',
    itemHref: '/dashboard',
    expected: false,
    description: 'Overview should NOT be active on /dashboard/widgets'
  },
  {
    currentPath: '/dashboard/widgets',
    itemHref: '/dashboard/widgets',
    expected: true,
    description: 'Widgets should be active on /dashboard/widgets'
  },
  
  // APIs page tests
  {
    currentPath: '/dashboard/apis',
    itemHref: '/dashboard',
    expected: false,
    description: 'Overview should NOT be active on /dashboard/apis'
  },
  {
    currentPath: '/dashboard/apis',
    itemHref: '/dashboard/apis',
    expected: true,
    description: 'APIs should be active on /dashboard/apis'
  },
  
  // Edge cases
  {
    currentPath: '/dashboard/widgets/edit/123',
    itemHref: '/dashboard/widgets',
    expected: true,
    description: 'Widgets should be active on sub-routes like /dashboard/widgets/edit/123'
  },
  {
    currentPath: '/dashboard/widgets-new',
    itemHref: '/dashboard/widgets',
    expected: false,
    description: 'Should NOT match partial path segments'
  }
]

/**
 * Run navigation tests (for development/testing purposes)
 */
export function runNavigationTests() {
  if (process.env.NODE_ENV !== 'development') {
    return
  }
  
  console.group('🧪 Navigation Active State Tests')
  
  let passed = 0
  let failed = 0
  
  testCases.forEach(({ currentPath, itemHref, expected, description }) => {
    const result = isNavigationItemActive(currentPath, itemHref)
    const success = result === expected
    
    if (success) {
      passed++
      console.log(`✅ ${description}`)
    } else {
      failed++
      console.error(`❌ ${description}`)
      console.error(`   Expected: ${expected}, Got: ${result}`)
      console.error(`   Path: ${currentPath}, Href: ${itemHref}`)
    }
  })
  
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed`)
  console.groupEnd()
  
  return { passed, failed, total: testCases.length }
}
