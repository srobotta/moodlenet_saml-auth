import { Suspense } from 'react'
import { Route } from 'react-router-dom'
import HelloWorldPage from './HelloWorldPage.jsx'

console.log('!!!!!!!!!should be establishing routes here');

export const pkgRoutes = {
    routes: (
      <>
        <Route path="hello" element={
            <Suspense fallback="loading...">
                <HelloWorldPage />
            </Suspense>
        }
       />
      </>
    ),
  }


export default pkgRoutes
