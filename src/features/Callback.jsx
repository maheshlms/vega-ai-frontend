import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import { auth } from '../utils/auth'
import { api } from '../utils/api'

export default function Callback() {
  const { isAuthenticated, getAccessTokenSilently, user } = useAuth0()
  const navigate = useNavigate()

  useEffect(() => {
    const handleCallback = async () => {
      if (isAuthenticated && user) {
        try {
          // Get Auth0 access token
          const accessToken = await getAccessTokenSilently()
          
          // Display token in console
          console.log('='?.repeat(80))
          console.log('🔐 [FRONTEND] RECEIVED AUTH0 ACCESS TOKEN:')
          console.log('Token:', accessToken)
          console.log('User:', user)
          console.log('='?.repeat(80))
          
          // Store Auth0 token temporarily
          auth.storeAuth0Data(accessToken, user)
          
          // Validate token with backend and get user profile
          try {
            const userProfile = await api.getProfile()
            // Update stored user with backend profile (includes role)
            auth.storeAuth0Data(accessToken, { ...user, ...userProfile })
          } catch (error) {
            console.error('Error fetching user profile:', error)
            // Continue anyway with Auth0 user data
          }
          
          // Redirect to dashboard
          navigate('/dashboard')
        } catch (error) {
          console.error('Error handling Auth0 callback:', error)
          navigate('/login')
        }
      }
    }

    handleCallback()
  }, [isAuthenticated, user, getAccessTokenSilently, navigate])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p>Completing login...</p>
      </div>
    </div>
  )
}
