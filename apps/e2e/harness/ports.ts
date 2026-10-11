/** Ports chosen to avoid the regular dev servers (web 3000, API 4000). */
export const E2E = {
  webPort: 3100,
  apiPort: 4100,
  smtpPort: 2526,
  codesPort: 2527,
  get webUrl() {
    return `http://localhost:${this.webPort}`;
  },
};
