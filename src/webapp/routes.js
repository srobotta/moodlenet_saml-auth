import { Suspense } from 'react'
import { Route } from 'react-router-dom'
import HelloWorldPage from './HelloWorldPage.jsx'

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