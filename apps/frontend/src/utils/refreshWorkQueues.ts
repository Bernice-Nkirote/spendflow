export function refreshWorkQueues() {
  window.dispatchEvent(new Event("approval-notifications:refresh"));
  window.dispatchEvent(new Event("tasks:refresh"));

  window.setTimeout(() => {
    window.dispatchEvent(new Event("approval-notifications:refresh"));
    window.dispatchEvent(new Event("tasks:refresh"));
  }, 750);
}