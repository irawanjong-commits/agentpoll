import fs from 'node:fs';
const art = JSON.parse(fs.readFileSync('build/AgentPoll.json', 'utf8'));
const AGENT_ID = '0x60b9262456de011f7d15a54cdd8c48baaa8b022f';
const ctorArg = AGENT_ID.slice(2).toLowerCase().padStart(64, '0');
const deployData = art.bytecode + ctorArg;
const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Deploy AgentPoll (one-time setup)</title>
<style>
  body { font-family: system-ui, sans-serif; margin: 24px auto; max-width: 560px; padding: 0 16px; line-height: 1.5; }
  code { word-break: break-all; background: #f2f2f2; padding: 2px 5px; border-radius: 4px; }
  button { font-size: 17px; padding: 12px 20px; border-radius: 10px; border: 0; background: #f0b90b; color: #111; font-weight: 700; width: 100%; margin: 14px 0; }
  button:disabled { opacity: .5; }
  .box { border: 1px solid #ddd; border-radius: 10px; padding: 14px; margin: 14px 0; }
  #log { white-space: pre-wrap; font-size: 14px; }
</style>
</head>
<body>
<h1>Deploy AgentPoll</h1>
<p>One-time deployment of the <b>AgentPoll</b> contract to BNB Chain (BSC mainnet, chain 56).
The contract source is public: <a href="https://github.com/irawanjong-commits/agentpoll/blob/main/contracts/AgentPoll.sol">contracts/AgentPoll.sol</a>.
It holds no funds and has no owner/admin functions. The only constructor argument is the
official Agent ID contract address:</p>
<p><code>${AGENT_ID}</code></p>
<div class="box">
  <div>Your wallet: <span id="who">not connected</span></div>
  <div>Estimated deployment cost: <span id="est">—</span></div>
</div>
<button id="connect">1. Connect MetaMask</button>
<button id="deploy" disabled>2. Deploy AgentPoll</button>
<div id="log"></div>
<script src="https://cdn.jsdelivr.net/npm/ethers@6.13.4/dist/ethers.min.js"></script>
<script>
const DEPLOY_DATA = '${deployData}';
const log = (m) => { document.getElementById('log').textContent += m + '\\n'; };
let provider, signer;
document.getElementById('connect').onclick = async () => {
  try {
    if (!window.ethereum) { log('No wallet found. Open this page inside the MetaMask app browser.'); return; }
    provider = new ethers.BrowserProvider(window.ethereum);
    const net = await provider.getNetwork();
    if (net.chainId !== 56n) { log('Wrong network: chain ' + net.chainId + '. Switch MetaMask to BNB Chain (56) first.'); return; }
    signer = await provider.getSigner();
    const addr = await signer.getAddress();
    document.getElementById('who').textContent = addr;
    const gas = await provider.estimateGas({ from: addr, data: DEPLOY_DATA });
    const fee = await provider.getFeeData();
    const cost = gas * (fee.gasPrice ?? 50000000n);
    document.getElementById('est').textContent = ethers.formatEther(cost) + ' BNB (' + gas.toString() + ' gas)';
    document.getElementById('deploy').disabled = false;
    log('Connected on BNB Chain. Review the estimate, then tap Deploy.');
  } catch (e) { log('Error: ' + (e.message || e)); }
};
document.getElementById('deploy').onclick = async () => {
  try {
    document.getElementById('deploy').disabled = true;
    const tx = await signer.sendTransaction({ data: DEPLOY_DATA });
    log('Transaction sent: ' + tx.hash);
    log('Waiting for confirmation...');
    const receipt = await tx.wait();
    log('CONFIRMED in block ' + receipt.blockNumber);
    log('AgentPoll contract address: ' + receipt.contractAddress);
    log('Send this address back to finish the setup.');
  } catch (e) { log('Error: ' + (e.message || e)); document.getElementById('deploy').disabled = false; }
};
</script>
</body>
</html>`;
fs.writeFileSync('deploy.html', html);
console.log('deploy.html written, deploy data chars:', deployData.length);
