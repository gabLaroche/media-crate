let started = false;

const updateLock = () => {
  const hasOpenDialog = document.querySelector("dialog[open]") !== null;
  document.documentElement.classList.toggle("modal-open", hasOpenDialog);
};

export function useModalScrollLock() {
  const init = () => {
    if (started) return;
    started = true;

    updateLock();

    const observer = new MutationObserver(updateLock);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["open"],
      subtree: true,
    });
  };

  return { init };
}
