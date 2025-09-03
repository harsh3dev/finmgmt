/**
 * Helper function to determine if a navigation item is active
 * This function handles the special case where the dashboard root ("/dashboard")
 * should only be active when the user is exactly on that page, not on sub-routes.
 */
export function isNavigationItemActive(currentPath: string, itemHref: string): boolean {
  // For exact dashboard root, only match exactly
  if (itemHref === '/dashboard') {
    return currentPath === '/dashboard'
  }
  
  // For sub-routes, use startsWith but ensure we don't match partial segments
  if (currentPath.startsWith(itemHref)) {
    // Make sure we match the full path segment, not just a prefix
    const remainingPath = currentPath.slice(itemHref.length)
    return remainingPath === '' || remainingPath.startsWith('/')
  }
  
  return false
}
