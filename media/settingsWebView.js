(function () {
  const vscode = acquireVsCodeApi();

  const cancelBtn = document.getElementById('cancel');
  const submitBtn = document.getElementById('submit');
  const deleteBtn = document.getElementById('delete');

  if (deleteBtn) {
    deleteBtn.addEventListener('click', e => {
      e.preventDefault();
      vscode.postMessage({ type: 'delete' });
    });
  }

  cancelBtn.addEventListener('click', e => {
    e.preventDefault();
    vscode.postMessage({ type: 'close' });
  });

  submitBtn.addEventListener('click', e => {
    e.preventDefault();

    const elements = document.querySelectorAll('[name]');
    const data = {};
    for (let e of elements) {
      if (e.type === 'number') {
        if (e.type !== '') {
          data[e.name] = +e.value;
        }
        continue;
      }

      if (e.type === 'checkbox') {
        data[e.name] = e.value === 'on';
        continue;
      }

      data[e.name] = e.value;
    }

    submitBtn.disabled = true;
    vscode.postMessage({ type: 'save', data });
  });

  window.addEventListener('message', event => {
    const message = event.data;
    switch (message.type) {
      case 'release_save':
        submitBtn.disabled = false;
        break;
    }
  });
})();
