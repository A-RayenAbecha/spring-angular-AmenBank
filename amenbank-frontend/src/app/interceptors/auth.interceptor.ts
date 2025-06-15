import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('auth_token');
  
  console.log('🔄 Auth interceptor processing request:', req.url);
  
  if (token && !req.url.includes('/api/auth/login')) {
    console.log('✅ Adding token to request:', req.url);
    const cloned = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
    return next(cloned);
  }
  
  console.log('⏩ Passing through request without token:', req.url);
  return next(req);
};