export default {
  server: {
    proxy: {
      '^/scenario': 'http://localhost:9800',
    },
  },
};
