import adapter from '@sveltejs/adapter-static';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    csp: {
      mode: 'hash',
      directives: {
        'default-src': ['self'],
        'script-src': ['self'],
        'style-src': ['self'],
        'style-src-attr': ['unsafe-inline'],
        'img-src': ['self'],
        'connect-src': ['none'],
        'object-src': ['none'],
        'base-uri': ['none'],
        'frame-ancestors': ['none'],
        'form-action': ['none']
      }
    },
    adapter: adapter({
      pages: 'build',
      assets: 'build',
      fallback: undefined
    })
  }
};

export default config;
