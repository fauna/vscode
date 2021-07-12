(function () {
  const vscode = acquireVsCodeApi();

  const specifyDocument = document.getElementById('specifyDocument');
  const roleSelector = document.getElementById('roleId');
  const runAsActivate = document.getElementById('runAsActivate');
  const runAs = document.getElementById('runAs');
  const closeRunAs = document.getElementById('closeRunAs');
  const collectionInput = document.getElementById('collectionInput');
  const idInput = document.getElementById('idInput');

  runAsActivate.addEventListener('click', () => {
    runAsActivate.style.display = 'none';
    runAs.style.display = 'block';
    vscode.postMessage({ type: 'roleChanged', role: 'admin' });
  });

  closeRunAs.addEventListener('click', () => {
    runAsActivate.style.display = 'block';
    runAs.style.display = 'none';
    vscode.postMessage({ type: 'deactivateRunAs' });
  });

  roleSelector.addEventListener('change', event => {
    if (event.target.value === '@doc') {
      specifyDocument.style.display = 'block';
    }
    vscode.postMessage({ type: 'roleChanged', role: event.target.value });
  });

  collectionInput.addEventListener('change', event => {
    vscode.postMessage({
      type: 'collectionChanged',
      collection: event.target.value
    });
  });

  idInput.addEventListener('change', event => {
    vscode.postMessage({
      type: 'idChanged',
      id: event.target.value
    });
  });
})();
