export default {
  server: {
    proxy: {
      '/api': { target: 'http://localhost:9800', rewrite: (path: string) => path.replace(/^\/api/, '') },
    },
  },
};
