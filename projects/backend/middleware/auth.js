/**
 * Middleware to check if user is authenticated
 */
export const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    })
  }

  // Set req.user for use in routes
  req.user = {
    id: req.session.userId,
    email: req.session.userEmail
  }

  next()
}

/**
 * Middleware to attach user info to request if authenticated
 */
export const optionalAuth = async (req, res, next) => {
  if (req.session.userId) {
    req.userId = req.session.userId
    req.userEmail = req.session.userEmail
  }
  next()
}
