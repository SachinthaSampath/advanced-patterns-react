export const replacePortNumber = (url: string, port: number) => {
  return url.replace(/:(\d+)/, `:${port}`);
};
