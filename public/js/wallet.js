/* Live EIP-1193 wallet demo — read-only provider probe.
   Detects injected providers (multi-wallet aware), connects on demand,
   renders address / chain / balance, follows accountsChanged + chainChanged. */
document.addEventListener('DOMContentLoaded', function () {
  var btn = document.getElementById('w3Btn');
  if (!btn) return;
  var panel = document.getElementById('w3Panel');
  var statusEl = document.getElementById('w3Status');
  var addrEl = document.getElementById('w3Addr');
  var chainEl = document.getElementById('w3Chain');
  var balEl = document.getElementById('w3Bal');
  var copyBtn = document.getElementById('w3Copy');
  var link = document.getElementById('w3Link');
  var note = document.getElementById('w3Note');
  var chips = Array.prototype.slice.call(document.querySelectorAll('#chainChips li'));

  var CHAINS = {
    '0x1': ['Ethereum', 'ETH'],
    '0x539': ['Localhost', 'ETH'],
    '0xaa36a7': ['Sepolia', 'ETH'],
    '0x5': ['Goerli', 'ETH'],
    '0x89': ['Polygon', 'POL'],
    '0x13881': ['Mumbai', 'POL'],
    '0x38': ['BNB Smart Chain', 'BNB'],
    '0x61': ['BSC Testnet', 'tBNB'],
    '0x2105': ['Base', 'ETH'],
    '0xa4b1': ['Arbitrum One', 'ETH'],
    '0xa': ['OP Mainnet', 'ETH']
  };

  var provider = null;
  if (window.ethereum) {
    if (window.ethereum.providers && window.ethereum.providers.length) {
      for (var i = 0; i < window.ethereum.providers.length; i++) {
        if (window.ethereum.providers[i].isMetaMask) { provider = window.ethereum.providers[i]; break; }
      }
      provider = provider || window.ethereum.providers[0];
    } else {
      provider = window.ethereum;
    }
  }

  if (!provider) {
    statusEl.textContent = 'No wallet detected';
    btn.disabled = true;
    btn.textContent = 'Wallet required';
    link.hidden = false;
    note.textContent = 'Install an EIP-1193 wallet such as MetaMask to run this live demo.';
    return;
  }

  var lastAddr = '';
  var currentId = '';

  function setStatus(text, isError) {
    statusEl.textContent = text;
    if (isError) panel.classList.add('err');
    else panel.classList.remove('err');
  }

  function shortAddr(a) {
    return a.slice(0, 6) + '…' + a.slice(-4);
  }

  function normChainId(id) {
    if (typeof id === 'number') return '0x' + id.toString(16);
    return String(id).toLowerCase();
  }

  function setChain(id) {
    currentId = normChainId(id);
    var c = CHAINS[currentId];
    chainEl.textContent = c ? c[0] + ' · ' + currentId : 'Chain ' + currentId;
    chips.forEach(function (li) {
      li.classList.toggle('on', li.getAttribute('data-chain') === currentId);
    });
    return c;
  }

  function refreshBalance() {
    if (!lastAddr || !currentId) return;
    balEl.textContent = 'Reading…';
    provider.request({ method: 'eth_getBalance', params: [lastAddr, 'latest'] })
      .then(function (hex) {
        var c = CHAINS[currentId];
        var symbol = c ? c[1] : 'ETH';
        var value = Number(hex) / 1e18;
        balEl.textContent = value.toFixed(4) + ' ' + symbol;
      })
      .catch(function () {
        balEl.textContent = 'Unavailable on this network';
      });
  }

  function render(addr) {
    lastAddr = addr;
    addrEl.textContent = shortAddr(addr);
    addrEl.title = addr;
    copyBtn.hidden = false;
    btn.textContent = 'Connected';
    btn.disabled = true;
    setStatus('Connected — read-only', false);
    refreshBalance();
  }

  function reset(reason) {
    lastAddr = '';
    addrEl.textContent = '—';
    addrEl.title = '';
    balEl.textContent = '—';
    copyBtn.hidden = true;
    btn.disabled = false;
    btn.textContent = 'Connect wallet';
    setStatus(reason || 'No wallet connected', false);
  }

  function connect() {
    setStatus('Requesting connection…', false);
    btn.disabled = true;
    provider.request({ method: 'eth_requestAccounts' })
      .then(function (accs) {
        btn.disabled = false;
        if (!accs || !accs.length) { setStatus('No account returned', true); return; }
        render(accs[0]);
        return provider.request({ method: 'eth_chainId' }).then(function (id) {
          setChain(id);
          refreshBalance();
        });
      })
      .catch(function (err) {
        btn.disabled = false;
        if (err && err.code === 4001) setStatus('Connection cancelled', false);
        else setStatus('Connection failed' + (err && err.message ? ': ' + err.message : ''), true);
      });
  }

  btn.addEventListener('click', connect);

  copyBtn.addEventListener('click', function () {
    if (!lastAddr) return;
    var done = function () {
      copyBtn.textContent = 'Copied';
      setTimeout(function () { copyBtn.textContent = 'Copy address'; }, 1500);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(lastAddr).then(done).catch(done);
    } else {
      var ta = document.createElement('textarea');
      ta.value = lastAddr;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch (e) {}
      document.body.removeChild(ta);
      done();
    }
  });

  if (typeof provider.on === 'function') {
    provider.on('accountsChanged', function (accs) {
      if (!accs || !accs.length) reset('Wallet disconnected');
      else render(accs[0]);
    });
    provider.on('chainChanged', function (id) {
      setChain(id);
      refreshBalance();
    });
  }
});
