import { viteSingleFile } from 'vite-plugin-singlefile';

export default {
  server: {
    proxy: {
      '^/scenario': 'http://localhost:9800',
    },
  },
  plugins: [viteSingleFile()],
};
