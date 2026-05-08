export const api = {
  invoke(channel, payload) {
    return window.serverPilot.invoke(channel, payload);
  },
  on(channel, callback) {
    return window.serverPilot.on(channel, callback);
  }
};
