import { useSearchParams } from 'react-router-dom'

export const useRedirect = (defaultPath = '/') => {
  const [searchParams] = useSearchParams()
  const redirectPath = searchParams.get('redirect') || defaultPath
  return redirectPath
}
